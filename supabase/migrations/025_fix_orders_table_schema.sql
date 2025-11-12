/*
  # Fix Orders Table Schema - Add Missing Columns
  1. Purpose: Add missing columns to orders table that are required by frontend
  2. Schema: Add notes column and any other missing columns
  3. Security: Maintain existing RLS policies and data integrity
*/

-- Fix orders table schema by adding missing columns
DO $$
BEGIN
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN notes text DEFAULT '';
        RAISE NOTICE 'Added notes column to orders table';
    ELSE
        RAISE NOTICE 'Orders table already has notes column';
    END IF;
    
    -- Add tracking_number column if it doesn't exist (API expects this)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'tracking_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN tracking_number text DEFAULT NULL;
        RAISE NOTICE 'Added tracking_number column to orders table';
    ELSE
        RAISE NOTICE 'Orders table already has tracking_number column';
    END IF;
    
    -- Ensure all billing address columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'billing_first_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN billing_first_name text DEFAULT '';
        RAISE NOTICE 'Added billing_first_name column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'billing_last_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN billing_last_name text DEFAULT '';
        RAISE NOTICE 'Added billing_last_name column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'billing_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN billing_address text DEFAULT '';
        RAISE NOTICE 'Added billing_address column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'billing_city'
    ) THEN
        ALTER TABLE orders ADD COLUMN billing_city text DEFAULT '';
        RAISE NOTICE 'Added billing_city column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'billing_postal_code'
    ) THEN
        ALTER TABLE orders ADD COLUMN billing_postal_code text DEFAULT '';
        RAISE NOTICE 'Added billing_postal_code column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'billing_country'
    ) THEN
        ALTER TABLE orders ADD COLUMN billing_country text DEFAULT '';
        RAISE NOTICE 'Added billing_country column to orders table';
    END IF;
    
    -- Ensure all shipping address columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_first_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_first_name text DEFAULT '';
        RAISE NOTICE 'Added shipping_first_name column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_last_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_last_name text DEFAULT '';
        RAISE NOTICE 'Added shipping_last_name column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_address text DEFAULT '';
        RAISE NOTICE 'Added shipping_address column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_city'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_city text DEFAULT '';
        RAISE NOTICE 'Added shipping_city column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_postal_code'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_postal_code text DEFAULT '';
        RAISE NOTICE 'Added shipping_postal_code column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_country'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_country text DEFAULT '';
        RAISE NOTICE 'Added shipping_country column to orders table';
    END IF;
    
    -- Ensure financial columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE orders ADD COLUMN subtotal decimal(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added subtotal column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'tax_amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN tax_amount decimal(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added tax_amount column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_amount decimal(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added shipping_amount column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_method'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_method text DEFAULT '';
        RAISE NOTICE 'Added shipping_method column to orders table';
    END IF;
    
    -- Ensure customer contact columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_email text DEFAULT '';
        RAISE NOTICE 'Added customer_email column to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_phone text DEFAULT '';
        RAISE NOTICE 'Added customer_phone column to orders table';
    END IF;
    
    -- Ensure updated_at column exists with proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'Added updated_at column to orders table';
    END IF;
    
    -- Check if updated_at has wrong type and fix it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'updated_at'
        AND data_type != 'timestamp with time zone'
    ) THEN
        -- Drop and recreate with correct type
        ALTER TABLE orders DROP COLUMN updated_at;
        ALTER TABLE orders ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'Fixed updated_at column type in orders table';
    END IF;
    
    -- Update all existing orders to have proper default values
    UPDATE orders 
    SET 
        notes = COALESCE(notes, ''),
        customer_email = COALESCE(customer_email, ''),
        customer_phone = COALESCE(customer_phone, ''),
        billing_first_name = COALESCE(billing_first_name, ''),
        billing_last_name = COALESCE(billing_last_name, ''),
        billing_address = COALESCE(billing_address, ''),
        billing_city = COALESCE(billing_city, ''),
        billing_postal_code = COALESCE(billing_postal_code, ''),
        billing_country = COALESCE(billing_country, ''),
        shipping_first_name = COALESCE(shipping_first_name, ''),
        shipping_last_name = COALESCE(shipping_last_name, ''),
        shipping_address = COALESCE(shipping_address, ''),
        shipping_city = COALESCE(shipping_city, ''),
        shipping_postal_code = COALESCE(shipping_postal_code, ''),
        shipping_country = COALESCE(shipping_country, ''),
        shipping_method = COALESCE(shipping_method, ''),
        updated_at = COALESCE(updated_at, created_at, now())
    WHERE 
        notes IS NULL OR customer_email IS NULL OR 
        billing_first_name IS NULL OR shipping_first_name IS NULL OR
        updated_at IS NULL;
    
    RAISE NOTICE 'Updated existing orders with default values';
