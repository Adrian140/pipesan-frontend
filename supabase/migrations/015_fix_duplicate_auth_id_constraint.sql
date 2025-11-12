/*
  # Fix Duplicate Auth ID Constraint Error
  1. Purpose: Clean up duplicate user records and fix auth_id constraint issues
  2. Schema: Remove duplicates and ensure proper auth_id relationships
  3. Security: Maintain data integrity while fixing registration flow
*/

-- First, let's analyze the current state
DO $$
DECLARE
    auth_users_count INTEGER;
    public_users_count INTEGER;
    duplicate_count INTEGER;
BEGIN
    -- Count auth.users
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    
    -- Count public.users
    SELECT COUNT(*) INTO public_users_count FROM public.users;
    
    -- Count duplicates in public.users
    SELECT COUNT(*) INTO duplicate_count 
    FROM (
        SELECT auth_id, COUNT(*) as cnt 
        FROM public.users 
        WHERE auth_id IS NOT NULL 
        GROUP BY auth_id 
        HAVING COUNT(*) > 1
    ) AS duplicates;
    
    RAISE NOTICE 'Current state - Auth users: %, Public users: %, Duplicates: %', 
        auth_users_count, public_users_count, duplicate_count;
END $$;

-- Clean up duplicate user records (keep the most recent one)
DELETE FROM public.users 
WHERE id IN (
    SELECT id FROM (
        SELECT id, auth_id,
               ROW_NUMBER() OVER (PARTITION BY auth_id ORDER BY created_at DESC) as rn
        FROM public.users 
        WHERE auth_id IS NOT NULL
    ) ranked 
    WHERE rn > 1
);

-- Clean up orphaned user records (auth_id doesn't exist in auth.users)
DELETE FROM public.users 
WHERE auth_id IS NOT NULL 
AND auth_id NOT IN (SELECT id FROM auth.users);

-- Clean up users without auth_id (except admin users we want to keep)
DELETE FROM public.users 
WHERE auth_id IS NULL 
AND role != 'admin' 
AND email NOT LIKE '%pipesan.eu%';

-- Ensure admin user exists and has proper auth linkage
DO $$
DECLARE
    admin_auth_id UUID;
    admin_user_exists BOOLEAN;
    admin_emails TEXT[] := ARRAY['contact@pipesan.eu', 'admin@pipesan.eu'];
    admin_email TEXT;
BEGIN
    -- Check for admin users in auth.users
    FOR admin_email IN SELECT unnest(admin_emails) LOOP
        SELECT id INTO admin_auth_id 
        FROM auth.users 
        WHERE email = admin_email 
        LIMIT 1;
        
        IF admin_auth_id IS NOT NULL THEN
            -- Check if profile exists
            SELECT EXISTS(
                SELECT 1 FROM public.users 
                WHERE auth_id = admin_auth_id
            ) INTO admin_user_exists;
            
            -- Create profile if it doesn't exist
            IF NOT admin_user_exists THEN
                INSERT INTO public.users (
                    auth_id, first_name, last_name, phone, country, language, role, email_verified
                ) VALUES (
                    admin_auth_id, 'Admin', 'PipeSan', '+33 675 111 62 18', 'RO', 'ro', 'admin', TRUE
                ) ON CONFLICT (auth_id) DO NOTHING;
                RAISE NOTICE 'Created admin profile for %', admin_email;
            END IF;
            
            EXIT; -- Exit loop after first admin found
        END IF;
    END LOOP;
END $$;

-- Temporarily disable the constraint to fix any remaining issues
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_id_key;

-- Re-add the constraint (will fail if duplicates still exist)
DO $$
BEGIN
    BEGIN
        ALTER TABLE users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
        RAISE NOTICE 'Successfully re-added unique constraint on auth_id';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'Still have duplicates, cleaning them up...';
            
            -- Force cleanup of remaining duplicates
            DELETE FROM public.users 
            WHERE id NOT IN (
                SELECT DISTINCT ON (auth_id) id 
                FROM public.users 
                WHERE auth_id IS NOT NULL 
                ORDER BY auth_id, created_at DESC
            ) AND auth_id IS NOT NULL;
            
            -- Try again
            ALTER TABLE users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
            RAISE NOTICE 'Constraint added after forced cleanup';
  