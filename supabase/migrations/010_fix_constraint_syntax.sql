/*
  # Fix Migration 009 Constraint Syntax Error
  1. Purpose: Fix the SQL syntax error from migration 009 by using proper PostgreSQL syntax
  2. Schema: Add missing constraints using proper conditional logic
  3. Security: Maintain existing RLS policies and data integrity
*/

-- Fix weight constraint using proper PostgreSQL syntax
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'chk_products_weight_positive'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT chk_products_weight_positive CHECK (weight_grams >= 0);
        RAISE NOTICE 'Added weight constraint to products table';
    ELSE
        RAISE NOTICE 'Weight constraint already exists on products table';
    END IF;
END $$;

-- Ensure weight_grams column exists and has proper type
DO $$
BEGIN
    -- Add weight_grams column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'weight_grams'
    ) THEN
        ALTER TABLE products ADD COLUMN weight_grams integer DEFAULT 500;
        RAISE NOTICE 'Added weight_grams column to products table';
    END IF;
    
    -- Update NULL weight values to default 500g
    UPDATE products SET weight_grams = 500 WHERE weight_grams IS NULL OR weight_grams = 0;
    
    -- Ensure weight_grams is NOT NULL
    ALTER TABLE products ALTER COLUMN weight_grams SET NOT NULL;
END $$;

-- Verify and fix shipping_rates table structure
DO $$
BEGIN
    -- Check if shipping_rates table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'shipping_rates'
    ) THEN
        RAISE NOTICE 'Shipping rates table exists';
        
        -- Add missing constraints if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'shipping_rates' 
            AND constraint_name = 'chk_weight_min_positive'
        ) THEN
            ALTER TABLE shipping_rates 
            ADD CONSTRAINT chk_weight_min_positive CHECK (weight_min_grams >= 0);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'shipping_rates' 
            AND constraint_name = 'chk_weight_max_greater'
        ) THEN
            ALTER TABLE shipping_rates 
            ADD CONSTRAINT chk_weight_max_greater CHECK (weight_max_grams IS NULL OR weight_max_grams > weight_min_grams);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'shipping_rates' 
            AND constraint_name = 'chk_shipping_cost_positive'
        ) THEN
            ALTER TABLE shipping_rates 
            ADD CONSTRAINT chk_shipping_cost_positive CHECK (shipping_cost >= 0);
        END IF;
        
    ELSE
        -- Create shipping_rates table if it doesn't exist
        CREATE TABLE shipping_rates (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          country_code text NOT NULL,
          country_name text NOT NULL,
          weight_min_grams integer NOT NULL DEFAULT 0,
          weight_max_grams integer DEFAULT NULL,
          shipping_cost decimal(10,2) NOT NULL,
          currency text NOT NULL DEFAULT 'EUR',
          is_active boolean DEFAULT true,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          
          CONSTRAINT chk_weight_min_positive CHECK (weight_min_grams >= 0),
          CONSTRAINT chk_weight_max_greater CHECK (weight_max_grams IS NULL OR weight_max_grams > weight_min_grams),
          CONSTRAINT chk_shipping_cost_positive CHECK (shipping_cost >= 0),
          CONSTRAINT chk_currency_valid CHECK (currency IN ('EUR', 'USD', 'GBP', 'CHF')),
          
          UNIQUE(country_code, weight_min_grams, weight_max_grams)
        );
        
        -- Enable RLS
        ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Anyone can view active shipping rates" ON shipping_rates
          FOR SELECT USING (is_active = true);
        
        CREATE POLICY "Admins can manage shipping rates" ON shipping_rates
          FOR ALL USING (check_admin_role());
        
        RAISE NOTICE 'Created shipping_rates table with proper constraints';
    END IF;
END $$;

-- Insert sample shipping rates if table is empty
DO $$
DECLARE
    rate_count integer;
BEGIN
    SELECT COUNT(*) INTO rate_count FROM shipping_rates;
    
    IF rate_count = 0 THEN
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

          -- Other EU Countries
          ('OTHER', 'Other EU Countries', 0, 1000, 14.99, 'EUR', true),
          ('OTHER', 'Other EU Countries', 1000, 5000, 19.99, 'EUR', true),
          ('OTHER', 'Other EU Countries', 5000, 10000, 26.99, 'EUR', true),
          ('OTHER', 'Other EU Countries', 10000, NULL, 36.99, 'EUR', true);
        
        RAISE NOTICE 'Inserted sample shipping rates';
    END IF;
END $$;

-- Recreate the shipping cost calculation function
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipping_rates_country ON shipping_rates(country_code);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_weight ON shipping_rates(weight_min_grams, weight_max_grams);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_active ON shipping_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_products_weight ON products(weight_grams);

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_shipping_rates_updated_at'
    ) THEN
        CREATE TRIGGER update_shipping_rates_updated_at
          BEFORE UPDATE ON shipping_rates
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added updated_at trigger for shipping_rates';
    END IF;
END $$;

-- Final verification and cleanup
DO $$
DECLARE
    constraint_count integer;
    table_count integer;
BEGIN
    -- Verify products table has all required constraints
    SELECT COUNT(*) INTO constraint_count 
    FROM information_schema.table_constraints 
    WHERE table_name = 'products' 
    AND constraint_name LIKE 'chk_%';
    
    -- Verify shipping_rates table exists and has data
    SELECT COUNT(*) INTO table_count FROM shipping_rates;
    
    RAISE NOTICE 'Migration 010 completed successfully - Products constraints: %, Shipping rates: %', constraint_count, table_count;
END $$;
