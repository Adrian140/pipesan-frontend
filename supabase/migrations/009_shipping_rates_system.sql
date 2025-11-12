/*
  # Advanced Shipping Rates System with Weight Intervals
  1. Purpose: Create comprehensive shipping system based on weight intervals per country
  2. Schema: shipping_rates table with weight intervals, categories update, products weight field
  3. Security: Admin-only access for rate management, public read for calculations
*/

-- Drop existing shipping_rates table if it exists to rebuild with new structure
DROP TABLE IF EXISTS shipping_rates CASCADE;

-- Create new shipping_rates table with weight-based intervals
CREATE TABLE shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text NOT NULL,
  weight_min_grams integer NOT NULL DEFAULT 0,
  weight_max_grams integer DEFAULT NULL, -- NULL means unlimited (10000+ grams)
  shipping_cost decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT chk_weight_min_positive CHECK (weight_min_grams >= 0),
  CONSTRAINT chk_weight_max_greater CHECK (weight_max_grams IS NULL OR weight_max_grams > weight_min_grams),
  CONSTRAINT chk_shipping_cost_positive CHECK (shipping_cost >= 0),
  CONSTRAINT chk_currency_valid CHECK (currency IN ('EUR', 'USD', 'GBP', 'CHF')),
  
  -- Unique constraint to prevent overlapping weight ranges per country
  UNIQUE(country_code, weight_min_grams, weight_max_grams)
);

-- Add weight field to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight_grams integer DEFAULT 0;

-- Update existing products to have default weight
UPDATE products SET weight_grams = 500 WHERE weight_grams = 0 OR weight_grams IS NULL;

-- Add constraint to ensure positive weight
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS chk_products_weight_positive CHECK (weight_grams >= 0);

-- Clear existing categories and rebuild with new French categories
DELETE FROM products WHERE category_id IS NOT NULL;
DELETE FROM categories;

-- Insert new product categories (French names as requested)
INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Raccords de tuyauterie', 'raccords-tuyauterie', 'Raccords et fittings pour tuyauterie professionnelle', 1, true),
  (gen_random_uuid(), 'Vannes', 'vannes', 'Vannes à bille, vannes d''arrêt et robinets professionnels', 2, true),
  (gen_random_uuid(), 'Arrosage & tuyaux', 'arrosage-tuyaux', 'Tuyaux flexibles, raccords d''arrosage et connecteurs', 3, true),
  (gen_random_uuid(), 'Connecteurs', 'connecteurs', 'Connecteurs rapides, unions et adaptateurs', 4, true),
  (gen_random_uuid(), 'Joints & étanchéité (PTFE)', 'joints-etancheite-ptfe', 'Joints PTFE, garnitures et solutions d''étanchéité', 5, true),
  (gen_random_uuid(), 'Accessoires', 'accessoires', 'Accessoires d''installation et outillage', 6, true),
  (gen_random_uuid(), 'Lots (2-pack / 3-pack)', 'lots-pack', 'Lots multi-pièces et kits d''installation', 7, true);