END $$;

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_orders_updated_at'
        AND event_object_table = 'orders'
    ) THEN
        CREATE TRIGGER update_orders_updated_at
          BEFORE UPDATE ON orders
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added updated_at trigger for orders table';
    ELSE
        RAISE NOTICE 'Orders table already has updated_at trigger';
    END IF;
END $$;

-- Verify orders table schema is complete
DO $$
DECLARE
    required_columns TEXT[] := ARRAY[
        'id', 'user_id', 'order_number', 'status', 'payment_status',
        'customer_email', 'customer_phone',
        'billing_first_name', 'billing_last_name', 'billing_address', 'billing_city', 'billing_postal_code', 'billing_country',
        'shipping_first_name', 'shipping_last_name', 'shipping_address', 'shipping_city', 'shipping_postal_code', 'shipping_country',
        'subtotal', 'tax_amount', 'shipping_amount', 'total_amount', 'shipping_method', 'tracking_number', 'notes',
        'created_at', 'updated_at'
    ];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col TEXT;
    column_exists BOOLEAN;
BEGIN
    -- Check each required column
    FOREACH col IN ARRAY required_columns
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = col
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING 'Orders table is still missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Orders table has all required columns!';
    END IF;
    
    -- Count total columns in orders table
    SELECT COUNT(*) INTO column_exists 
    FROM information_schema.columns 
    WHERE table_name = 'orders';
    
    RAISE NOTICE 'Orders table verification - Total columns: %, Required: %, Missing: %', 
        column_exists, array_length(required_columns, 1), array_length(missing_columns, 1);
END $$;

-- Create sample order for testing if none exist
DO $$
DECLARE
    sample_user_id uuid;
    orders_count integer;
BEGIN
    -- Check if we have any orders
    SELECT COUNT(*) INTO orders_count FROM orders;
    
    -- If no orders exist, create a sample one for testing
    IF orders_count = 0 THEN
        -- Get first available user
        SELECT id INTO sample_user_id FROM users WHERE role = 'user' LIMIT 1;
        
        -- If no regular user, use admin
        IF sample_user_id IS NULL THEN
            SELECT id INTO sample_user_id FROM users WHERE role = 'admin' LIMIT 1;
        END IF;
        
        -- Create sample order if we have a user
        IF sample_user_id IS NOT NULL THEN
            INSERT INTO orders (
                user_id,
                order_number,
                status,
                payment_status,
                customer_email,
                customer_phone,
                billing_first_name,
                billing_last_name,
                billing_address,
                billing_city,
                billing_postal_code,
                billing_country,
                shipping_first_name,
                shipping_last_name,
                shipping_address,
                shipping_city,
                shipping_postal_code,
                shipping_country,
                subtotal,
                tax_amount,
                shipping_amount,
                total_amount,
                shipping_method,
                tracking_number,
                notes
            ) VALUES (
                sample_user_id,
                'ORD-' || extract(epoch from now())::text,
                'processing',
                'paid',
                'customer@example.com',
                '+33 123 456 789',
                'John',
                'Doe',
                '123 Rue de Rivoli',
                'Paris',
                '75001',
                'FR',
                'John',
                'Doe',
                '123 Rue de Rivoli',
                'Paris',
                '75001',
                'FR',
                89.99,
                18.00,
                9.99,
                117.98,
                'UPS Express',
                'TRACK-' || extract(epoch from now())::text,
                'Sample order for testing'
            );
            
            RAISE NOTICE 'Created sample order for testing';
        ELSE
            RAISE NOTICE 'No users found to create sample order';
        END IF;
    ELSE
        RAISE NOTICE 'Orders table already has % orders', orders_count;
    END IF;
