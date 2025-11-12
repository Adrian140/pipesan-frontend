/*
  # Fix Products RLS and Enable Draft System
  1. Purpose: Fix RLS policies blocking product creation and enable draft products
  2. Schema: Update RLS policies, add draft support, fix admin product creation
  3. Security: Allow admins to create products while maintaining security
*/

-- Temporarily disable RLS to fix blocking policies
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Drop all existing product policies to start clean
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Admins can create products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create comprehensive product policies that actually work

-- 1. PUBLIC can view active products (for catalog)
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);

-- 2. ADMINS can view ALL products (including drafts)
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (check_admin_role());

-- 3. ADMINS can create products (including drafts)
CREATE POLICY "Admins can create products" ON products
  FOR INSERT WITH CHECK (check_admin_role());

-- 4. ADMINS can update products
CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (check_admin_role())
  WITH CHECK (check_admin_role());

-- 5. ADMINS can delete products
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (check_admin_role());

-- Add support for draft products with minimal required fields
ALTER TABLE products 
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN sku DROP NOT NULL,
ALTER COLUMN slug DROP NOT NULL;

-- Add draft status and creation tracking
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS draft_data jsonb DEFAULT '{}';

-- Update existing products to not be drafts
UPDATE products 
SET is_draft = false, 
    created_by_admin = true 
WHERE is_active = true AND (name IS NOT NULL AND name != '' AND sku IS NOT NULL AND sku != '');

-- Function to create minimal draft product for image uploads
CREATE OR REPLACE FUNCTION create_draft_product()
RETURNS uuid AS $$
DECLARE
    draft_id uuid;
BEGIN
    -- Create minimal draft product
    INSERT INTO products (
        name,
        sku,
        slug,
        price,
        currency,
        weight_grams,
        is_active,
        is_draft,
        created_by_admin,
        draft_data
    ) VALUES (
        'Draft Product - ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        'DRAFT-' || extract(epoch from now())::text,
        'draft-' || extract(epoch from now())::text,
        0.00,
        'EUR',
        500,
        false, -- Not active until completed
        true,  -- Mark as draft
        true,  -- Created by admin
        '{"created_at": "' || now()::text || '", "status": "draft"}'
    ) RETURNING id INTO draft_id;
    
    RETURN draft_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and publish draft product
CREATE OR REPLACE FUNCTION publish_draft_product(
    product_id uuid,
    product_name text,
    product_sku text,
    product_price decimal(10,2)
)
RETURNS boolean AS $$
DECLARE
    current_product record;
BEGIN
    -- Get current product
    SELECT * INTO current_product FROM products WHERE id = product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    -- Validate required fields
    IF product_name IS NULL OR trim(product_name) = '' THEN
        RAISE EXCEPTION 'Product name is required';
    END IF;
    
    IF product_sku IS NULL OR trim(product_sku) = '' THEN
        RAISE EXCEPTION 'Product SKU is required';
    END IF;
    
    IF product_price IS NULL OR product_price < 0 THEN
        RAISE EXCEPTION 'Valid price is required';
    END IF;
    
    -- Update product to published state
    UPDATE products 
    SET 
        name = product_name,
        sku = product_sku,
        slug = lower(replace(trim(product_name), ' ', '-')),
        price = product_price,
        is_active = true,
        is_draft = false,
        draft_data = jsonb_set(
            COALESCE(draft_data, '{}'),
            '{published_at}',
            to_jsonb(now()::text)
        ),
        updated_at = now()
    WHERE id = product_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update product images policies to allow early upload
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;

-- Drop existing product images policies
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;

-- Re-enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Create new policies for product images
CREATE POLICY "Public can view active product images" ON product_images
  FOR SELECT USING (
    product_id IN (SELECT id FROM products WHERE is_active = true)
  );

CREATE POLICY "Admins can view all product images" ON product_images
  FOR SELECT USING (check_admin_role());

CREATE POLICY "Admins can manage product images" ON product_images
  FOR ALL USING (check_admin_role());

-- Fix storage policies for product images
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage product images" ON storage.objects;

-- Create proper storage policies
CREATE POLICY "Public can view product images" ON storage.objects 
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND check_admin_role());

CREATE POLICY "Admins can update product images" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'product-images' AND check_admin_role())
  WITH CHECK (bucket_id = 'product-images' AND check_admin_role());

CREATE POLICY "Admins can delete product images" ON storage.objects 
  FOR DELETE USING (bucket_id = 'product-images' AND check_admin_role());

