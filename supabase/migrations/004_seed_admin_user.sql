/*
  # BielaVibe Admin User Seed
  1. Purpose: Ensure the primary admin user exists with a known password for testing and initial setup.
  2. Security: This script is idempotent. It deletes any existing conflicting user before creating a new one.
*/

-- Delete existing problematic records to start fresh
DELETE FROM public.users
WHERE auth_id IN (
  SELECT id FROM auth.users WHERE email = 'contact@pipesan.eu'
);

DELETE FROM auth.users WHERE email = 'contact@pipesan.eu';

-- Create admin user in auth.users with a hashed password
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'contact@pipesan.eu', crypt('Pipesan2022', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()
);

-- Create the corresponding user profile with the 'admin' role
INSERT INTO public.users (
  auth_id, first_name, last_name, phone, country, language, role, email_verified
)
SELECT
  id, 'Admin', 'PipeSan', '+33 675 111 62 18', 'RO', 'ro', 'admin', TRUE
FROM auth.users
WHERE email = 'contact@pipesan.eu';
