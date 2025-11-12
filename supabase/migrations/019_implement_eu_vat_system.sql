/*
  # Implement EU VAT System with France as Main Market
  1. Purpose: Add comprehensive VAT calculation system following EU rules
  2. Schema: Tax rules, VAT rates, country classifications, B2B/B2C logic
  3. Security: Maintain existing RLS policies and data integrity
*/

-- Create VAT rates table for EU countries
CREATE TABLE IF NOT EXISTS vat_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  country_name text NOT NULL,
  standard_rate decimal(5,2) NOT NULL, -- Standard VAT rate (e.g., 20.00 for 20%)
  reduced_rate decimal(5,2) DEFAULT NULL, -- Reduced rate if applicable
  is_eu_country boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tax_rules table for business logic
CREATE TABLE IF NOT EXISTS tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  description text,
  seller_country text NOT NULL DEFAULT 'FR', -- France as main market
  buyer_country text NOT NULL,
  buyer_type text NOT NULL CHECK (buyer_type IN ('individual', 'company')),
  has_valid_vat boolean DEFAULT false,
  apply_vat boolean NOT NULL DEFAULT true,
  vat_rate decimal(5,2) DEFAULT 20.00,
  vat_country text DEFAULT 'FR', -- Which country's VAT to apply
  rule_type text DEFAULT 'standard' CHECK (rule_type IN ('standard', 'reverse_charge', 'export')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Insert EU VAT rates (2024 standard rates)
INSERT INTO vat_rates (country_code, country_name, standard_rate, reduced_rate, is_eu_country) VALUES
  ('FR', 'France', 20.00, 5.50, true),
  ('DE', 'Germany', 19.00, 7.00, true),
  ('IT', 'Italy', 22.00, 10.00, true),
  ('ES', 'Spain', 21.00, 10.00, true),
  ('NL', 'Netherlands', 21.00, 9.00, true),
  ('BE', 'Belgium', 21.00, 6.00, true),
  ('PL', 'Poland', 23.00, 8.00, true),
  ('CZ', 'Czech Republic', 21.00, 12.00, true),
  ('AT', 'Austria', 20.00, 10.00, true),
  ('PT', 'Portugal', 23.00, 6.00, true),
  ('SE', 'Sweden', 25.00, 12.00, true),
  ('DK', 'Denmark', 25.00, NULL, true),
  ('FI', 'Finland', 24.00, 14.00, true),
  ('IE', 'Ireland', 23.00, 13.50, true),
  ('LU', 'Luxembourg', 17.00, 8.00, true),
  ('RO', 'Romania', 19.00, 9.00, true),
  ('BG', 'Bulgaria', 20.00, 9.00, true),
  ('HR', 'Croatia', 25.00, 13.00, true),
  ('SI', 'Slovenia', 22.00, 9.50, true),
  ('SK', 'Slovakia', 20.00, 10.00, true),
  ('EE', 'Estonia', 20.00, 9.00, true),
  ('LV', 'Latvia', 21.00, 12.00, true),
  ('LT', 'Lithuania', 21.00, 9.00, true),
  ('CY', 'Cyprus', 19.00, 9.00, true),
  ('MT', 'Malta', 18.00, 7.00, true),
  ('GR', 'Greece', 24.00, 13.00, true),
  ('HU', 'Hungary', 27.00, 18.00, true),
  -- Non-EU countries
  ('GB', 'United Kingdom', 20.00, 5.00, false),
  ('CH', 'Switzerland', 7.70, 2.50, false),
  ('NO', 'Norway', 25.00, 15.00, false),
  ('US', 'United States', 0.00, NULL, false),
  ('OTHER', 'Other Countries', 0.00, NULL, false)
ON CONFLICT (country_code) DO UPDATE SET
  standard_rate = EXCLUDED.standard_rate,
  reduced_rate = EXCLUDED.reduced_rate,
  updated_at = now();

-- Insert tax rules following EU VAT legislation
INSERT INTO tax_rules (rule_name, description, seller_country, buyer_country, buyer_type, has_valid_vat, apply_vat, vat_rate, vat_country, rule_type) VALUES
  
  -- FRANCE (Main Market) - Always apply French VAT 20%
  ('FR_B2C', 'France B2C - Always 20% French VAT', 'FR', 'FR', 'individual', false, true, 20.00, 'FR', 'standard'),
  ('FR_B2B_NO_VAT', 'France B2B without VAT number - 20% French VAT', 'FR', 'FR', 'company', false, true, 20.00, 'FR', 'standard'),
  ('FR_B2B_VAT', 'France B2B with VAT number - 20% French VAT', 'FR', 'FR', 'company', true, true, 20.00, 'FR', 'standard'),
  
  -- EU COUNTRIES - B2C (Individuals): French VAT applies
  ('EU_B2C', 'EU B2C - French VAT applies (seller country)', 'FR', 'OTHER', 'individual', false, true, 20.00, 'FR', 'standard'),
  
  -- EU COUNTRIES - B2B with VAT: Reverse Charge (No VAT)
  ('EU_B2B_VAT', 'EU B2B with valid VAT - Reverse charge (no VAT)', 'FR', 'OTHER', 'company', true, false, 0.00, 'BUYER', 'reverse_charge'),
  
  -- EU COUNTRIES - B2B without VAT: French VAT applies
  ('EU_B2B_NO_VAT', 'EU B2B without VAT - French VAT applies', 'FR', 'OTHER', 'company', false, true, 20.00, 'FR', 'standard'),
  
  -- NON-EU COUNTRIES - Export (No VAT)
  ('NON_EU_EXPORT', 'Non-EU countries - Export (no VAT)', 'FR', 'NON_EU', 'individual', false, false, 0.00, 'NONE', 'export'),
  ('NON_EU_B2B_EXPORT', 'Non-EU B2B - Export (no VAT)', 'FR', 'NON_EU', 'company', false, false, 0.00, 'NONE', 'export')

ON CONFLICT DO NOTHING;

-- Add VAT-related columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS buyer_type text DEFAULT 'individual' CHECK (buyer_type IN ('individual', 'company')),
ADD COLUMN IF NOT EXISTS buyer_vat_number text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vat_rate decimal(5,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS vat_country text DEFAULT 'FR',
ADD COLUMN IF NOT EXISTS tax_rule_applied text DEFAULT 'FR_B2C',
ADD COLUMN IF NOT EXISTS price_includes_vat boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS subtotal_before_vat decimal(10,2) DEFAULT 0.00;

-- Add VAT-related columns to cart_items for preview
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS calculated_vat_rate decimal(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_includes_vat boolean DEFAULT true;

-- Create function to determine buyer type based on billing data
CREATE OR REPLACE FUNCTION determine_buyer_type(
  vat_number text DEFAULT NULL,
  company_name text DEFAULT NULL
)
RETURNS text AS $$
BEGIN
  -- If VAT number is provided and not empty, it's likely a company
  IF vat_number IS NOT NULL AND trim(vat_number) != '' THEN
    RETURN 'company';
  END IF;
  
  -- If company name is provided and not empty, it's likely a company
  IF company_name IS NOT NULL AND trim(company_name) != '' THEN
    RETURN 'company';
  END IF;
  
  -- Default to individual
  RETURN 'individual';
END;
$$ LANGUAGE plpgsql;

-- Create function to validate EU VAT number format (basic)
CREATE OR REPLACE FUNCTION validate_vat_format(
  vat_number text,
  country_code text
)
RETURNS boolean AS $$
BEGIN
  -- Remove spaces and convert to uppercase
  vat_number := upper(replace(vat_number, ' ', ''));
  
  -- Basic format validation by country
  CASE country_code
    WHEN 'FR' THEN RETURN vat_number ~ '^FR[0-9]{11}$';
    WHEN 'DE' THEN RETURN vat_number ~ '^DE[0-9]{9}$';
    WHEN 'IT' THEN RETURN vat_number ~ '^IT[0-9]{11}$';
    WHEN 'ES' THEN RETURN vat_number ~ '^ES[A-Z0-9][0-9]{7}[A-Z0-9]$';
    WHEN 'NL' THEN RETURN vat_number ~ '^NL[0-9]{9}B[0-9]{2}$';
    WHEN 'BE' THEN RETURN vat_number ~ '^BE0[0-9]{9}$';
    WHEN 'PL' THEN RETURN vat_number ~ '^PL[0-9]{10}$';
    WHEN 'RO' THEN RETURN vat_number ~ '^RO[0-9]{2,10}$';
    ELSE 
      -- For other countries, just check if it starts with country code and has numbers
      RETURN vat_number ~ ('^' || country_code || '[0-9A-Z]+$');
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create comprehensive VAT calculation function
CREATE OR REPLACE FUNCTION calculate_vat_for_order(
  buyer_country text,
  buyer_vat_number text DEFAULT NULL,
  buyer_company_name text DEFAULT NULL,
  order_subtotal decimal(10,2) DEFAULT 0.00
)
RETURNS TABLE (
  should_apply_vat boolean,
  vat_rate decimal(5,2),
  vat_amount decimal(10,2),
  vat_country text,
  tax_rule_applied text,
  buyer_type text,
  has_valid_vat boolean,
  price_includes_vat boolean,
  subtotal_before_vat decimal(10,2),
  total_with_vat decimal(10,2),
  display_note text
) AS $$
DECLARE
  detected_buyer_type text;
  is_eu_country boolean;
  has_valid_vat_number boolean := false;
  applicable_rule record;
  french_vat_rate decimal(5,2) := 20.00;
  calculated_vat_amount decimal(10,2);
  net_subtotal decimal(10,2);
  gross_total decimal(10,2);
  rule_description text;
BEGIN
  -- Determine buyer type
  detected_buyer_type := determine_buyer_type(buyer_vat_number, buyer_company_name);
  
  -- Check if buyer country is EU
  SELECT COALESCE(vr.is_eu_country, false) INTO is_eu_country
  FROM vat_rates vr 
  WHERE vr.country_code = buyer_country;
  
  -- If country not found, assume non-EU
  IF is_eu_country IS NULL THEN
    is_eu_country := false;
  END IF;
  
  -- Validate VAT number if provided
  IF buyer_vat_number IS NOT NULL AND trim(buyer_vat_number) != '' THEN
    has_valid_vat_number := validate_vat_format(buyer_vat_number, buyer_country);
  END IF;
  
  -- Determine tax rule to apply
  IF buyer_country = 'FR' THEN
    -- FRANCE: Always apply 20% French VAT regardless of buyer type
    should_apply_vat := true;
    vat_rate := french_vat_rate;
    vat_country := 'FR';
    tax_rule_applied := CASE 
      WHEN detected_buyer_type = 'company' AND has_valid_vat_number THEN 'FR_B2B_VAT'
      WHEN detected_buyer_type = 'company' THEN 'FR_B2B_NO_VAT'
      ELSE 'FR_B2C'
    END;
    price_includes_vat := true;
    rule_description := 'French VAT 20% (domestic)';
    
  ELSIF is_eu_country AND detected_buyer_type = 'company' AND has_valid_vat_number THEN
    -- EU B2B with valid VAT: Reverse charge (no VAT)
    should_apply_vat := false;
    vat_rate := 0.00;
    vat_country := 'BUYER';
    tax_rule_applied := 'EU_B2B_VAT';
    price_includes_vat := false;
    rule_description := 'EU B2B reverse charge (VAT paid in buyer country)';
    
  ELSIF is_eu_country THEN
    -- EU B2C or B2B without valid VAT: French VAT applies
    should_apply_vat := true;
    vat_rate := french_vat_rate;
    vat_country := 'FR';
    tax_rule_applied := CASE 
      WHEN detected_buyer_type = 'company' THEN 'EU_B2B_NO_VAT'
      ELSE 'EU_B2C'
    END;
    price_includes_vat := true;
    rule_description := 'French VAT 20% (EU cross-border)';
    
  ELSE
    -- Non-EU: Export (no VAT)
    should_apply_vat := false;
    vat_rate := 0.00;
    vat_country := 'NONE';
    tax_rule_applied := 'NON_EU_EXPORT';
    price_includes_vat := false;
    rule_description := 'Export sale (no EU VAT)';
  END IF;
  
  -- Calculate amounts
  IF price_includes_vat AND should_apply_vat THEN
    -- Prices include VAT, calculate net amount
    net_subtotal := order_subtotal / (1 + vat_rate / 100);
    calculated_vat_amount := order_subtotal - net_subtotal;
    gross_total := order_subtotal;
  ELSIF should_apply_vat THEN
    -- Prices exclude VAT, add VAT
    net_subtotal := order_subtotal;
    calculated_vat_amount := order_subtotal * (vat_rate / 100);
    gross_total := order_subtotal + calculated_vat_amount;
  ELSE
    -- No VAT
    net_subtotal := order_subtotal;
    calculated_vat_amount := 0.00;
    gross_total := order_subtotal;
  END IF;
  
  -- Return results
  RETURN QUERY SELECT 
    should_apply_vat,
    vat_rate,
    calculated_vat_amount,
    vat_country,
    tax_rule_applied,
    detected_buyer_type,
    has_valid_vat_number,
    price_includes_vat,
    net_subtotal,
    gross_total,
    rule_description;
END;
$$ LANGUAGE plpgsql;

-- Create function to get product price with VAT for display
CREATE OR REPLACE FUNCTION get_product_display_price(
  base_price decimal(10,2),
  sale_price decimal(10,2) DEFAULT NULL,
  buyer_country text DEFAULT 'FR',
  buyer_vat_number text DEFAULT NULL,
  buyer_company_name text DEFAULT NULL
)
RETURNS TABLE (
  display_price decimal(10,2),
  original_price decimal(10,2),
  vat_rate decimal(5,2),
  includes_vat boolean,
  price_note text
) AS $$
DECLARE
  working_price decimal(10,2);
  vat_calc record;
BEGIN
  -- Use sale price if available, otherwise base price
  working_price := COALESCE(sale_price, base_price);
  
  -- Calculate VAT for this product
  SELECT * INTO vat_calc 
  FROM calculate_vat_for_order(buyer_country, buyer_vat_number, buyer_company_name, working_price);
  
  -- Return display information
  RETURN QUERY SELECT 
    CASE 
      WHEN vat_calc.price_includes_vat THEN working_price
      ELSE vat_calc.total_with_vat
    END as display_price,
    working_price as original_price,
    vat_calc.vat_rate,
    vat_calc.price_includes_vat,
    CASE 
      WHEN vat_calc.should_apply_vat THEN 
        'Incl. VAT ' || vat_calc.vat_rate || '% (' || vat_calc.vat_country || ')'
      WHEN vat_calc.tax_rule_applied = 'EU_B2B_VAT' THEN
        'Excl. VAT (reverse charge)'
      ELSE 
        'Excl. VAT (export)'
    END as price_note;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate VAT on order creation
CREATE OR REPLACE FUNCTION calculate_order_vat_trigger()
RETURNS TRIGGER AS $$
DECLARE
  vat_calc record;
BEGIN
  -- Calculate VAT based on order details
  SELECT * INTO vat_calc 
  FROM calculate_vat_for_order(
    NEW.billing_country, 
    NEW.buyer_vat_number, 
    NEW.billing_first_name || ' ' || NEW.billing_last_name,
    NEW.subtotal
  );
  
  -- Update order with VAT calculation results
  NEW.buyer_type := vat_calc.buyer_type;
  NEW.vat_rate := vat_calc.vat_rate;
  NEW.vat_country := vat_calc.vat_country;
  NEW.tax_rule_applied := vat_calc.tax_rule_applied;
  NEW.price_includes_vat := vat_calc.price_includes_vat;
  NEW.subtotal_before_vat := vat_calc.subtotal_before_vat;
  NEW.tax_amount := vat_calc.vat_amount;
  NEW.total_amount := vat_calc.total_with_vat + COALESCE(NEW.shipping_amount, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order VAT calculation
DROP TRIGGER IF EXISTS order_vat_calculation_trigger ON orders;
CREATE TRIGGER order_vat_calculation_trigger
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_vat_trigger();

-- Enable RLS for new tables
ALTER TABLE vat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for VAT tables
CREATE POLICY "Anyone can view VAT rates" ON vat_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage VAT rates" ON vat_rates
  FOR ALL USING (check_admin_role());

CREATE POLICY "Anyone can view tax rules" ON tax_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tax rules" ON tax_rules
  FOR ALL USING (check_admin_role());

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_vat_rates_country ON vat_rates(country_code);
CREATE INDEX IF NOT EXISTS idx_vat_rates_active ON vat_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_tax_rules_buyer_country ON tax_rules(buyer_country, buyer_type);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_type ON orders(buyer_type);
CREATE INDEX IF NOT EXISTS idx_orders_vat_country ON orders(vat_country);

-- Add updated_at triggers
CREATE TRIGGER update_vat_rates_updated_at
  BEFORE UPDATE ON vat_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample VAT calculation test
DO $$
DECLARE
  test_result record;
BEGIN
  -- Test French individual purchase
  SELECT * INTO test_result FROM calculate_vat_for_order('FR', NULL, NULL, 100.00);
  RAISE NOTICE 'French B2C test: VAT: %, Rate: %, Rule: %', 
    test_result.should_apply_vat, test_result.vat_rate, test_result.tax_rule_applied;
  
  -- Test German company with VAT
  SELECT * INTO test_result FROM calculate_vat_for_order('DE', 'DE123456789', 'Test GmbH', 100.00);
  RAISE NOTICE 'German B2B VAT test: VAT: %, Rate: %, Rule: %', 
    test_result.should_apply_vat, test_result.vat_rate, test_result.tax_rule_applied;
  
  -- Test German individual
  SELECT * INTO test_result FROM calculate_vat_for_order('DE', NULL, NULL, 100.00);
  RAISE NOTICE 'German B2C test: VAT: %, Rate: %, Rule: %', 
    test_result.should_apply_vat, test_result.vat_rate, test_result.tax_rule_applied;
    
  -- Test US export
  SELECT * INTO test_result FROM calculate_vat_for_order('US', NULL, NULL, 100.00);
  RAISE NOTICE 'US export test: VAT: %, Rate: %, Rule: %', 
    test_result.should_apply_vat, test_result.vat_rate, test_result.tax_rule_applied;
END $$;

-- Final verification
DO $$
DECLARE
    vat_rates_count integer;
    tax_rules_count integer;
    france_vat_rate decimal(5,2);
BEGIN
    SELECT COUNT(*) INTO vat_rates_count FROM vat_rates WHERE is_active = true;
    SELECT COUNT(*) INTO tax_rules_count FROM tax_rules WHERE is_active = true;
    
    SELECT standard_rate INTO france_vat_rate FROM vat_rates WHERE country_code = 'FR';
    
    RAISE NOTICE 'Migration 019 completed - VAT rates: %, Tax rules: %, France VAT: %%', 
        vat_rates_count, tax_rules_count, france_vat_rate;
END $$;