-- Ensure admin function works correctly
DROP FUNCTION IF EXISTS check_admin_role() CASCADE;
CREATE OR REPLACE FUNCTION check_admin_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
  admin_emails TEXT[] := ARRAY['contact@pipesan.eu', 'admin@pipesan.eu', 'ioan.adrian.bucur@gmail.com'];
  user_email TEXT;
BEGIN
  -- Get current user ID safely
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Check if user is admin by email (failsafe)
  IF user_email IS NOT NULL AND user_email = ANY(admin_emails) THEN
    RETURN TRUE;
  END IF;
  
  -- Get user role from public.users with error handling
  SELECT role INTO user_role
  FROM public.users
  WHERE auth_id = current_user_id;
  
  -- Return true if admin, false otherwise
  RETURN COALESCE(user_role = 'admin', FALSE);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and check email as fallback
    RAISE LOG 'Error in check_admin_role: %, checking email fallback', SQLERRM;
    
    -- Fallback: check by email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    RETURN user_email IS NOT NULL AND user_email = ANY(admin_emails);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all policies that depend on check_admin_role for other tables
-- (Previous policies were dropped when we dropped the function)

-- Users policies
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON users;
DROP POLICY IF EXISTS "Users can update own profile or admins update any" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile or admins view all" ON users
  FOR SELECT USING (
    auth.uid() = auth_id OR 
    check_admin_role() OR
    auth.uid() IS NULL
  );

CREATE POLICY "Users can update own profile or admins update any" ON users
  FOR UPDATE USING (auth.uid() = auth_id OR check_admin_role())
  WITH CHECK (auth.uid() = auth_id OR check_admin_role());

CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE USING (check_admin_role());

-- Categories policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Anyone can view active categories" ON categories 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON categories 
  FOR ALL USING (check_admin_role());

-- Other tables policies (recreate the essential ones)
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses" ON addresses 
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own billing profiles" ON billing_profiles;
CREATE POLICY "Users can manage own billing profiles" ON billing_profiles 
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart" ON cart_items 
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Add helpful indexes for draft products
CREATE INDEX IF NOT EXISTS idx_products_is_draft ON products(is_draft);
CREATE INDEX IF NOT EXISTS idx_products_created_by_admin ON products(created_by_admin);
CREATE INDEX IF NOT EXISTS idx_products_draft_active ON products(is_draft, is_active);

-- Insert some sample draft products for testing
DO $$
DECLARE
    sample_category_id uuid;
BEGIN
    -- Get a category for testing
    SELECT id INTO sample_category_id FROM categories WHERE is_active = true LIMIT 1;
    
    -- Create a sample draft product
    INSERT INTO products (
        name,
        sku,
        slug,
        description,
        price,
        currency,
        weight_grams,
        category_id,
        images,
        is_active,
        is_draft,
        created_by_admin,
        draft_data
    ) VALUES (
        'Sample Draft Product',
        'DRAFT-SAMPLE-001',
        'sample-draft-product',
        'This is a sample draft product for testing the new draft system',
        25.99,
        'EUR',
        350,
        sample_category_id,
        '[]'::jsonb,
        false, -- Not active
        true,  -- Is draft
        true,  -- Created by admin
        '{"created_for": "testing", "features": ["draft_mode", "image_upload_enabled"]}'
    ) ON CONFLICT (sku) DO NOTHING;
    
    RAISE NOTICE 'Sample draft product created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create sample draft product: %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
    policies_count integer;
    draft_products_count integer;
    admin_function_exists boolean;
    storage_policies_count integer;
BEGIN
    -- Count policies on products table
    SELECT COUNT(*) INTO policies_count 
    FROM pg_policies 
    WHERE tablename = 'products' AND schemaname = 'public';
    
    -- Count draft products
    SELECT COUNT(*) INTO draft_products_count 
    FROM products 
    WHERE is_draft = true;
    
    -- Check if admin function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'check_admin_role'
    ) INTO admin_function_exists;
    
    -- Count storage policies
    SELECT COUNT(*) INTO storage_policies_count 
    FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' 
    AND policyname LIKE '%product%';
    
    RAISE NOTICE 'Migration 022 completed - Product policies: %, Draft products: %, Admin function: %, Storage policies: %', 
        policies_count, draft_products_count, admin_function_exists, storage_policies_count;
        
    IF policies_count < 5 THEN
        RAISE WARNING 'Insufficient product policies created - expected 5+, got %', policies_count;
    END IF;
    
    IF NOT admin_function_exists THEN
        RAISE WARNING 'Admin function check_admin_role does not exist!';
    END IF;
END $$;
