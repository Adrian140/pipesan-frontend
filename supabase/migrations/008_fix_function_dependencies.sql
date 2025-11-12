/*
  # Fix Function Dependencies and Auth Issues
  1. Purpose: Properly handle function dependencies and fix authentication
  2. Schema: Drop and recreate function with all dependent policies
  3. Security: Maintain security while fixing auth flow
*/

-- Drop the function with CASCADE to remove all dependent policies
DROP FUNCTION IF EXISTS check_admin_role() CASCADE;

-- Recreate the admin check function with better error handling
CREATE OR REPLACE FUNCTION check_admin_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user ID safely
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user role with error handling
  SELECT role INTO user_role
  FROM public.users
  WHERE auth_id = current_user_id;
  
  -- Return true if admin, false otherwise
  RETURN COALESCE(user_role = 'admin', FALSE);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return false for safety
    RAISE LOG 'Error in check_admin_role: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all RLS policies that were dropped

-- USERS POLICIES
CREATE POLICY "Enable read access for authenticated users" ON public.users
  FOR SELECT
  USING (auth.uid() = auth_id OR check_admin_role());

CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_id OR check_admin_role());

CREATE POLICY "Enable update for users based on auth_id" ON public.users
  FOR UPDATE
  USING (auth.uid() = auth_id OR check_admin_role())
  WITH CHECK (auth.uid() = auth_id OR check_admin_role());

CREATE POLICY "Enable delete for admins only" ON public.users
  FOR DELETE
  USING (check_admin_role());

DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
-- ADDRESSES POLICIES
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own billing profiles" ON billing_profiles;
-- BILLING PROFILES POLICIES
CREATE POLICY "Users can manage own billing profiles" ON billing_profiles FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
-- CATEGORIES POLICIES
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
-- PRODUCTS POLICIES
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
-- PRODUCT IMAGES POLICIES
CREATE POLICY "Anyone can view product images" ON product_images FOR SELECT USING (product_id IN (SELECT id FROM products WHERE is_active = true));
CREATE POLICY "Admins can manage product images" ON product_images FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Anyone can view active product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
-- PRODUCT VARIANTS POLICIES
CREATE POLICY "Anyone can view active product variants" ON product_variants FOR SELECT USING (is_active = true AND product_id IN (SELECT id FROM products WHERE is_active = true));
CREATE POLICY "Admins can manage product variants" ON product_variants FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
-- ORDERS POLICIES
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR check_admin_role());
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
-- ORDER ITEMS POLICIES
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())) OR check_admin_role());
CREATE POLICY "Admins can manage order items" ON order_items FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
-- CART ITEMS POLICIES
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view content" ON content;
DROP POLICY IF EXISTS "Admins can manage content" ON content;
-- CONTENT POLICIES
CREATE POLICY "Anyone can view content" ON content FOR SELECT USING (true);
CREATE POLICY "Admins can manage content" ON content FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Anyone can view active documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON documents;
-- DOCUMENTS POLICIES
CREATE POLICY "Anyone can view active documents" ON documents FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage documents" ON documents FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Admins can manage services" ON services;
-- SERVICES POLICIES
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services" ON services FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Anyone can view active pricing" ON pricing;
DROP POLICY IF EXISTS "Admins can manage pricing" ON pricing;
-- PRICING POLICIES
CREATE POLICY "Anyone can view active pricing" ON pricing FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage pricing" ON pricing FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;
-- INVOICES POLICIES
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR check_admin_role());
CREATE POLICY "Admins can manage invoices" ON invoices FOR ALL USING (check_admin_role());

DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage product images" ON storage.objects;
-- STORAGE BUCKETS POLICIES
-- Product Images
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can manage product images" ON storage.objects FOR ALL USING (bucket_id = 'product-images' AND check_admin_role());

DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage documents" ON storage.objects;
-- Documents
CREATE POLICY "Authenticated users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can manage documents" ON storage.objects FOR ALL USING (bucket_id = 'documents' AND check_admin_role());

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own avatar" ON storage.objects;
-- Avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can manage own avatar" ON storage.objects FOR ALL USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Ensure the admin user exists and is properly configured
DO $$
DECLARE
    admin_auth_id UUID;
    admin_user_exists BOOLEAN;
BEGIN
    -- Check if admin user exists in auth.users
    SELECT id INTO admin_auth_id 
    FROM auth.users 
    WHERE email = 'contact@pipesan.eu' 
    LIMIT 1;
    
    -- Check if admin profile exists in public.users
    SELECT EXISTS(
        SELECT 1 FROM public.users 
        WHERE auth_id = admin_auth_id
    ) INTO admin_user_exists;
    
    -- If auth user exists but profile doesn't, create it
    IF admin_auth_id IS NOT NULL AND NOT admin_user_exists THEN
        INSERT INTO public.users (
            auth_id, first_name, last_name, phone, country, language, role, email_verified
        ) VALUES (
            admin_auth_id, 'Admin', 'PipeSan', '+33 675 111 62 18', 'RO', 'ro', 'admin', TRUE
        );
        RAISE NOTICE 'Created admin profile for existing auth user';
    END IF;
END $$;

-- Add missing images column to products if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'images'
    ) THEN
        ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added images column to products table';
    END IF;
END $$;

-- Update any products that might have NULL images
UPDATE products SET images = '[]'::jsonb WHERE images IS NULL;

-- Ensure all required columns have proper defaults
UPDATE users SET 
    first_name = COALESCE(first_name, ''),
    last_name = COALESCE(last_name, ''),
    country = COALESCE(country, 'FR'),
    language = COALESCE(language, 'fr'),
    role = COALESCE(role, 'user')
WHERE first_name IS NULL OR last_name IS NULL OR country IS NULL OR language IS NULL OR role IS NULL;
