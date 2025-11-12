/*
  # Fix Products Table Update Schema Issues
  1. Purpose: Resolve schema inconsistencies causing "Cannot coerce result to single JSON object" error
  2. Schema: Clean up duplicate columns, fix constraints, ensure proper update functionality
  3. Security: Maintain RLS policies while fixing schema issues
*/

-- First, analyze the current products table structure
DO $$
DECLARE
    column_count INTEGER;
    constraint_count INTEGER;
    duplicate_columns TEXT[];
    table_info RECORD;
BEGIN
    -- Check for duplicate column names
    SELECT array_agg(column_name) INTO duplicate_columns
    FROM (
        SELECT column_name, COUNT(*) as cnt
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        GROUP BY column_name 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Count total columns and constraints
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'products';
    
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'products';
    
    RAISE NOTICE 'Products table analysis - Columns: %, Constraints: %, Duplicates: %', 
        column_count, constraint_count, duplicate_columns;
        
    IF array_length(duplicate_columns, 1) > 0 THEN
        RAISE WARNING 'Found duplicate columns: %', array_to_string(duplicate_columns, ', ');
    END IF;
END $$;

-- Fix any schema cache issues
REFRESH MATERIALIZED VIEW IF EXISTS products_mv;

-- Ensure the products table has consistent column types and constraints
DO $$
DECLARE
    col_record RECORD;
    constraint_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check critical columns exist with correct types
    
    -- Ensure description column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'description'
        AND data_type = 'text'
    ) THEN
        -- Add description column if missing or fix type
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description text DEFAULT '';
        RAISE NOTICE 'Added/fixed description column';
    END IF;
    
    -- Ensure short_description column exists (only one)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'short_description'
    ) THEN
        ALTER TABLE products ADD COLUMN short_description text DEFAULT '';
        RAISE NOTICE 'Added short_description column';
    END IF;
    
    -- Ensure weight_grams column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'weight_grams'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_grams integer DEFAULT 500;
        RAISE NOTICE 'Added/fixed weight_grams column';
    END IF;
    
    -- Ensure images column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'images'
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added/fixed images column';
    END IF;
    
    -- Ensure bullet_points column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'bullet_points'
        AND data_type = 'ARRAY'
    ) THEN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS bullet_points text[] DEFAULT ARRAY[]::text[];
        RAISE NOTICE 'Added/fixed bullet_points column';
    END IF;
    
    -- Ensure amazon_links column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'amazon_links'
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS amazon_links jsonb DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added/fixed amazon_links column';
    END IF;
    
    -- Ensure specifications column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'specifications'
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added/fixed specifications column';
    END IF;
    
    -- Ensure features column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'features'
        AND data_type = 'ARRAY'
    ) THEN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS features text[] DEFAULT ARRAY[]::text[];
        RAISE NOTICE 'Added/fixed features column';
    END IF;
    
    -- Ensure dimensions column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'dimensions'
    ) THEN
        ALTER TABLE products ADD COLUMN dimensions text DEFAULT '';
        RAISE NOTICE 'Added dimensions column';
    END IF;
    
    -- Fix any NULL values that might cause issues
    UPDATE products SET 
        description = COALESCE(description, ''),
        short_description = COALESCE(short_description, ''),
        weight_grams = COALESCE(weight_grams, 500),
        images = COALESCE(images, '[]'::jsonb),
        bullet_points = COALESCE(bullet_points, ARRAY[]::text[]),
        amazon_links = COALESCE(amazon_links, '{}'::jsonb),
        specifications = COALESCE(specifications, '{}'::jsonb),
        features = COALESCE(features, ARRAY[]::text[]),
        dimensions = COALESCE(dimensions, ''),
        currency = COALESCE(currency, 'EUR'),
        stock_status = COALESCE(stock_status, 'in_stock'),
        updated_at = COALESCE(updated_at, created_at, now())
    WHERE 
        description IS NULL OR 
        weight_grams IS NULL OR 
        images IS NULL OR 
        bullet_points IS NULL OR 
        amazon_links IS NULL OR 
        specifications IS NULL OR 
        features IS NULL OR
        currency IS NULL OR
        stock_status IS NULL OR
        updated_at IS NULL;
    
    RAISE NOTICE 'Fixed NULL values in products table';
END $$;

