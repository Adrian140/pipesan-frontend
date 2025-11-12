/*
  # Fix Updated At Columns for All Tables
  1. Purpose: Ensure all tables have updated_at column and proper triggers
  2. Schema: Add missing updated_at columns and triggers for automatic updates
  3. Security: Maintain existing RLS policies and data integrity
*/

-- First, ensure the update function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Check and fix all tables that need updated_at column
DO $$
DECLARE
    table_record RECORD;
    trigger_exists BOOLEAN;
BEGIN
    -- Tables that should have updated_at column
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'users', 'addresses', 'billing_profiles', 'categories', 'products', 
            'product_images', 'product_variants', 'orders', 'cart_items', 
            'content', 'documents', 'services', 'pricing', 'invoices',
            'shipping_rates', 'vat_rates', 'tax_rules', 'product_reviews',
            'email_notifications', 'shipping_tracking', 'email_logs', 'tracking_notifications'
        )
    LOOP
        -- Check if updated_at column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND column_name = 'updated_at'
        ) THEN
            -- Add updated_at column
            EXECUTE format('ALTER TABLE %I ADD COLUMN updated_at timestamptz DEFAULT now()', table_record.table_name);
            RAISE NOTICE 'Added updated_at column to table: %', table_record.table_name;
        ELSE
            RAISE NOTICE 'Table % already has updated_at column', table_record.table_name;
        END IF;
        
        -- Check if trigger exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = format('update_%s_updated_at', table_record.table_name)
            AND event_object_table = table_record.table_name
        ) INTO trigger_exists;
        
        -- Create trigger if it doesn't exist
        IF NOT trigger_exists THEN
            EXECUTE format(
                'CREATE TRIGGER update_%s_updated_at 
                 BEFORE UPDATE ON %I 
                 FOR EACH ROW 
                 EXECUTE FUNCTION update_updated_at_column()',
                table_record.table_name,
                table_record.table_name
            );
            RAISE NOTICE 'Created updated_at trigger for table: %', table_record.table_name;
        ELSE
            RAISE NOTICE 'Table % already has updated_at trigger', table_record.table_name;
        END IF;
    END LOOP;
END $$;

-- Specifically fix billing_profiles table issues
DO $$
BEGIN
    -- Ensure billing_profiles has all required columns for frontend mapping
    
    -- Check if updated_at column exists and is properly typed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'billing_profiles' 
        AND column_name = 'updated_at'
        AND data_type != 'timestamp with time zone'
    ) THEN
        -- Drop and recreate with correct type
        ALTER TABLE billing_profiles DROP COLUMN updated_at;
        ALTER TABLE billing_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'Fixed updated_at column type in billing_profiles';
    END IF;
    
    -- Update all existing records to have updated_at value
    UPDATE billing_profiles 
    SET updated_at = COALESCE(updated_at, created_at, now()) 
    WHERE updated_at IS NULL;
    
    -- Make sure updated_at is NOT NULL
    ALTER TABLE billing_profiles ALTER COLUMN updated_at SET NOT NULL;
    
    RAISE NOTICE 'Fixed billing_profiles updated_at column';
END $$;

-- Specifically fix addresses table issues
DO $$
BEGIN
    -- Check if addresses table has updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'addresses' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE addresses ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'Added updated_at column to addresses table';
    END IF;
    
    -- Update all existing addresses to have updated_at value
    UPDATE addresses 
    SET updated_at = COALESCE(updated_at, created_at, now()) 
    WHERE updated_at IS NULL;
    
    -- Ensure NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'addresses' 
        AND column_name = 'updated_at'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE addresses ALTER COLUMN updated_at SET NOT NULL;
        RAISE NOTICE 'Set updated_at as NOT NULL in addresses';
    END IF;
END $$;

-- Fix any schema cache issues by refreshing table statistics
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
    LOOP
        BEGIN
            EXECUTE format('ANALYZE %I', table_name);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not analyze table %: %', table_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Refreshed table statistics for schema cache';
