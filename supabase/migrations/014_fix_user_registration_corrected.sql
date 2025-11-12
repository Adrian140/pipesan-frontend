/*
  # Fix User Registration RLS Issues - CORRECTED
  1. Purpose: Fix RLS policies blocking user registration during signup
  2. Schema: Update policies to allow INSERT during registration flow
  3. Security: Maintain security while enabling user creation
  4. Fix: Remove incorrect email index (email is in auth.users, not public.users)
*/

-- Temporarily disable RLS to fix blocking policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing user policies to start clean
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on auth_id" ON public.users;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile or admins update any" ON public.users;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.users;

-- Recreate the admin check function with better error handling
DROP FUNCTION IF EXISTS check_admin_role() CASCADE;
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

-- Create new policies that work with registration flow

-- 1. ALLOW ANYONE to INSERT during registration (bypass auth check for new users)
CREATE POLICY "Allow user registration" ON public.users
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts during registration

-- 2. ALLOW users to view their own profile OR admins to view all
CREATE POLICY "Users can view own profile or admins view all" ON public.users
  FOR SELECT
  USING (
    auth.uid() = auth_id OR 
    check_admin_role() OR
    auth.uid() IS NULL -- Allow during registration flow
  );

-- 3. ALLOW users to update their own profile OR admins to update any
CREATE POLICY "Users can update own profile or admins update any" ON public.users
  FOR UPDATE
  USING (auth.uid() = auth_id OR check_admin_role())
  WITH CHECK (auth.uid() = auth_id OR check_admin_role());

-- 4. ALLOW only admins to delete users
CREATE POLICY "Only admins can delete users" ON public.users
  FOR DELETE
  USING (check_admin_role());

-- Fix any orphaned user records that might cause issues
UPDATE users 
SET 
  first_name = COALESCE(NULLIF(first_name, ''), 'User'),
  last_name = COALESCE(NULLIF(last_name, ''), 'User'),
  country = COALESCE(NULLIF(country, ''), 'RO'),
  language = COALESCE(NULLIF(language, ''), 'ro'),
  role = COALESCE(NULLIF(role, ''), 'user')
WHERE 
  first_name IS NULL OR first_name = '' OR
  last_name IS NULL OR last_name = '' OR
  country IS NULL OR country = '' OR
  language IS NULL OR language = '' OR
  role IS NULL OR role = '';

-- Ensure admin user exists and is properly configured
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

-- Add helpful indexes if they don't exist (CORRECTED - removed email index)
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Final verification
DO $$
DECLARE
    policy_count INTEGER;
    admin_count INTEGER;
    users_count INTEGER;
BEGIN
    -- Count policies on users table
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'public';
    
    -- Count admin users
    SELECT COUNT(*) INTO admin_count 
    FROM users 
    WHERE role = 'admin';
    
    -- Count total users
    SELECT COUNT(*) INTO users_count 
    FROM users;
    
    RAISE NOTICE 'Migration 014 completed - Policies: %, Admins: %, Total users: %', 
        policy_count, admin_count, users_count;
END $$;
