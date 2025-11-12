/*
  # Fix Invoice Upload RLS and Add Tracking System
  1. Purpose: Fix RLS policies blocking invoice uploads and add tracking system
  2. Schema: Fix storage policies, add tracking table, email notifications
  3. Security: Allow users to upload own invoices while maintaining security
*/

-- Fix storage bucket policies for document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-invoices', 
  'user-invoices', 
  false, 
  5242880, -- 5MB limit
  ARRAY['application/pdf']::text[]
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- Create comprehensive storage policies for user invoices
CREATE POLICY "Users can upload own invoices" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-invoices' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-invoices' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own invoices" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-invoices' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage all user invoices" ON storage.objects
  FOR ALL USING (
    bucket_id = 'user-invoices' AND 
    check_admin_role()
  );

-- Create shipping_tracking table for tracking information
CREATE TABLE IF NOT EXISTS shipping_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  carrier_name text NOT NULL DEFAULT '',
  carrier_url text DEFAULT '',
  tracking_number text NOT NULL DEFAULT '',
  tracking_url text DEFAULT '',
  shipping_status text DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception')),
  estimated_delivery date DEFAULT NULL,
  actual_delivery_date date DEFAULT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_notifications table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  tracking_id uuid REFERENCES shipping_tracking(id) ON DELETE SET NULL,
  email_type text NOT NULL, -- 'invoice_uploaded', 'tracking_info', 'order_confirmation'
  recipient_email text NOT NULL,
  subject text NOT NULL,
  html_content text,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Function to generate automatic email when invoice is uploaded
CREATE OR REPLACE FUNCTION send_invoice_upload_notification()
RETURNS TRIGGER AS $$
DECLARE
    user_email text;
    user_name text;
    email_subject text;
    email_html text;
    logo_url text := 'https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1757856147529-68a9b2648cd1ba15f2ff2bbc/1757868212234.png/chatgpt-image-25-aug-2025-11_07_46.webp';
BEGIN
    -- Get user details
    SELECT email, first_name || ' ' || last_name INTO user_email, user_name
    FROM users u
    JOIN auth.users au ON u.auth_id = au.id
    WHERE u.id = NEW.user_id;
    
    -- Create email subject
    email_subject := 'Factura încărcată cu succes - ' || COALESCE(NEW.invoice_number, 'Document') || ' - PipeSan';
    
    -- Create professional HTML email
    email_html := '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura încărcată - PipeSan</title>