-- Insert comprehensive shipping rates by country and weight intervals
INSERT INTO shipping_rates (country_code, country_name, weight_min_grams, weight_max_grams, shipping_cost, currency, is_active) VALUES
  -- France
  ('FR', 'France', 0, 1000, 9.99, 'EUR', true),
  ('FR', 'France', 1000, 5000, 14.99, 'EUR', true),
  ('FR', 'France', 5000, 10000, 19.99, 'EUR', true),
  ('FR', 'France', 10000, NULL, 29.99, 'EUR', true),

  -- Germany
  ('DE', 'Germany', 0, 1000, 12.99, 'EUR', true),
  ('DE', 'Germany', 1000, 5000, 17.99, 'EUR', true),
  ('DE', 'Germany', 5000, 10000, 24.99, 'EUR', true),
  ('DE', 'Germany', 10000, NULL, 34.99, 'EUR', true),

  -- Italy
  ('IT', 'Italy', 0, 1000, 11.99, 'EUR', true),
  ('IT', 'Italy', 1000, 5000, 16.99, 'EUR', true),
  ('IT', 'Italy', 5000, 10000, 22.99, 'EUR', true),
  ('IT', 'Italy', 10000, NULL, 32.99, 'EUR', true),

  -- Spain
  ('ES', 'Spain', 0, 1000, 11.99, 'EUR', true),
  ('ES', 'Spain', 1000, 5000, 16.99, 'EUR', true),
  ('ES', 'Spain', 5000, 10000, 22.99, 'EUR', true),
  ('ES', 'Spain', 10000, NULL, 32.99, 'EUR', true),

  -- Belgium
  ('BE', 'Belgium', 0, 1000, 10.99, 'EUR', true),
  ('BE', 'Belgium', 1000, 5000, 15.99, 'EUR', true),
  ('BE', 'Belgium', 5000, 10000, 21.99, 'EUR', true),
  ('BE', 'Belgium', 10000, NULL, 31.99, 'EUR', true),

  -- Netherlands
  ('NL', 'Netherlands', 0, 1000, 10.99, 'EUR', true),
  ('NL', 'Netherlands', 1000, 5000, 15.99, 'EUR', true),
  ('NL', 'Netherlands', 5000, 10000, 21.99, 'EUR', true),
  ('NL', 'Netherlands', 10000, NULL, 31.99, 'EUR', true),

  -- Poland
  ('PL', 'Poland', 0, 1000, 13.99, 'EUR', true),
  ('PL', 'Poland', 1000, 5000, 18.99, 'EUR', true),
  ('PL', 'Poland', 5000, 10000, 25.99, 'EUR', true),
  ('PL', 'Poland', 10000, NULL, 35.99, 'EUR', true),

  -- Czech Republic
  ('CZ', 'Czech Republic', 0, 1000, 13.99, 'EUR', true),
  ('CZ', 'Czech Republic', 1000, 5000, 18.99, 'EUR', true),
  ('CZ', 'Czech Republic', 5000, 10000, 25.99, 'EUR', true),
  ('CZ', 'Czech Republic', 10000, NULL, 35.99, 'EUR', true),

  -- Austria
  ('AT', 'Austria', 0, 1000, 11.99, 'EUR', true),
  ('AT', 'Austria', 1000, 5000, 16.99, 'EUR', true),
  ('AT', 'Austria', 5000, 10000, 22.99, 'EUR', true),
  ('AT', 'Austria', 10000, NULL, 32.99, 'EUR', true),

  -- Switzerland (higher rates due to customs)
  ('CH', 'Switzerland', 0, 1000, 19.99, 'EUR', true),
  ('CH', 'Switzerland', 1000, 5000, 29.99, 'EUR', true),
  ('CH', 'Switzerland', 5000, 10000, 39.99, 'EUR', true),
  ('CH', 'Switzerland', 10000, NULL, 49.99, 'EUR', true),

  -- United Kingdom (post-Brexit rates)
  ('GB', 'United Kingdom', 0, 1000, 24.99, 'EUR', true),
  ('GB', 'United Kingdom', 1000, 5000, 34.99, 'EUR', true),
  ('GB', 'United Kingdom', 5000, 10000, 44.99, 'EUR', true),
  ('GB', 'United Kingdom', 10000, NULL, 54.99, 'EUR', true),

  -- Portugal
  ('PT', 'Portugal', 0, 1000, 12.99, 'EUR', true),
  ('PT', 'Portugal', 1000, 5000, 17.99, 'EUR', true),
  ('PT', 'Portugal', 5000, 10000, 24.99, 'EUR', true),
  ('PT', 'Portugal', 10000, NULL, 34.99, 'EUR', true),

  -- Sweden
  ('SE', 'Sweden', 0, 1000, 15.99, 'EUR', true),
  ('SE', 'Sweden', 1000, 5000, 21.99, 'EUR', true),
  ('SE', 'Sweden', 5000, 10000, 28.99, 'EUR', true),
  ('SE', 'Sweden', 10000, NULL, 38.99, 'EUR', true),

  -- Denmark
  ('DK', 'Denmark', 0, 1000, 15.99, 'EUR', true),
  ('DK', 'Denmark', 1000, 5000, 21.99, 'EUR', true),
  ('DK', 'Denmark', 5000, 10000, 28.99, 'EUR', true),
  ('DK', 'Denmark', 10000, NULL, 38.99, 'EUR', true),

  -- Norway (higher rates due to customs)
  ('NO', 'Norway', 0, 1000, 19.99, 'EUR', true),
  ('NO', 'Norway', 1000, 5000, 29.99, 'EUR', true),
  ('NO', 'Norway', 5000, 10000, 39.99, 'EUR', true),
  ('NO', 'Norway', 10000, NULL, 49.99, 'EUR', true),

  -- Rest of EU (standard rates)
  ('OTHER', 'Other EU Countries', 0, 1000, 14.99, 'EUR', true),
  ('OTHER', 'Other EU Countries', 1000, 5000, 19.99, 'EUR', true),
  ('OTHER', 'Other EU Countries', 5000, 10000, 26.99, 'EUR', true),
  ('OTHER', 'Other EU Countries', 10000, NULL, 36.99, 'EUR', true);

