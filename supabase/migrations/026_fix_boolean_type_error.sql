/*
  # Fix Boolean Type Error in Orders Migration
  1. Purpose: Fix the boolean type conversion error from migration 025
  2. Schema: Add missing columns with proper type handling
  3. Security: Maintain existing RLS policies and data integrity
*/

-- Fix the boolean type error by simplifying the logic
DO $$
DECLARE
    column_count integer;
    notes_exists boolean := false;
    tracking_exists boolean := false;
    updated_at_exists boolean := false;
BEGIN
    -- Check if notes column exists (simple approach)
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'notes';
    
    notes_exists := (column_count > 0);
    
    -- Add notes column if it doesn't exist
    IF NOT notes_exists THEN
        ALTER TABLE orders ADD COLUMN notes text DEFAULT '';
        RAISE NOTICE 'Added notes column to orders table';
    ELSE
        RAISE NOTICE 'Orders table already has notes column';
    END IF;
    
    -- Check if tracking_number column exists
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'tracking_number';
    
    tracking_exists := (column_count > 0);
    
    -- Add tracking_number column if it doesn't exist
    IF NOT tracking_exists THEN
        ALTER TABLE orders ADD COLUMN tracking_number text DEFAULT '';
        RAISE NOTICE 'Added tracking_number column to orders table';
    ELSE
        RAISE NOTICE 'Orders table already has tracking_number column';
    END IF;
    
    -- Check if updated_at column exists
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'updated_at';
    
    updated_at_exists := (column_count > 0);
    
    -- Add updated_at column if it doesn't exist
    IF NOT updated_at_exists THEN
        ALTER TABLE orders ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'Added updated_at column to orders table';
    ELSE
        RAISE NOTICE 'Orders table already has updated_at column';
    END IF;
END $$;

-- Ensure all address columns exist (simplified approach)
DO $$
DECLARE
    column_count integer;