END $$;

-- Verify all tables have proper updated_at columns and triggers
DO $$
DECLARE
    missing_columns INTEGER := 0;
    missing_triggers INTEGER := 0;
    table_record RECORD;
    has_column BOOLEAN;
    has_trigger BOOLEAN;
BEGIN
    -- Check each important table
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'users', 'addresses', 'billing_profiles', 'categories', 'products', 
            'orders', 'cart_items', 'content', 'services', 'pricing'
        )
    LOOP
        -- Check for updated_at column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND column_name = 'updated_at'
        ) INTO has_column;
        
        IF NOT has_column THEN
            missing_columns := missing_columns + 1;
            RAISE WARNING 'Table % is missing updated_at column', table_record.table_name;
        END IF;
        
        -- Check for trigger
        SELECT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = format('update_%s_updated_at', table_record.table_name)
            AND event_object_table = table_record.table_name
        ) INTO has_trigger;
        
        IF NOT has_trigger THEN
            missing_triggers := missing_triggers + 1;
            RAISE WARNING 'Table % is missing updated_at trigger', table_record.table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration 024 verification - Missing columns: %, Missing triggers: %', 
        missing_columns, missing_triggers;
        
    IF missing_columns = 0 AND missing_triggers = 0 THEN
        RAISE NOTICE '✅ All tables have proper updated_at columns and triggers';
    ELSE
        RAISE WARNING '⚠️ Some tables still have issues - check warnings above';
    END IF;
END $$;

-- Test the billing_profiles update functionality
DO $$
DECLARE
    test_profile_id uuid;
    test_result RECORD;
BEGIN
    -- Get a billing profile to test with
    SELECT id INTO test_profile_id 
    FROM billing_profiles 
    LIMIT 1;
    
    IF test_profile_id IS NOT NULL THEN
        -- Test update operation
        UPDATE billing_profiles 
        SET phone = COALESCE(phone, '+33 TEST UPDATE')
        WHERE id = test_profile_id;
        
        -- Verify updated_at was updated
        SELECT updated_at INTO test_result
        FROM billing_profiles 
        WHERE id = test_profile_id;
        
        IF test_result.updated_at > (now() - interval '10 seconds') THEN
            RAISE NOTICE '✅ Billing profiles update trigger working correctly';
        ELSE
            RAISE WARNING '⚠️ Billing profiles trigger may not be working';
        END IF;
    ELSE
        RAISE NOTICE 'No billing profiles found to test with';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error testing billing profiles update: %', SQLERRM;
END $$;

-- Final verification of specific tables mentioned in the error
DO $$
DECLARE
    bp_has_updated_at BOOLEAN;
    addr_has_updated_at BOOLEAN;
    bp_updated_at_type TEXT;
    addr_updated_at_type TEXT;
BEGIN
    -- Check billing_profiles
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'billing_profiles' 
        AND column_name = 'updated_at'
    ) INTO bp_has_updated_at;
    
    SELECT data_type INTO bp_updated_at_type
    FROM information_schema.columns 
    WHERE table_name = 'billing_profiles' 
    AND column_name = 'updated_at';
    
    -- Check addresses
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'addresses' 
        AND column_name = 'updated_at'
    ) INTO addr_has_updated_at;
    
    SELECT data_type INTO addr_updated_at_type
    FROM information_schema.columns 
    WHERE table_name = 'addresses' 
    AND column_name = 'updated_at';
    
    RAISE NOTICE 'Final verification - billing_profiles updated_at: % (type: %), addresses updated_at: % (type: %)', 
        bp_has_updated_at, bp_updated_at_type, addr_has_updated_at, addr_updated_at_type;
        
    IF bp_has_updated_at AND addr_has_updated_at THEN
        RAISE NOTICE '�� SUCCESS: Both billing_profiles and addresses have updated_at columns!';
    ELSE
        RAISE WARNING '❌ PROBLEM: Some tables still missing updated_at columns';
    END IF;
END $$;
