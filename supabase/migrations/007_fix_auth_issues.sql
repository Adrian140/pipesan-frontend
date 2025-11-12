/*
  # Fix Authentication Issues
  1. Purpose: Resolve 500 errors in Supabase auth by fixing RLS policies and constraints
  2. Schema: Ensure proper auth.users integration and fix any blocking constraints
  3. Security: Maintain security while allowing proper authentication flow
*/

-- Temporarily disable RLS to fix any blocking policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop and recreate the admin check function with better error handling
DROP FUNCTION IF EXISTS check_admin_role();
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

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create simplified, working policies
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

-- Fix any constraint issues that might block auth
ALTER TABLE users ALTER COLUMN auth_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN auth_id SET NOT NULL;

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