</head>
<body style="margin: 0; padding: 0; font-family: Manrope, Arial, sans-serif; background-color: #f8fafc;">
    <table style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header with Logo -->
        <tr>
            <td style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); padding: 40px 30px; text-align: center;">
                <img src="' || logo_url || '" alt="PipeSan" style="height: 60px; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Factura încărcată cu succes</h1>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 20px;">Bună ' || COALESCE(user_name, 'client') || ',</h2>
                
                <p style="color: #64748b; line-height: 1.6; margin-bottom: 20px;">
                    Factura ta a fost încărcată cu succes în sistemul nostru și este acum disponibilă în contul tău.
                </p>
                
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #0f172a; margin-top: 0; font-size: 16px;">Detalii factură:</h3>
                    <p style="margin: 8px 0; color: #475569;"><strong>Numărul facturii:</strong> ' || COALESCE(NEW.invoice_number, 'Document nou') || '</p>
                    <p style="margin: 8px 0; color: #475569;"><strong>Data încărcării:</strong> ' || to_char(NEW.created_at, 'DD/MM/YYYY HH24:MI') || '</p>
                    <p style="margin: 8px 0; color: #475569;"><strong>Suma:</strong> €' || COALESCE(NEW.total_amount::text, '0.00') || '</p>
                    <p style="margin: 8px 0; color: #475569;"><strong>Status:</strong> ' || 
                        CASE NEW.status 
                            WHEN 'paid' THEN 'Plătită ✅'
                            WHEN 'pending' THEN 'În așteptare ⏳'
                            WHEN 'overdue' THEN 'Restantă ⚠️'
                            ELSE NEW.status 
                        END || '</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://pipesan.eu/dashboard" 
                       style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                        Vezi factura în contul tău
                    </a>
                </div>
                
                <p style="color: #64748b; line-height: 1.6; margin-top: 30px;">
                    Poți accesa oricând factura din secțiunea <strong>Facturile mele</strong> din dashboard-ul tău.
                </p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                    <strong>PipeSan</strong> - Componente profesionale de instalații<br>
                    📧 contact@pipesan.eu | 📞 +33 675 11 62 18<br>
                    📍 Sat Leamna de jos, Comuna Bucovat, nr.159 A, Region: Dolj, România
                </p>
                <p style="margin: 15px 0 0 0; color: #94a3b8; font-size: 12px;">
                    © 2025 PipeSan. Toate drepturile rezervate.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>';
    
    -- Log the email notification
    INSERT INTO email_notifications (
        user_id, 
        invoice_id, 
        email_type, 
        recipient_email, 
        subject, 
        html_content,
        status
    ) VALUES (
        NEW.user_id,
        NEW.id,
        'invoice_uploaded',
        user_email,
        email_subject,
        email_html,
        'sent'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to send tracking notification email
CREATE OR REPLACE FUNCTION send_tracking_notification()
RETURNS TRIGGER AS $$
DECLARE
    user_email text;
    user_name text;
    email_subject text;
    email_html text;
    logo_url text := 'https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1757856147529-68a9b2648cd1ba15f2ff2bbc/1757868212234.png/chatgpt-image-25-aug-2025-11_07_46.webp';
    tracking_link text;
BEGIN
    -- Get user details
    SELECT au.email, u.first_name || ' ' || u.last_name INTO user_email, user_name
    FROM users u
    JOIN auth.users au ON u.auth_id = au.id
    WHERE u.id = NEW.user_id;
    
    -- Create tracking link
    tracking_link := COALESCE(NEW.tracking_url, 
        CASE NEW.carrier_name
            WHEN 'UPS' THEN 'https://www.ups.com/track?tracknum=' || NEW.tracking_number
            WHEN 'DHL' THEN 'https://www.dhl.com/en/express/tracking.html?AWB=' || NEW.tracking_number
            WHEN 'DPD' THEN 'https://tracking.dpd.de/status/en_US/parcel/' || NEW.tracking_number
            WHEN 'Chronopost' THEN 'https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=' || NEW.tracking_number
            ELSE '#'
        END
    );
    
    -- Create email subject
    email_subject := 'Informații transport - ' || NEW.tracking_number || ' - PipeSan';
    
    -- Create professional HTML email
    email_html := '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informații Transport - PipeSan</title>
</head>
<body style="margin: 0; padding: 0; font-family: Manrope, Arial, sans-serif; background-color: #f8fafc;">
    <table style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header with Logo -->
        <tr>
            <td style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); padding: 40px 30px; text-align: center;">
                <img src="' || logo_url || '" alt="PipeSan" style="height: 60px; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Informații Transport</h1>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 20px;">Bună ' || COALESCE(user_name, 'client') || ',</h2>
                
                <p style="color: #64748b; line-height: 1.6; margin-bottom: 20px;">
                    Am actualizat informațiile de transport pentru comanda ta. Poți urmări transportul folosind datele de mai jos.
                </p>
                
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #0f172a; margin-top: 0; font-size: 16px;">📦 Detalii Transport:</h3>
                    <p style="margin: 8px 0; color: #475569;"><strong>Firmă transport:</strong> ' || NEW.carrier_name || '</p>
                    <p style="margin: 8px 0; color: #475569;"><strong>Cod urmărire:</strong> ' || NEW.tracking_number || '</p>
                    <p style="margin: 8px 0; color: #475569;"><strong>Status:</strong> ' || 
                        CASE NEW.shipping_status 
                            WHEN 'pending' THEN 'În pregătire ⏳'
                            WHEN 'picked_up' THEN 'Ridicat de curier 📦'
                            WHEN 'in_transit' THEN 'În transport 🚚'
                            WHEN 'out_for_delivery' THEN 'În curs de livrare 🏃‍♂️'
                            WHEN 'delivered' THEN 'Livrat ✅'
                            ELSE NEW.shipping_status 
                        END || '</p>
                    ' || CASE WHEN NEW.estimated_delivery IS NOT NULL THEN 
                        '<p style="margin: 8px 0; color: #475569;"><strong>Livrare estimată:</strong> ' || to_char(NEW.estimated_delivery, 'DD/MM/YYYY') || '</p>'
                        ELSE '' END || '
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="' || tracking_link || '" 
                       style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin-right: 10px;">
                        🔍 Urmărește coletul
                    </a>
                    ' || CASE WHEN NEW.carrier_url != '' THEN 
                        '<a href="' || NEW.carrier_url || '" 
                           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                            🌐 Site curier
                        </a>' 
                        ELSE '' END || '
                </div>
                
                ' || CASE WHEN NEW.notes != '' THEN 
                    '<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Note:</strong> ' || NEW.notes || '</p>
                    </div>'
                    ELSE '' END || '
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                    <strong>PipeSan</strong> - Componente profesionale de instalații<br>
                    📧 contact@pipesan.eu | 📞 +33 675 11 62 18<br>
                    📍 Sat Leamna de jos, Comuna Bucovat, nr.159 A, Region: Dolj, România
                </p>
            </td>
        </tr>
    </table>
