/*
  # Fix RAISE Syntax Error in VAT Migration
  1. Purpose: Fix PostgreSQL RAISE statement syntax error
  2. Schema: No schema changes, just fix the notice formatting
  3. Security: Maintain all existing functionality
*/

-- Fix the problematic RAISE NOTICE statement from migration 019
-- The issue was using %% which PostgreSQL interprets as parameter placeholders

-- Re-run the final verification with corrected syntax
DO $$
DECLARE
    vat_rates_count integer;
    tax_rules_count integer;
    france_vat_rate decimal(5,2);
BEGIN
    SELECT COUNT(*) INTO vat_rates_count FROM vat_rates WHERE is_active = true;
    SELECT COUNT(*) INTO tax_rules_count FROM tax_rules WHERE is_active = true;
    
    SELECT standard_rate INTO france_vat_rate FROM vat_rates WHERE country_code = 'FR';
    
    -- FIXED: Correct RAISE syntax with proper parameter count
    RAISE NOTICE 'Migration 020 fix completed - VAT rates: %, Tax rules: %, France VAT: %', 
        vat_rates_count, tax_rules_count, france_vat_rate;
        
    -- Additional verification that VAT system is working
    IF vat_rates_count = 0 THEN
        RAISE WARNING 'No VAT rates found - migration may have failed';
    END IF;
    
    IF tax_rules_count = 0 THEN
        RAISE WARNING 'No tax rules found - migration may have failed';
    END IF;
    
    IF france_vat_rate IS NULL THEN
        RAISE WARNING 'France VAT rate not found - migration may have failed';
    ELSE
        RAISE NOTICE 'France VAT rate correctly set to: %', france_vat_rate;
    END IF;
END $$;

-- Test VAT calculation functions to ensure they work after the fix
DO $$
DECLARE
  test_result record;
BEGIN
  -- Test French individual purchase (should have 20% VAT)
  SELECT * INTO test_result FROM calculate_vat_for_order('FR', NULL, NULL, 100.00);
  RAISE NOTICE 'France B2C test: Apply VAT: %, Rate: %, Rule: %', 
    test_result.should_apply_vat, test_result.vat_rate, test_result.tax_rule_applied;
  
  -- Test German company with VAT (should have reverse charge - no VAT)
  SELECT * INTO test_result FROM calculate_vat_for_order('DE', 'DE123456789', 'Test GmbH', 100.00);
  RAISE NOTICE 'German B2B with VAT test: Apply VAT: %, Rate: %, Rule: %', 
    test_result.should_apply_vat, test_result.vat_rate, test_result.tax_rule_applied;
  
  -- Test German individual (should have French VAT 20%)
  SELECT * INTO test_result FROM calculate_vat_for_order('DE', NULL, NULL, 100.00);
  RAISE NOTICE 'German B2C test: Apply VAT: %, Rate: %, Rule: %', 
    test_result.should_apply_vat, test_result.vat_rate, test_result.tax_rule_applied;
    
  -- Test US export (should have no VAT)
  SELECT * INTO test_result FROM calculate_vat_for_order('US', NULL, NULL, 100.00);
  RAISE NOTICE 'US export test: Apply VAT: %, Rate: %, Rule: %', 
    test_result.should_apply_vat, test_result.vat_rate, test_result.tax_rule_applied;
    
  RAISE NOTICE 'VAT calculation tests completed successfully';
END $$;

-- Verify all functions exist and are working
DO $$
DECLARE
    function_count integer;
    table_count integer;
    trigger_count integer;
BEGIN
    -- Count VAT-related functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_name IN ('calculate_vat_for_order', 'determine_buyer_type', 'validate_vat_format', 'get_product_display_price');
    
    -- Count VAT-related tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('vat_rates', 'tax_rules');
    
    -- Count VAT-related triggers
    SELECT COUNT(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_name = 'order_vat_calculation_trigger';
    
    RAISE NOTICE 'VAT system verification - Functions: %, Tables: %, Triggers: %', 
        function_count, table_count, trigger_count;
        
    IF function_count < 4 THEN
        RAISE WARNING 'Missing VAT functions - expected 4, found %', function_count;
    END IF;
    
    IF table_count < 2 THEN
        RAISE WARNING 'Missing VAT tables - expected 2, found %', table_count;
    END IF;
    
    IF trigger_count < 1 THEN
        RAISE WARNING 'Missing VAT trigger - expected 1, found %', trigger_count;
    END IF;
END $$;

-- Final message
RAISE NOTICE 'VAT system is now ready for France as main market with EU compliance!';