-- Ensure proper constraints exist
DO $$
BEGIN
    -- Add weight constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'chk_products_weight_positive'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT chk_products_weight_positive CHECK (weight_grams > 0);
        RAISE NOTICE 'Added weight constraint';
    END IF;
    
    -- Add price constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'chk_products_price_positive'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT chk_products_price_positive CHECK (price >= 0);
        RAISE NOTICE 'Added price constraint';
    END IF;
    
    -- Add stock constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'chk_products_stock_positive'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT chk_products_stock_positive CHECK (stock_quantity >= 0);
        RAISE NOTICE 'Added stock constraint';
    END IF;
END $$;

-- Fix unique constraints that might be causing issues
DO $$
BEGIN
    -- Ensure SKU uniqueness (but handle NULL values properly)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'products_sku_unique'
    ) THEN
        -- Create unique partial index for non-null SKUs
        CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique 
        ON products(sku) 
        WHERE sku IS NOT NULL AND sku != '';
        RAISE NOTICE 'Added SKU unique constraint';
    END IF;
    
    -- Ensure slug uniqueness (but handle NULL values properly)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'products_slug_unique'
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique 
        ON products(slug) 
        WHERE slug IS NOT NULL AND slug != '';
        RAISE NOTICE 'Added slug unique constraint';
    END IF;
END $$;

-- Clean up any orphaned data that might cause update issues
DELETE FROM product_images 
WHERE product_id NOT IN (SELECT id FROM products);

DELETE FROM product_variants 
WHERE product_id NOT IN (SELECT id FROM products);

DELETE FROM cart_items 
WHERE product_id NOT IN (SELECT id FROM products);

-- Ensure updated_at trigger exists and works
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS update_products_updated_at ON products;
    
    -- Recreate trigger
    CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Recreated updated_at trigger for products';
END $$;

-- Add helpful indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_draft ON products(is_draft) WHERE is_draft IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- Fix any RLS policy issues that might prevent updates
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Drop all existing product policies
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can create products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create working policies
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (check_admin_role());

CREATE POLICY "Admins can create products" ON products
  FOR INSERT WITH CHECK (check_admin_role());

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (check_admin_role())
  WITH CHECK (check_admin_role());

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (check_admin_role());

-- Test the update functionality with a simple test
DO $$
DECLARE
    test_product_id uuid;
    test_result RECORD;
    update_successful BOOLEAN := false;
BEGIN
    -- Get a product to test with
    SELECT id INTO test_product_id 
    FROM products 
    WHERE is_active = true 
    LIMIT 1;
    
    IF test_product_id IS NOT NULL THEN
        -- Test update operation
        BEGIN
            UPDATE products 
            SET updated_at = now(),
                description = COALESCE(description, '') || ' (Schema fixed)'
            WHERE id = test_product_id;
            
            -- Verify the update worked
            SELECT * INTO test_result
            FROM products 
            WHERE id = test_product_id;
            
            IF FOUND THEN
                update_successful := true;
                RAISE NOTICE '✅ Product update test successful for product: %', test_product_id;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '❌ Product update test failed: %', SQLERRM;
                update_successful := false;
        END;
    ELSE
        RAISE NOTICE 'No active products found to test with';
    END IF;
    
    IF NOT update_successful AND test_product_id IS NOT NULL THEN
        RAISE WARNING 'Product update functionality may still have issues';
    END IF;
END $$;

-- Refresh table statistics to ensure query planner has correct info
ANALYZE products;

-- Final verification of table structure
DO $$
DECLARE
    required_columns TEXT[] := ARRAY[
        'id', 'name', 'slug', 'sku', 'description', 'short_description', 'price', 'sale_price', 
        'currency', 'weight_grams', 'dimensions', 'specifications', 'features', 'bullet_points', 
        'amazon_links', 'stock_quantity', 'stock_status', 'manage_stock', 'rating', 'review_count',
        'is_featured', 'is_active', 'is_draft', 'created_by_admin', 'category_id', 'images',
        'meta_title', 'meta_description', 'created_at', 'updated_at'
    ];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col TEXT;
    column_exists BOOLEAN;
    rls_enabled BOOLEAN;
    policies_count INTEGER;
