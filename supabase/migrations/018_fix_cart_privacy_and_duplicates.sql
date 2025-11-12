/*
  # Fix Cart Privacy and Duplicate SKU Issues
  1. Purpose: Ensure cart items are user-private and prevent duplicate SKU entries
  2. Schema: Add unique constraint for user_id + product_id + variant_id
  3. Security: Strengthen RLS policies for cart privacy
*/

-- Add unique constraint to prevent duplicate items per user
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'cart_items' 
        AND constraint_name = 'cart_items_user_product_variant_unique'
    ) THEN
        -- First, clean up any existing duplicates before adding constraint
        WITH duplicates AS (
            SELECT 
                user_id, 
                product_id, 
                COALESCE(variant_id, 'NULL_VARIANT') as variant_key,
                array_agg(id ORDER BY created_at DESC) as ids,
                SUM(quantity) as total_quantity
            FROM cart_items 
            GROUP BY user_id, product_id, COALESCE(variant_id, 'NULL_VARIANT')
            HAVING COUNT(*) > 1
        ),
        keep_items AS (
            SELECT 
                (ids)[1] as keep_id,
                total_quantity
            FROM duplicates
        )
        -- Update the first item with total quantity
        UPDATE cart_items 
        SET quantity = ki.total_quantity,
            updated_at = now()
        FROM keep_items ki
        WHERE cart_items.id = ki.keep_id;
        
        -- Delete duplicate items (keep only the first one per group)
        WITH duplicates AS (
            SELECT 
                user_id, 
                product_id, 
                COALESCE(variant_id, 'NULL_VARIANT') as variant_key,
                array_agg(id ORDER BY created_at DESC) as ids
            FROM cart_items 
            GROUP BY user_id, product_id, COALESCE(variant_id, 'NULL_VARIANT')
            HAVING COUNT(*) > 1
        )
        DELETE FROM cart_items 
        WHERE id IN (
            SELECT unnest(ids[2:]) 
            FROM duplicates
        );
        
        -- Add unique constraint
        ALTER TABLE cart_items 
        ADD CONSTRAINT cart_items_user_product_variant_unique 
        UNIQUE (user_id, product_id, variant_id);
        
        RAISE NOTICE 'Added unique constraint to cart_items to prevent duplicates';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on cart_items';
    END IF;
END $$;

-- Strengthen RLS policies for cart privacy
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can modify own cart" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can manage own cart" ON cart_items;

-- Re-enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create comprehensive privacy policies
CREATE POLICY "Users can only view own cart items" ON cart_items
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can only insert into own cart" ON cart_items
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can only update own cart items" ON cart_items
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  ) WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can only delete own cart items" ON cart_items
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Add function to safely add cart item (handles duplicates)
CREATE OR REPLACE FUNCTION add_to_cart(
  p_product_id uuid,
  p_variant_id uuid DEFAULT NULL,
  p_quantity integer DEFAULT 1
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_existing_item record;
  v_result jsonb;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO v_user_id 
  FROM users 
  WHERE auth_id = auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check for existing item
  SELECT id, quantity INTO v_existing_item
  FROM cart_items
  WHERE user_id = v_user_id
    AND product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));
  
  IF FOUND THEN
    -- Update existing item - ADD quantity
    UPDATE cart_items 
    SET quantity = v_existing_item.quantity + p_quantity,
        updated_at = now()
    WHERE id = v_existing_item.id
    RETURNING jsonb_build_object(
      'id', id,
      'product_id', product_id,
      'variant_id', variant_id,
      'quantity', quantity,
      'action', 'updated'
    ) INTO v_result;
    
    RAISE NOTICE 'Updated existing cart item % with % additional quantity', v_existing_item.id, p_quantity;
  ELSE
    -- Create new item
    INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
    VALUES (v_user_id, p_product_id, p_variant_id, p_quantity)
    RETURNING jsonb_build_object(
      'id', id,
      'product_id', product_id,
      'variant_id', variant_id,
      'quantity', quantity,
      'action', 'created'
    ) INTO v_result;
    
    RAISE NOTICE 'Created new cart item for product %', p_product_id;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_variant ON cart_items(user_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_updated_at ON cart_items(updated_at);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Clean up any orphaned cart items (items without valid user references)
DELETE FROM cart_items 
WHERE user_id NOT IN (SELECT id FROM users);

-- Verify cart privacy and duplicate prevention
DO $$
DECLARE
    total_cart_items integer;
    duplicate_items integer;
    policies_count integer;
    orphaned_items integer;
BEGIN
    -- Count total cart items
    SELECT COUNT(*) INTO total_cart_items FROM cart_items;
    
    -- Count potential duplicates (should be 0 after our fix)
    SELECT COUNT(*) INTO duplicate_items 
    FROM (
        SELECT user_id, product_id, variant_id, COUNT(*) as cnt
        FROM cart_items 
        GROUP BY user_id, product_id, variant_id
        HAVING COUNT(*) > 1
    ) AS duplicates;
    
    -- Count policies
    SELECT COUNT(*) INTO policies_count 
    FROM pg_policies 
    WHERE tablename = 'cart_items';
    
    -- Count orphaned items
    SELECT COUNT(*) INTO orphaned_items 
    FROM cart_items 
    WHERE user_id NOT IN (SELECT id FROM users);
    
    RAISE NOTICE 'Migration 018 completed - Cart items: %, Duplicates: %, Policies: %, Orphaned: %', 
        total_cart_items, duplicate_items, policies_count, orphaned_items;
    
    IF duplicate_items > 0 THEN
        RAISE WARNING 'Still have % duplicate cart items that need manual cleanup', duplicate_items;
    END IF;
    
    IF orphaned_items > 0 THEN
        RAISE WARNING 'Found % orphaned cart items', orphaned_items;
    END IF;
END $$;