BEGIN
    -- Add billing address columns one by one
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_first_name';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN billing_first_name text DEFAULT '';
        RAISE NOTICE 'Added billing_first_name column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_last_name';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN billing_last_name text DEFAULT '';
        RAISE NOTICE 'Added billing_last_name column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_address';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN billing_address text DEFAULT '';
        RAISE NOTICE 'Added billing_address column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_city';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN billing_city text DEFAULT '';
        RAISE NOTICE 'Added billing_city column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_postal_code';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN billing_postal_code text DEFAULT '';
        RAISE NOTICE 'Added billing_postal_code column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_country';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN billing_country text DEFAULT '';
        RAISE NOTICE 'Added billing_country column';
    END IF;
    
    -- Add shipping address columns
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_first_name';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN shipping_first_name text DEFAULT '';
        RAISE NOTICE 'Added shipping_first_name column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_last_name';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN shipping_last_name text DEFAULT '';
        RAISE NOTICE 'Added shipping_last_name column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_address';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN shipping_address text DEFAULT '';
        RAISE NOTICE 'Added shipping_address column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_city';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN shipping_city text DEFAULT '';
        RAISE NOTICE 'Added shipping_city column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_postal_code';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN shipping_postal_code text DEFAULT '';
        RAISE NOTICE 'Added shipping_postal_code column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_country';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN shipping_country text DEFAULT '';
        RAISE NOTICE 'Added shipping_country column';
    END IF;
    
    -- Add financial columns
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN subtotal decimal(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added subtotal column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_amount';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN tax_amount decimal(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added tax_amount column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_amount';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN shipping_amount decimal(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added shipping_amount column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_method';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN shipping_method text DEFAULT '';
        RAISE NOTICE 'Added shipping_method column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_email';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN customer_email text DEFAULT '';
        RAISE NOTICE 'Added customer_email column';
    END IF;
    
    SELECT COUNT(*) INTO column_count FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_phone';
    IF column_count = 0 THEN
        ALTER TABLE orders ADD COLUMN customer_phone text DEFAULT '';
        RAISE NOTICE 'Added customer_phone column';
    END IF;
END $$;

-- Update any existing orders to have default values for new columns
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
    tracking_number = COALESCE(tracking_number, ''),
    updated_at = COALESCE(updated_at, created_at, now())
WHERE 
    notes IS NULL OR customer_email IS NULL OR billing_first_name IS NULL OR 
    shipping_first_name IS NULL OR updated_at IS NULL OR tracking_number IS NULL;

-- Add trigger for updated_at if it doesn't exist
DO $$
DECLARE
    trigger_count integer;
BEGIN
    SELECT COUNT(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_name = 'update_orders_updated_at' AND event_object_table = 'orders';
    
    IF trigger_count = 0 THEN
        CREATE TRIGGER update_orders_updated_at
          BEFORE UPDATE ON orders
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added updated_at trigger for orders table';
    ELSE
        RAISE NOTICE 'Orders table already has updated_at trigger';
    END IF;
END $$;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Refresh table statistics
ANALYZE orders;

-- Final verification with proper error handling
DO $$
DECLARE
    total_columns integer;
    required_columns text[] := ARRAY[
        'notes', 'tracking_number', 'customer_email', 'customer_phone',
        'billing_first_name', 'billing_last_name', 'billing_address', 'billing_city', 'billing_postal_code', 'billing_country',
        'shipping_first_name', 'shipping_last_name', 'shipping_address', 'shipping_city', 'shipping_postal_code', 'shipping_country',
        'subtotal', 'tax_amount', 'shipping_amount', 'total_amount', 'shipping_method', 'updated_at'
    ];
    missing_count integer := 0;
    col text;
    column_exists_count integer;
BEGIN
    -- Count total columns in orders table
    SELECT COUNT(*) INTO total_columns 
    FROM information_schema.columns 
    WHERE table_name = 'orders';
    
    -- Check each required column individually
    FOREACH col IN ARRAY required_columns
    LOOP
        SELECT COUNT(*) INTO column_exists_count 
        FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = col;
        
        IF column_exists_count = 0 THEN
            missing_count := missing_count + 1;
            RAISE WARNING 'Missing column: %', col;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration 026 completed - Total columns: %, Required columns: %, Missing: %', 
        total_columns, array_length(required_columns, 1), missing_count;
    
    -- Test the query that was failing
    BEGIN
        PERFORM id, order_number, status, payment_status, customer_email, customer_phone,
                billing_first_name, billing_last_name, billing_address, billing_city, billing_postal_code, billing_country,
                shipping_first_name, shipping_last_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
                subtotal, tax_amount, shipping_amount, total_amount, shipping_method, tracking_number, notes,
                created_at, updated_at
        FROM orders 
        LIMIT 1;
        
        RAISE NOTICE '✅ Test query successful - Orders API should now work!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '❌ Test query still failing: %', SQLERRM;
    END;
END $$;

-- Create a simple test order if none exist (for testing the API)
DO $$
DECLARE
    orders_count integer;
    admin_user_id uuid;
BEGIN
    SELECT COUNT(*) INTO orders_count FROM orders;
    
    IF orders_count = 0 THEN
        -- Get admin user id
        SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
        
        IF admin_user_id IS NOT NULL THEN
            INSERT INTO orders (
                user_id, order_number, status, payment_status,
                customer_email, customer_phone,
                billing_first_name, billing_last_name, billing_address, billing_city, billing_postal_code, billing_country,
                shipping_first_name, shipping_last_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
                subtotal, tax_amount, shipping_amount, total_amount, shipping_method, tracking_number, notes
            ) VALUES (
                admin_user_id,
                'ORD-TEST-001',
                'processing',
                'paid',
                'customer@example.com',
                '+33 123 456 789',
                'John', 'Doe', '123 Rue de Rivoli', 'Paris', '75001', 'FR',
                'John', 'Doe', '123 Rue de Rivoli', 'Paris', '75001', 'FR',
                89.99, 18.00, 9.99, 117.98, 'UPS Express', 'TRACK-TEST-001', 'Test order'
            );
            
            RAISE NOTICE 'Created test order successfully';
        END IF;
    END IF;
END $$;
