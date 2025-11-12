/*
  # BielaVibe Schema Fixes and Improvements
  1. Purpose: Fix schema issues and add missing constraints and indexes
  2. Schema: Add proper indexes, fix duplicate columns, optimize queries
  3. Security: Maintain existing RLS policies
*/

-- Fix duplicate short_description column in products table
ALTER TABLE products DROP COLUMN IF EXISTS short_description;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add missing constraints
ALTER TABLE products ADD CONSTRAINT chk_products_price_positive CHECK (price >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_sale_price_positive CHECK (sale_price IS NULL OR sale_price >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_stock_quantity_positive CHECK (stock_quantity >= 0);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add missing foreign key constraints with proper handling
ALTER TABLE product_images 
ADD CONSTRAINT fk_product_images_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_variants 
ADD CONSTRAINT fk_product_variants_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Optimize JSONB columns with GIN indexes
CREATE INDEX IF NOT EXISTS idx_products_specifications_gin ON products USING GIN (specifications);
CREATE INDEX IF NOT EXISTS idx_products_amazon_links_gin ON products USING GIN (amazon_links);
CREATE INDEX IF NOT EXISTS idx_product_variants_attributes_gin ON product_variants USING GIN (attributes);

-- Add helpful views for common queries
CREATE OR REPLACE VIEW active_products_with_category AS
SELECT 
    p.*,
    c.name as category_name,
    c.slug as category_slug
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true;

CREATE OR REPLACE VIEW products_with_images AS
SELECT 
    p.*,
    COALESCE(
        CASE 
            WHEN jsonb_array_length(COALESCE(p.images, '[]'::jsonb)) > 0 
            THEN p.images
            ELSE (
                SELECT jsonb_agg(pi.image_url ORDER BY pi.sort_order, pi.created_at)
                FROM product_images pi 
                WHERE pi.product_id = p.id
            )
        END,
        '[]'::jsonb
    ) as all_images
FROM products p;

-- Add helpful functions
CREATE OR REPLACE FUNCTION get_product_primary_image(product_id uuid)
RETURNS text AS $$
DECLARE
    primary_image text;
BEGIN
    -- Try to get from images JSON array first
    SELECT (images->0)::text INTO primary_image
    FROM products 
    WHERE id = product_id AND jsonb_array_length(COALESCE(images, '[]'::jsonb)) > 0;
    
    -- If not found, get from product_images table
    IF primary_image IS NULL THEN
        SELECT image_url INTO primary_image
        FROM product_images 
        WHERE product_id = get_product_primary_image.product_id
        ORDER BY is_primary DESC, sort_order ASC, created_at ASC
        LIMIT 1;
    END IF;
    
    RETURN TRIM(primary_image, '"');
END;
$$ LANGUAGE plpgsql;
