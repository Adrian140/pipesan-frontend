/*
  # Create Orders System with Email Automation and Tracking
  1. Purpose: Complete order system with automatic email generation and tracking ID
  2. Schema: orders, order_items, email_logs, tracking_notifications
  3. Security: RLS policies for user access and admin management
*/

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  email_type text NOT NULL, -- 'order_confirmation', 'shipping_notification', 'invoice'
  recipient_email text NOT NULL,
  subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tracking_notifications table
CREATE TABLE IF NOT EXISTS tracking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number text NOT NULL,
  carrier text DEFAULT 'UPS',
  shipping_status text DEFAULT 'pending', -- 'pending', 'picked_up', 'in_transit', 'delivered'
  estimated_delivery date DEFAULT NULL,
  last_update timestamptz DEFAULT now(),
  tracking_url text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add tracking_number to orders if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number text DEFAULT NULL;

-- Add function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
    new_number text;
    counter integer;
BEGIN
    -- Get current year and month
    new_number := 'ORD-' || to_char(now(), 'YYYYMM') || '-';
    
    -- Get counter for this month
    SELECT COUNT(*) + 1 INTO counter 
    FROM orders 
    WHERE created_at >= date_trunc('month', now());
    
    -- Format with leading zeros
    new_number := new_number || LPAD(counter::text, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Add function to generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS text AS $$
DECLARE
    tracking_id text;
BEGIN
    -- Generate unique tracking number: TRACK-YYYYMMDD-XXXXXX
    tracking_id := 'TRACK-' || to_char(now(), 'YYYYMMDD') || '-' || 
                   LPAD(floor(random() * 999999 + 1)::text, 6, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM orders WHERE tracking_number = tracking_id) LOOP
        tracking_id := 'TRACK-' || to_char(now(), 'YYYYMMDD') || '-' || 
                       LPAD(floor(random() * 999999 + 1)::text, 6, '0');
    END LOOP;
    
    RETURN tracking_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically send order confirmation email
CREATE OR REPLACE FUNCTION send_order_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
    email_subject text;
    tracking_id text;
BEGIN
    -- Generate tracking number if not exists
    IF NEW.tracking_number IS NULL THEN
        NEW.tracking_number := generate_tracking_number();
    END IF;
    
    -- Create email subject
    email_subject := 'Order Confirmation - ' || NEW.order_number || ' - PipeSan';
    
    -- Log email (in real implementation, this would trigger actual email sending)
    INSERT INTO email_logs (
        user_id, 
        order_id, 
        email_type, 
        recipient_email, 
        subject, 
        status
    ) VALUES (
        NEW.user_id,
        NEW.id,
        'order_confirmation',
        NEW.customer_email,
        email_subject,
        'sent'
    );
    
    -- Create tracking notification
    INSERT INTO tracking_notifications (
        order_id,
        tracking_number,
        carrier,
        shipping_status,
        estimated_delivery,
        tracking_url
    ) VALUES (
        NEW.id,
        NEW.tracking_number,
        'UPS Express',
        'pending',
        (now() + interval '3 days')::date,
        'https://www.ups.com/track?tracknum=' || NEW.tracking_number
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to send shipping notification when order status changes to 'shipped'
CREATE OR REPLACE FUNCTION send_shipping_notification()
RETURNS TRIGGER AS $$
DECLARE
    email_subject text;
    tracking_info record;
BEGIN
    -- Only send notification when status changes to 'shipped'
    IF OLD.status != 'shipped' AND NEW.status = 'shipped' THEN
        -- Get tracking information
        SELECT * INTO tracking_info 
        FROM tracking_notifications 
        WHERE order_id = NEW.id 
        LIMIT 1;
        
        -- Create email subject
        email_subject := 'Your Order ' || NEW.order_number || ' has been shipped - Tracking: ' || 
                         COALESCE(NEW.tracking_number, 'TBD');
        
        -- Log shipping notification email
        INSERT INTO email_logs (
            user_id, 
            order_id, 
            email_type, 
            recipient_email, 
            subject, 
            status
        ) VALUES (
            NEW.user_id,
            NEW.id,
            'shipping_notification',
            NEW.customer_email,
            email_subject,
            'sent'
        );
        
        -- Update tracking status
        UPDATE tracking_notifications 
        SET shipping_status = 'picked_up',
            last_update = now()
        WHERE order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS order_confirmation_trigger ON orders;
CREATE TRIGGER order_confirmation_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION send_order_confirmation_email();

DROP TRIGGER IF EXISTS shipping_notification_trigger ON orders;
CREATE TRIGGER shipping_notification_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION send_shipping_notification();

-- Enable RLS for new tables
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_logs
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR check_admin_role());

CREATE POLICY "Admins can manage email logs" ON email_logs
  FOR ALL USING (check_admin_role());

-- RLS Policies for tracking_notifications
CREATE POLICY "Users can view own tracking info" ON tracking_notifications
  FOR SELECT USING (order_id IN (
    SELECT id FROM orders 
    WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  ) OR check_admin_role());

CREATE POLICY "Admins can manage tracking notifications" ON tracking_notifications
  FOR ALL USING (check_admin_role());

-- Function to get complete order details with tracking and emails
CREATE OR REPLACE FUNCTION get_order_details(order_uuid uuid)
RETURNS TABLE (
  order_info jsonb,
  tracking_info jsonb,
  email_history jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(o.*) as order_info,
    (
      SELECT to_jsonb(tn.*) 
      FROM tracking_notifications tn 
      WHERE tn.order_id = order_uuid 
      LIMIT 1
    ) as tracking_info,
    (
      SELECT jsonb_agg(to_jsonb(el.*) ORDER BY el.sent_at DESC)
      FROM email_logs el 
      WHERE el.order_id = order_uuid
    ) as email_history
  FROM orders o
  WHERE o.id = order_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_notifications_order_id ON tracking_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_notifications_tracking_number ON tracking_notifications(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);

-- Add updated_at trigger for tracking_notifications
CREATE TRIGGER update_tracking_notifications_updated_at
  BEFORE UPDATE ON tracking_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed some sample orders to test the system (optional for demo)
DO $$
DECLARE
    sample_user_id uuid;
    sample_order_id uuid;
BEGIN
    -- Find a user to create sample order
    SELECT id INTO sample_user_id FROM users WHERE role = 'user' LIMIT 1;
    
    -- If no regular user exists, use admin
    IF sample_user_id IS NULL THEN
        SELECT id INTO sample_user_id FROM users WHERE role = 'admin' LIMIT 1;
    END IF;
    
    -- Create sample order if we have a user
    IF sample_user_id IS NOT NULL THEN
        INSERT INTO orders (
            id,
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
            shipping_method
        ) VALUES (
            gen_random_uuid(),
            sample_user_id,
            generate_order_number(),
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
            'UPS Express'
        ) RETURNING id INTO sample_order_id;
        
        -- Add sample order item
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price,
            sku,
            name
        ) SELECT 
            sample_order_id,
            p.id,
            2,
            p.price,
            p.sku,
            p.name
        FROM products p 
        WHERE p.is_active = true 
        LIMIT 1;
        
        RAISE NOTICE 'Created sample order with ID: %', sample_order_id;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create sample order: %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
    orders_count integer;
    email_logs_count integer;
    tracking_count integer;
BEGIN
    SELECT COUNT(*) INTO orders_count FROM orders;
    SELECT COUNT(*) INTO email_logs_count FROM email_logs;
    SELECT COUNT(*) INTO tracking_count FROM tracking_notifications;
    
    RAISE NOTICE 'Migration 016 completed - Orders: %, Email logs: %, Tracking records: %', 
        orders_count, email_logs_count, tracking_count;
END $$;
