/*
  # Create Reviews System for Products
  1. Purpose: Add comprehensive reviews system with admin management
  2. Schema: product_reviews table with rating, verification, moderation
  3. Security: RLS policies for public reading and admin management
*/

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  comment text NOT NULL,
  is_verified_purchase boolean DEFAULT false,
  purchase_date date DEFAULT NULL,
  admin_notes text DEFAULT '',
  is_approved boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by_admin boolean DEFAULT false
);

-- Add review summary columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS avg_rating decimal(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;

-- Create function to update product rating when reviews change
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    product_uuid uuid;
    new_avg_rating decimal(3,2);
    new_total_reviews integer;
BEGIN
    -- Get product ID from either NEW or OLD record
    product_uuid := COALESCE(NEW.product_id, OLD.product_id);
    
    -- Calculate new average rating and total count
    SELECT 
        COALESCE(AVG(rating), 0)::decimal(3,2),
        COUNT(*)::integer
    INTO new_avg_rating, new_total_reviews
    FROM product_reviews 
    WHERE product_id = product_uuid 
    AND is_approved = true;
    
    -- Update the product
    UPDATE products 
    SET 
        avg_rating = new_avg_rating,
        total_reviews = new_total_reviews,
        rating = new_avg_rating, -- Keep existing rating column in sync
        review_count = new_total_reviews, -- Keep existing review_count column in sync
        updated_at = now()
    WHERE id = product_uuid;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic rating updates
DROP TRIGGER IF EXISTS update_product_rating_trigger ON product_reviews;
CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Enable RLS on product_reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_reviews
CREATE POLICY "Anyone can view approved reviews" ON product_reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Authenticated users can create reviews" ON product_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR -- User can create their own review
    check_admin_role()      -- Admin can create any review
  );

CREATE POLICY "Users can update own reviews" ON product_reviews
  FOR UPDATE USING (
    (auth.uid() = user_id AND created_by_admin = false) OR -- User can update their own non-admin review
    check_admin_role() -- Admin can update any review
  ) WITH CHECK (
    (auth.uid() = user_id AND created_by_admin = false) OR
    check_admin_role()
  );

CREATE POLICY "Admins can delete reviews" ON product_reviews
  FOR DELETE USING (check_admin_role());

-- Insert sample reviews for existing products
DO $$
DECLARE
    sample_product_id uuid;
BEGIN
    -- Get first active product for sample reviews
    SELECT id INTO sample_product_id 
    FROM products 
    WHERE is_active = true 
    LIMIT 1;
    
    -- Insert sample reviews if we have a product
    IF sample_product_id IS NOT NULL THEN
        INSERT INTO product_reviews (
            product_id, customer_name, customer_email, rating, title, comment, 
            is_verified_purchase, purchase_date, is_approved, created_by_admin
        ) VALUES
        (
            sample_product_id,
            'Jean-Pierre Dubois',
            'jp.dubois@email.fr',
            5,
            'Excellent robinet d''angle',
            'Très bonne qualité, installation facile. Le laiton CW617N est vraiment résistant et l''étanchéité est parfaite. Je recommande pour les installations professionnelles.',
            true,
            '2025-01-15'::date,
            true,
            true
        ),
        (
            sample_product_id,
            'Marie Leclerc',
            'marie.leclerc@email.fr',
            4,
            'Bon produit',
            'Conforme à la description, livraison rapide. Petit bémol sur l''emballage qui aurait pu être renforcé mais le produit est arrivé en bon état.',
            true,
            '2025-01-08'::date,
            true,
            true
        ),
        (
            sample_product_id,
            'Philippe Martin',
            'philippe.martin@email.fr',
            5,
            'Parfait pour mon projet',
            'Utilisé pour une rénovation de salle de bain. La qualité est au rendez-vous, l''installation s''est faite sans problème. Très satisfait de mon achat.',
            false,
            '2025-01-03'::date,
            true,
            true
        );
        
        RAISE NOTICE 'Sample reviews created for product %', sample_product_id;
    END IF;
END $$;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_product_reviews_verified ON product_reviews(is_verified_purchase);

-- Add updated_at trigger
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get reviews for a product with pagination
CREATE OR REPLACE FUNCTION get_product_reviews(
  p_product_id uuid,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  review_id uuid,
  customer_name text,
  rating integer,
  title text,
  comment text,
  is_verified_purchase boolean,
  purchase_date date,
  created_at timestamptz,
  helpful_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id as review_id,
    pr.customer_name,
    pr.rating,
    pr.title,
    pr.comment,
    pr.is_verified_purchase,
    pr.purchase_date,
    pr.created_at,
    pr.helpful_count
  FROM product_reviews pr
  WHERE pr.product_id = p_product_id
    AND pr.is_approved = true
  ORDER BY pr.is_verified_purchase DESC, pr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final verification
DO $$
DECLARE
    reviews_table_exists boolean;
    sample_reviews_count integer;
    products_updated integer;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'product_reviews'
    ) INTO reviews_table_exists;
    
    -- Count sample reviews
    SELECT COUNT(*) INTO sample_reviews_count FROM product_reviews;
    
    -- Count products with updated ratings
    SELECT COUNT(*) INTO products_updated 
    FROM products 
    WHERE avg_rating > 0;
    
    RAISE NOTICE 'Migration 023 completed - Reviews table: %, Sample reviews: %, Products updated: %', 
        reviews_table_exists, sample_reviews_count, products_updated;
END $$;
