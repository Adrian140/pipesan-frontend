/*
  # Fix Order Items Schema Error for User Management
  1. Purpose: Resolve "column order_items_2.price does not exist" error in admin users query
  2. Schema: Ensure order_items table has correct structure and fix any inconsistencies
  3. Security: Maintain RLS policies and data integrity
*/

-- Check and fix order_items table structure
DO $$
BEGIN
    -- Verify order_items table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'order_items' AND table_schema = 'public'
    ) THEN
        -- Create order_items table if it doesn't exist
        CREATE TABLE order_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
          product_id uuid REFERENCES products(id) ON DELETE SET NULL,
          variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
          quantity integer NOT NULL,
          unit_price decimal(10,2) NOT NULL DEFAULT 0.00, -- Use unit_price instead of price
          total_price decimal(10,2) NOT NULL DEFAULT 0.00, -- Add total_price for clarity
          sku text NOT NULL,
          name text NOT NULL,
          created_at timestamptz DEFAULT now()
        );
        RAISE NOTICE 'Created order_items table with correct schema';
    ELSE
        -- Check if price column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' AND column_name = 'price'
        ) THEN
            -- Add price column if it doesn't exist
            ALTER TABLE order_items ADD COLUMN price decimal(10,2) NOT NULL DEFAULT 0.00;
            RAISE NOTICE 'Added price column to order_items table';
        END IF;
        
        -- Check if unit_price column exists (better naming convention)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' AND column_name = 'unit_price'
        ) THEN
            -- Add unit_price column for clarity
            ALTER TABLE order_items ADD COLUMN unit_price decimal(10,2) NOT NULL DEFAULT 0.00;
            RAISE NOTICE 'Added unit_price column to order_items table';
        END IF;
        
        -- Check if total_price column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' AND column_name = 'total_price'
        ) THEN
            -- Add total_price column for better order management
            ALTER TABLE order_items ADD COLUMN total_price decimal(10,2) NOT NULL DEFAULT 0.00;
            RAISE NOTICE 'Added total_price column to order_items table';
        END IF;
    END IF;
END $$;

-- Ensure order_items has proper RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'order_items' AND rowsecurity = true
    ) THEN
        ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on order_items table';
        
        -- Create policies for order_items if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'order_items' AND policyname = 'Users can view own order items or admins view all'
        ) THEN
            CREATE POLICY "Users can view own order items or admins view all" ON order_items
              FOR SELECT USING (
                order_id IN (
                  SELECT id FROM orders 
                  WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
                ) OR check_admin_role()
              );
            RAISE NOTICE 'Created SELECT policy for order_items';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'order_items' AND policyname = 'Admins can manage order items'
        ) THEN
            CREATE POLICY "Admins can manage order items" ON order_items
              FOR ALL USING (check_admin_role());
            RAISE NOTICE 'Created admin management policy for order_items';
        END IF;
    END IF;
END $$;

-- Update existing order_items records to have correct price calculations
UPDATE order_items 
SET 
  unit_price = COALESCE(price, unit_price, 0.00),
  total_price = COALESCE(price * quantity, unit_price * quantity, 0.00)
WHERE 
  unit_price IS NULL OR unit_price = 0 OR
  total_price IS NULL OR total_price = 0;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);

-- Add constraint to ensure positive prices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_items' 
        AND constraint_name = 'chk_order_items_price_positive'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT chk_order_items_price_positive CHECK (
          (price IS NULL OR price >= 0) AND 
          (unit_price IS NULL OR unit_price >= 0) AND 
          (total_price IS NULL OR total_price >= 0)
        );
        RAISE NOTICE 'Added price validation constraints to order_items';
    END IF;
END $$;

-- Create function to calculate order totals automatically
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total_price when inserting/updating order items
    NEW.total_price := COALESCE(NEW.unit_price, NEW.price, 0.00) * NEW.quantity;
    
    -- Update order total when order items change
    UPDATE orders 
    SET 
      subtotal = (
        SELECT COALESCE(SUM(COALESCE(total_price, unit_price * quantity, price * quantity)), 0)
        FROM order_items 
        WHERE order_id = NEW.order_id
      ),
      updated_at = now()
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic order total calculation
DROP TRIGGER IF EXISTS calculate_order_totals_trigger ON order_items;
CREATE TRIGGER calculate_order_totals_trigger
    BEFORE INSERT OR UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_totals();

-- Insert sample order items for testing if orders exist
DO $$
DECLARE
    sample_order_id uuid;
    sample_product_id uuid;
BEGIN
    -- Find an existing order
    SELECT id INTO sample_order_id FROM orders LIMIT 1;
    
    -- Find an existing product  
    SELECT id INTO sample_product_id FROM products WHERE is_active = true LIMIT 1;
    
    -- Create sample order items if we have both order and product
    IF sample_order_id IS NOT NULL AND sample_product_id IS NOT NULL THEN
        -- Check if order items already exist for this order
        IF NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = sample_order_id) THEN
            INSERT INTO order_items (
                order_id,
                product_id,
                quantity,
                price,
                unit_price,
                total_price,
                sku,
                name
            ) SELECT 
                sample_order_id,
                p.id,
                2, -- quantity
                COALESCE(p.sale_price, p.price, 0), -- price
                COALESCE(p.sale_price, p.price, 0), -- unit_price
                COALESCE(p.sale_price, p.price, 0) * 2, -- total_price
                p.sku,
                p.name
            FROM products p 
            WHERE p.id = sample_product_id
            AND p.is_active = true;
            
            RAISE NOTICE 'Created sample order items for testing';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create sample order items: %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
    price_column_exists boolean;
    unit_price_column_exists boolean;
    total_price_column_exists boolean;
    order_items_count integer;
    policies_count integer;
BEGIN
    -- Check column existence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'price'
    ) INTO price_column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'unit_price'
    ) INTO unit_price_column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'total_price'
    ) INTO total_price_column_exists;
    
    -- Count order items and policies
    SELECT COUNT(*) INTO order_items_count FROM order_items;
    
    SELECT COUNT(*) INTO policies_count 
    FROM pg_policies 
    WHERE tablename = 'order_items';
    
    RAISE NOTICE 'Migration 017 completed - Price column: %, Unit price: %, Total price: %, Order items: %, Policies: %', 
        price_column_exists, unit_price_column_exists, total_price_column_exists, order_items_count, policies_count;
END $$;