-- Create indexes for performance
CREATE INDEX idx_shipping_rates_country ON shipping_rates(country_code);
CREATE INDEX idx_shipping_rates_weight ON shipping_rates(weight_min_grams, weight_max_grams);
CREATE INDEX idx_shipping_rates_active ON shipping_rates(is_active);
CREATE INDEX idx_products_weight ON products(weight_grams);
CREATE INDEX idx_products_category_id ON products(category_id);

-- Create function to calculate shipping cost by total weight and country
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
  total_weight_grams integer,
  country_code text
)
RETURNS decimal(10,2) AS $$
DECLARE
  shipping_cost decimal(10,2);
BEGIN
  -- Get the shipping cost for the weight range and country
  SELECT sr.shipping_cost INTO shipping_cost
  FROM shipping_rates sr
  WHERE sr.country_code = calculate_shipping_cost.country_code
    AND sr.is_active = true
    AND sr.weight_min_grams <= total_weight_grams
    AND (sr.weight_max_grams IS NULL OR sr.weight_max_grams > total_weight_grams)
  ORDER BY sr.weight_min_grams DESC
  LIMIT 1;
  
  -- If no specific rate found, try OTHER country rates
  IF shipping_cost IS NULL THEN
    SELECT sr.shipping_cost INTO shipping_cost
    FROM shipping_rates sr
    WHERE sr.country_code = 'OTHER'
      AND sr.is_active = true
      AND sr.weight_min_grams <= total_weight_grams
      AND (sr.weight_max_grams IS NULL OR sr.weight_max_grams > total_weight_grams)
    ORDER BY sr.weight_min_grams DESC
    LIMIT 1;
  END IF;
  
  -- Fallback to 19.99 EUR if no rate found
  RETURN COALESCE(shipping_cost, 19.99);
END;
$$ LANGUAGE plpgsql;

-- Update sample products with proper categories and weights
UPDATE products SET 
  category_id = (SELECT id FROM categories WHERE slug = 'raccords-tuyauterie' LIMIT 1),
  weight_grams = 450
WHERE sku = 'PF-DN25-001';

UPDATE products SET 
  category_id = (SELECT id FROM categories WHERE slug = 'vannes' LIMIT 1),
  weight_grams = 280
WHERE sku = 'HPV-12-002';

-- Enable RLS on shipping_rates
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for shipping_rates
CREATE POLICY "Anyone can view active shipping rates" ON shipping_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage shipping rates" ON shipping_rates
  FOR ALL USING (check_admin_role());

-- Add trigger for updated_at
CREATE TRIGGER update_shipping_rates_updated_at
  BEFORE UPDATE ON shipping_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