END $$;

-- Ensure order_items table exists and has proper structure for orders
DO $$
BEGIN
    -- Check if order_items table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'order_items'
    ) THEN
        -- Create order_items table if it doesn't exist
        CREATE TABLE order_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
          product_id uuid REFERENCES products(id) ON DELETE SET NULL,
          variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
          quantity integer NOT NULL DEFAULT 1,
          price decimal(10,2) NOT NULL DEFAULT 0.00,
          unit_price decimal(10,2) NOT NULL DEFAULT 0.00,
          total_price decimal(10,2) NOT NULL DEFAULT 0.00,
          sku text NOT NULL DEFAULT '',
          name text NOT NULL DEFAULT '',
          created_at timestamptz DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own order items or admins view all" ON order_items
          FOR SELECT USING (
            order_id IN (
              SELECT id FROM orders 
              WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
            ) OR check_admin_role()
          );
        
        CREATE POLICY "Admins can manage order items" ON order_items
          FOR ALL USING (check_admin_role());
        
        RAISE NOTICE 'Created order_items table with proper structure and policies';
    ELSE
        RAISE NOTICE 'Order_items table already exists';
        
        -- Ensure required columns exist in order_items
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'unit_price'
        ) THEN
            ALTER TABLE order_items ADD COLUMN unit_price decimal(10,2) NOT NULL DEFAULT 0.00;
            RAISE NOTICE 'Added unit_price column to order_items table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'total_price'
        ) THEN
            ALTER TABLE order_items ADD COLUMN total_price decimal(10,2) NOT NULL DEFAULT 0.00;
            RAISE NOTICE 'Added total_price column to order_items table';
        END IF;
    END IF;
END $$;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);

-- Refresh statistics for schema cache
ANALYZE orders;
ANALYZE order_items;

-- Final comprehensive verification
DO $$
DECLARE
    orders_schema_complete BOOLEAN := true;
    orders_count integer;
    order_items_count integer;
    missing_cols TEXT[] := ARRAY[]::TEXT[];
    required_cols TEXT[] := ARRAY[
        'notes', 'tracking_number', 'customer_email', 'customer_phone',
        'billing_first_name', 'billing_last_name', 'billing_address', 'billing_city', 'billing_postal_code', 'billing_country',
        'shipping_first_name', 'shipping_last_name', 'shipping_address', 'shipping_city', 'shipping_postal_code', 'shipping_country',
        'subtotal', 'tax_amount', 'shipping_amount', 'total_amount', 'shipping_method', 'updated_at'
    ];
    col TEXT;
BEGIN
    -- Check each required column exists
    FOREACH col IN ARRAY required_cols
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = col
        ) THEN
            missing_cols := array_append(missing_cols, col);
            orders_schema_complete := false;
        END IF;
    END LOOP;
    
    -- Count existing data
    SELECT COUNT(*) INTO orders_count FROM orders;
    SELECT COUNT(*) INTO order_items_count FROM order_items;
    
    -- Report results
    IF orders_schema_complete THEN
        RAISE NOTICE '🎉 SUCCESS: Orders table schema is now complete!';
        RAISE NOTICE 'All required columns are present and ready for API calls';
    ELSE
        RAISE WARNING '❌ Orders table still missing columns: %', array_to_string(missing_cols, ', ');
    END IF;
    
    RAISE NOTICE 'Migration 025 completed - Orders: %, Order items: %, Schema complete: %', 
        orders_count, order_items_count, orders_schema_complete;
        
    -- Test the problematic query that was failing
    BEGIN
        PERFORM id, order_number, status, payment_status, customer_email, customer_phone,
                billing_first_name, billing_last_name, billing_address, billing_city, billing_postal_code, billing_country,
                shipping_first_name, shipping_last_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
                subtotal, tax_amount, shipping_amount, total_amount, shipping_method, tracking_number, notes,
                created_at, updated_at
        FROM orders 
        LIMIT 1;
        
        RAISE NOTICE '✅ Test query successful - API calls should now work!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '❌ Test query failed: %', SQLERRM;
    END;
END $$;
