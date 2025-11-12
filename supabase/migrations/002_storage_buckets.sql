/*
  # BielaVibe Storage Buckets
  1. Purpose: Create storage buckets for product images, documents, and avatars.
  2. Security: Policies are defined in the RLS policies migration file to prevent recursion.
*/ 

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('documents', 'documents', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
