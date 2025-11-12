/*
  # Fix Weight Column Creation Order
  1. Purpose: Ensure weight_grams column exists before adding constraints
  2. Schema: Proper order of column creation then constraint addition
  3. Security: Maintain existing RLS policies and data integrity
*/

-- First, ensure weight_grams column exists in products table
DO $$
BEGIN
    -- Add weight_grams column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'weight_grams'
    ) THEN
        ALTER TABLE products ADD COLUMN weight_grams integer DEFAULT 500;
        RAISE NOTICE 'Added weight_grams column to products table';
    ELSE
        RAISE NOTICE 'Weight_grams column already exists';
    END IF;
    
    -- Ensure all existing products have weight values
    UPDATE products SET weight_grams = 500 WHERE weight_grams IS NULL OR weight_grams = 0;
    
    -- Make weight_grams NOT NULL
    ALTER TABLE products ALTER COLUMN weight_grams SET NOT NULL;
    RAISE NOTICE 'Set weight_grams as NOT NULL with default values';
END $$;

-- Now add the constraint (after column exists)
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

-- Update existing products to have proper weight values based on category
DO $$
BEGIN
    -- Update products with realistic weights based on category
    UPDATE products SET weight_grams = 
        CASE 
            WHEN name ILIKE '%valve%' THEN 850  -- Ball valves are heavier
            WHEN name ILIKE '%fitting%' THEN 450  -- Fittings are lighter
            WHEN name ILIKE '%hose%' THEN 680   -- Hoses medium weight
            WHEN name ILIKE '%gasket%' THEN 50   -- Gaskets very light
            WHEN name ILIKE '%tool%' THEN 1200   -- Tools are heaviest
            ELSE 500  -- Default weight
        END
    WHERE weight_grams = 500;  -- Only update defaults
    
    RAISE NOTICE 'Updated product weights based on categories';
END $$;

-- Verify shipping_rates table exists and is properly structured
DO $$
BEGIN
    -- Check if shipping_rates table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'shipping_rates'
    ) THEN
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
        
        -- Insert default shipping rates
        INSERT INTO shipping_rates (country_code, country_name, weight_min_grams, weight_max_grams, shipping_cost, currency, is_active) VALUES
          -- France (Main market)
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

          -- Other EU Countries (fallback)
          ('OTHER', 'Other EU Countries', 0, 1000, 14.99, 'EUR', true),
          ('OTHER', 'Other EU Countries', 1000, 5000, 19.99, 'EUR', true),
          ('OTHER', 'Other EU Countries', 5000, 10000, 26.99, 'EUR', true),
          ('OTHER', 'Other EU Countries', 10000, NULL, 36.99, 'EUR', true);
        
        RAISE NOTICE 'Inserted default shipping rates for all countries';
    ELSE
        RAISE NOTICE 'Shipping_rates table already exists';
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

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_shipping_rates_country ON shipping_rates(country_code);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_weight ON shipping_rates(weight_min_grams, weight_max_grams);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_active ON shipping_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_products_weight_grams ON products(weight_grams);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Add updated_at trigger for shipping_rates if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_shipping_rates_updated_at'
        AND event_object_table = 'shipping_rates'
    ) THEN
        CREATE TRIGGER update_shipping_rates_updated_at
          BEFORE UPDATE ON shipping_rates
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added updated_at trigger for shipping_rates';
    END IF;
END $$;

-- Final verification
DO $$
DECLARE
    weight_column_exists boolean;
    weight_constraint_exists boolean;
    shipping_table_exists boolean;
    shipping_rates_count integer;
BEGIN
    -- Check if weight_grams column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'weight_grams'
    ) INTO weight_column_exists;
    
    -- Check if weight constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'chk_products_weight_positive'
    ) INTO weight_constraint_exists;
    
    -- Check if shipping_rates table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'shipping_rates'
    ) INTO shipping_table_exists;
    
    -- Count shipping rates
    IF shipping_table_exists THEN
        SELECT COUNT(*) INTO shipping_rates_count FROM shipping_rates;
    ELSE
        shipping_rates_count := 0;
    END IF;
    
    RAISE NOTICE 'Migration 011 verification - Weight column: %, Weight constraint: %, Shipping table: %, Shipping rates: %', 
        weight_column_exists, weight_constraint_exists, shipping_table_exists, shipping_rates_count;
END $$;
