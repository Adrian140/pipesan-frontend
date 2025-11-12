/*
  # BielaVibe RLS Policies
  1. Purpose: Define all Row Level Security policies for the application.
  2. Security: Uses a SECURITY DEFINER function to check for admin role, preventing infinite recursion.
*/

-- Create a function to check for admin role without recursion
CREATE OR REPLACE FUNCTION check_admin_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This function runs with the permissions of the user who defined it,
  -- bypassing RLS policies on the 'users' table for this check.
  SELECT role INTO user_role
  FROM public.users
  WHERE auth_id = auth.uid();
  
  RETURN user_role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS POLICIES
-- Drop old policies to ensure a clean state before creating new ones.
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.users;

-- 1. SELECT: Users can view their own profile, Admins can view all.
CREATE POLICY "Users can view profiles" ON public.users
  FOR SELECT
  USING ((auth.uid() = auth_id) OR (check_admin_role()));

-- 2. INSERT: Users can create their own profile, Admins can create any.
CREATE POLICY "Users can insert profiles" ON public.users
  FOR INSERT
  WITH CHECK ((auth.uid() = auth_id) OR (check_admin_role()));

-- 3. UPDATE: Users can update their own profile, Admins can update any.
CREATE POLICY "Users can update profiles" ON public.users
  FOR UPDATE
  USING ((auth.uid() = auth_id) OR (check_admin_role()));

-- 4. DELETE: Only admins can delete profiles.
CREATE POLICY "Admins can delete profiles" ON public.users
  FOR DELETE
  USING (check_admin_role());
-- ADDRESSES POLICIES
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- BILLING PROFILES POLICIES
CREATE POLICY "Users can manage own billing profiles" ON billing_profiles FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- CATEGORIES POLICIES
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (check_admin_role());

-- PRODUCTS POLICIES
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (check_admin_role());

-- PRODUCT IMAGES POLICIES
CREATE POLICY "Anyone can view product images" ON product_images FOR SELECT USING (product_id IN (SELECT id FROM products WHERE is_active = true));
CREATE POLICY "Admins can manage product images" ON product_images FOR ALL USING (check_admin_role());

-- PRODUCT VARIANTS POLICIES
CREATE POLICY "Anyone can view active product variants" ON product_variants FOR SELECT USING (is_active = true AND product_id IN (SELECT id FROM products WHERE is_active = true));
CREATE POLICY "Admins can manage product variants" ON product_variants FOR ALL USING (check_admin_role());

-- ORDERS POLICIES
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR check_admin_role());
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (check_admin_role());

-- ORDER ITEMS POLICIES
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())) OR check_admin_role());
CREATE POLICY "Admins can manage order items" ON order_items FOR ALL USING (check_admin_role());

-- CART ITEMS POLICIES
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- CONTENT POLICIES
CREATE POLICY "Anyone can view content" ON content FOR SELECT USING (true);
CREATE POLICY "Admins can manage content" ON content FOR ALL USING (check_admin_role());

-- DOCUMENTS POLICIES
CREATE POLICY "Anyone can view active documents" ON documents FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage documents" ON documents FOR ALL USING (check_admin_role());

-- SERVICES POLICIES
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services" ON services FOR ALL USING (check_admin_role());

-- PRICING POLICIES
CREATE POLICY "Anyone can view active pricing" ON pricing FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage pricing" ON pricing FOR ALL USING (check_admin_role());

-- STORAGE BUCKETS POLICIES
-- Product Images
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can manage product images" ON storage.objects FOR ALL USING (bucket_id = 'product-images' AND check_admin_role());

-- Documents
CREATE POLICY "Authenticated users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can manage documents" ON storage.objects FOR ALL USING (bucket_id = 'documents' AND check_admin_role());

-- Avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can manage own avatar" ON storage.objects FOR ALL USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
