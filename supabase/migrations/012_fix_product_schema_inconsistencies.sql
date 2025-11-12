/*
  # Fix Product Schema Inconsistencies
  1. Purpose: Resolve conflicts between weight/weight_grams columns and ensure proper saving
  2. Schema: Clean up duplicate columns and ensure consistent field mapping
  3. Security: Maintain existing RLS policies and data integrity
*/

-- Fix schema inconsistencies in products table
DO $$
BEGIN
    -- Check if both weight and weight_grams columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'weight'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'weight_grams'
    ) THEN
        -- Migrate data from old weight column to weight_grams
        -- Convert decimal weight (kg) to integer weight_grams
        UPDATE products 
        SET weight_grams = COALESCE(
            CASE 
                WHEN weight IS NOT NULL AND weight > 0 THEN ROUND(weight * 1000)::integer
                ELSE weight_grams
            END, 
            500
        )
        WHERE weight_grams IS NULL OR weight_grams = 0;
        
        -- Drop the old weight column to avoid confusion
        ALTER TABLE products DROP COLUMN IF EXISTS weight;
        
        RAISE NOTICE 'Migrated weight data to weight_grams and dropped old weight column';
    END IF;
    
    -- Ensure weight_grams column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'weight_grams'
    ) THEN
        ALTER TABLE products ADD COLUMN weight_grams integer DEFAULT 500;
        RAISE NOTICE 'Added weight_grams column to products table';
    END IF;
    
    -- Ensure all products have valid weight values
    UPDATE products 
    SET weight_grams = 500 
    WHERE weight_grams IS NULL OR weight_grams <= 0;
    
    -- Make weight_grams NOT NULL
    ALTER TABLE products ALTER COLUMN weight_grams SET NOT NULL;
    
    -- Add constraint for positive weight
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'products' 
            AND constraint_name = 'chk_products_weight_positive'
        ) THEN
            ALTER TABLE products 
            ADD CONSTRAINT chk_products_weight_positive CHECK (weight_grams > 0);
            RAISE NOTICE 'Added weight constraint to products table';
        END IF;
    END $$;
END $$;

-- Fix duplicate short_description column if it exists
DO $$
BEGIN
    -- Count how many short_description columns exist
    IF (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'short_description'
    ) > 1 THEN
        -- This indicates duplicate columns from migrations
        -- We need to rebuild the table structure cleanly
        RAISE NOTICE 'Detected duplicate short_description columns - this requires manual database cleanup';
    END IF;
END $$;

-- Ensure categories table has proper structure for referential integrity
DO $$
BEGIN
    -- Verify foreign key constraint exists and is working
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'products_category_id_fkey'
    ) THEN
        -- Add foreign key constraint if missing
        ALTER TABLE products 
        ADD CONSTRAINT products_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint for category_id';
    END IF;
END $$;

-- Update existing products to use proper categories if they exist
DO $$
DECLARE
    category_count integer;
    raccords_id uuid;
    vannes_id uuid;
BEGIN
    -- Check if we have categories
    SELECT COUNT(*) INTO category_count FROM categories;
    
    IF category_count > 0 THEN
        -- Get category IDs for existing categories
        SELECT id INTO raccords_id FROM categories WHERE slug = 'raccords-tuyauterie' LIMIT 1;
        SELECT id INTO vannes_id FROM categories WHERE slug = 'vannes' LIMIT 1;
        
        -- Update products without categories
        IF raccords_id IS NOT NULL THEN
            UPDATE products 
            SET category_id = raccords_id 
            WHERE category_id IS NULL 
            AND (name ILIKE '%fitting%' OR name ILIKE '%raccord%')
            AND sku = 'PF-DN25-001';
        END IF;
        
        IF vannes_id IS NOT NULL THEN
            UPDATE products 
            SET category_id = vannes_id 
            WHERE category_id IS NULL 
            AND (name ILIKE '%valve%' OR name ILIKE '%vanne%')
            AND sku = 'HPV-12-002';
        END IF;
        
        RAISE NOTICE 'Updated products with proper category assignments';
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_weight_grams ON products(weight_grams);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Add trigger for updated_at if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_products_updated_at'
        AND event_object_table = 'products'
    ) THEN
        CREATE TRIGGER update_products_updated_at
          BEFORE UPDATE ON products
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added updated_at trigger for products';
    END IF;
END $$;

-- Verify final schema state
DO $$
DECLARE
    weight_grams_exists boolean;
    old_weight_exists boolean;
    category_fk_exists boolean;
    products_count integer;
BEGIN
    -- Check column existence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'weight_grams'
    ) INTO weight_grams_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'weight'
    ) INTO old_weight_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'products_category_id_fkey'
    ) INTO category_fk_exists;
    
    SELECT COUNT(*) INTO products_count FROM products;
    
    RAISE NOTICE 'Schema verification - weight_grams: %, old_weight: %, category_fk: %, products: %', 
        weight_grams_exists, old_weight_exists, category_fk_exists, products_count;
END $$;