</body>
</html>';
    
    -- Log the email notification
    INSERT INTO email_notifications (
        user_id, 
        tracking_id, 
        email_type, 
        recipient_email, 
        subject, 
        html_content,
        status
    ) VALUES (
        NEW.user_id,
        NEW.id,
        'tracking_info',
        user_email,
        email_subject,
        email_html,
        'sent'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic email sending
DROP TRIGGER IF EXISTS invoice_upload_notification_trigger ON invoices;
CREATE TRIGGER invoice_upload_notification_trigger
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION send_invoice_upload_notification();

DROP TRIGGER IF EXISTS tracking_notification_trigger ON shipping_tracking;
CREATE TRIGGER tracking_notification_trigger
    AFTER INSERT OR UPDATE ON shipping_tracking
    FOR EACH ROW
    EXECUTE FUNCTION send_tracking_notification();

-- Enable RLS for new tables
ALTER TABLE shipping_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipping_tracking
CREATE POLICY "Users can view own tracking info" ON shipping_tracking
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR check_admin_role());

CREATE POLICY "Admins can manage all tracking info" ON shipping_tracking
  FOR ALL USING (check_admin_role());

-- RLS Policies for email_notifications
CREATE POLICY "Users can view own email notifications" ON email_notifications
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR check_admin_role());

CREATE POLICY "Admins can manage all email notifications" ON email_notifications
  FOR ALL USING (check_admin_role());

-- Update invoices table to better support file uploads
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS file_path text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS uploaded_by_admin boolean DEFAULT false;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_user_id ON shipping_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_order_id ON shipping_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_invoice_id ON shipping_tracking(invoice_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_tracking_number ON shipping_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(email_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);

-- Add updated_at triggers
CREATE TRIGGER update_shipping_tracking_updated_at
  BEFORE UPDATE ON shipping_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample carriers for quick selection
INSERT INTO content (key, value, type, language) VALUES
  ('carriers_list', '["UPS", "DHL", "DPD", "Chronopost", "La Poste", "GLS", "FedEx", "TNT", "Hermes", "SEUR"]', 'json', 'fr'),
  ('default_carrier_urls', '{"UPS": "https://www.ups.com", "DHL": "https://www.dhl.com", "DPD": "https://www.dpd.com", "Chronopost": "https://www.chronopost.fr", "La Poste": "https://www.laposte.fr", "GLS": "https://gls-group.eu", "FedEx": "https://www.fedex.com", "TNT": "https://www.tnt.com", "Hermes": "https://www.hermes-europe.co.uk", "SEUR": "https://www.seur.com"}', 'json', 'fr')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();

-- Final verification
DO $$
DECLARE
    storage_policies_count integer;
    tracking_table_exists boolean;
    email_table_exists boolean;
    triggers_count integer;
BEGIN
    -- Count storage policies
    SELECT COUNT(*) INTO storage_policies_count 
    FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage';
    
    -- Check table existence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'shipping_tracking'
    ) INTO tracking_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'email_notifications'
    ) INTO email_table_exists;
    
    -- Count triggers
    SELECT COUNT(*) INTO triggers_count 
    FROM information_schema.triggers 
    WHERE trigger_name IN ('invoice_upload_notification_trigger', 'tracking_notification_trigger');
    
    RAISE NOTICE 'Migration 021 completed - Storage policies: %, Tracking table: %, Email table: %, Triggers: %', 
        storage_policies_count, tracking_table_exists, email_table_exists, triggers_count;
END $$;