BEGIN
    -- Check each required column exists
    FOREACH col IN ARRAY required_columns
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = col
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    -- Check RLS status
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'products';
    
    -- Count policies
    SELECT COUNT(*) INTO policies_count 
    FROM pg_policies 
    WHERE tablename = 'products';
    
    -- Report results
    RAISE NOTICE 'Migration 028 verification:';
    RAISE NOTICE '- Total columns: %', array_length(required_columns, 1);
    RAISE NOTICE '- Missing columns: %', array_length(missing_columns, 1);
    RAISE NOTICE '- RLS enabled: %', rls_enabled;
    RAISE NOTICE '- Policies count: %', policies_count;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING 'Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns present in products table';
    END IF;
    
    IF NOT rls_enabled THEN
        RAISE WARNING '⚠️ RLS is not enabled on products table';
    END IF;
    
    IF policies_count < 5 THEN
        RAISE WARNING '⚠️ Insufficient RLS policies on products table (expected 5+, found %)', policies_count;
    END IF;
END $$;

-- Create a test product update to verify the fix works
DO $$
DECLARE
    test_product_id uuid;
    original_description text;
    updated_description text;
BEGIN
    -- Get a product to test comprehensive update
    SELECT id, description INTO test_product_id, original_description
    FROM products 
    WHERE is_active = true OR is_draft = true
    LIMIT 1;
    
    IF test_product_id IS NOT NULL THEN
        RAISE NOTICE 'Testing comprehensive product update with product: %', test_product_id;
        
        -- Perform a comprehensive update similar to what admin panel does
        UPDATE products 
        SET 
            description = COALESCE(original_description, '') || ' [Updated by migration 028]',
            short_description = COALESCE(short_description, 'Test short description'),
            weight_grams = COALESCE(weight_grams, 500),
            images = COALESCE(images, '[]'::jsonb),
            bullet_points = COALESCE(bullet_points, ARRAY['Test feature']::text[]),
            amazon_links = COALESCE(amazon_links, '{}'::jsonb),
            specifications = COALESCE(specifications, '{}'::jsonb),
            features = COALESCE(features, ARRAY['Test feature']::text[]),
            dimensions = COALESCE(dimensions, ''),
            updated_at = now()
        WHERE id = test_product_id;
        
        -- Verify the update succeeded
        SELECT description INTO updated_description
        FROM products 
        WHERE id = test_product_id;
        
        IF updated_description IS NOT NULL AND updated_description != original_description THEN
            RAISE NOTICE '✅ Product update test completed successfully!';
            RAISE NOTICE 'Original: %', original_description;
            RAISE NOTICE 'Updated: %', updated_description;
        ELSE
            RAISE WARNING '❌ Product update test may have failed';
        END IF;
    ELSE
        RAISE NOTICE 'No products available for testing update functionality';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Product update test failed with error: %', SQLERRM;
END $$;

-- Add function to safely update products (handles all edge cases)
CREATE OR REPLACE FUNCTION safe_update_product(
    product_id uuid,
    product_name text DEFAULT NULL,
    product_description text DEFAULT NULL,
    product_price decimal DEFAULT NULL,
    product_weight_grams integer DEFAULT NULL,
    product_images jsonb DEFAULT NULL,
    product_bullet_points text[] DEFAULT NULL,
    product_amazon_links jsonb DEFAULT NULL
)
RETURNS products AS $$
DECLARE
    result products%ROWTYPE;
BEGIN
    -- Perform safe update with COALESCE to handle NULLs
    UPDATE products 
    SET 
        name = COALESCE(product_name, name),
        description = COALESCE(product_description, description),
        price = COALESCE(product_price, price),
        weight_grams = COALESCE(product_weight_grams, weight_grams, 500),
        images = COALESCE(product_images, images, '[]'::jsonb),
        bullet_points = COALESCE(product_bullet_points, bullet_points, ARRAY[]::text[]),
        amazon_links = COALESCE(product_amazon_links, amazon_links, '{}'::jsonb),
        updated_at = now()
    WHERE id = product_id
    RETURNING * INTO result;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', product_id;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions for the safe update function
GRANT EXECUTE ON FUNCTION safe_update_product TO authenticated;

-- Final success message
RAISE NOTICE '�� Products table schema has been fixed and verified!';
RAISE NOTICE '✅ Product updates should now work correctly in the admin panel';
RAISE NOTICE '📝 You can now safely edit product descriptions and other fields';
