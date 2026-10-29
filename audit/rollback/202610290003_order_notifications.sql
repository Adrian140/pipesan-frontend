BEGIN;
CREATE OR REPLACE FUNCTION public.log_order_confirmation_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  email_subject text;
  user_email text;
BEGIN
  SELECT au.email
    INTO user_email
  FROM auth.users au
  JOIN public.users u ON u.auth_id = au.id
  WHERE u.id = NEW.user_id;

  IF user_email IS NULL THEN
    user_email := NEW.customer_email;
  END IF;

  email_subject := 'Order Confirmation - ' || NEW.order_number || ' - PipeSan';

  BEGIN
    INSERT INTO public.email_logs (
      user_id, order_id, email_type, recipient_email, subject, status
    ) VALUES (
      NEW.user_id, NEW.id, 'order_confirmation', user_email, email_subject, 'sent'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to log order confirmation for %: %', NEW.order_number, SQLERRM;
  END;

  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.log_shipping_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  email_subject text;
  user_email text;
BEGIN
  IF OLD.status <> 'shipped' AND NEW.status = 'shipped' THEN
    SELECT au.email
      INTO user_email
    FROM auth.users au
    JOIN public.users u ON u.auth_id = au.id
    WHERE u.id = NEW.user_id;

    IF user_email IS NULL THEN
      user_email := NEW.customer_email;
    END IF;

    email_subject := 'Your Order ' || NEW.order_number ||
                     ' has been shipped - Tracking: ' ||
                     COALESCE(NEW.tracking_number, 'TBD');

    BEGIN
      INSERT INTO public.email_logs (
        user_id, order_id, email_type, recipient_email, subject, status
      ) VALUES (
        NEW.user_id, NEW.id, 'shipping_notification', user_email, email_subject, 'sent'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to log shipping notification for %: %', NEW.order_number, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  user_email text;
  subject text;
  message text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT customer_email INTO user_email FROM public.orders WHERE id = NEW.id;

    -- Alegem subiect și mesaj în funcție de status
    IF NEW.status = 'paid' THEN
      subject := 'Votre commande a été confirmée ✅';
      message := format('Bonjour, votre commande #%s a été confirmée et est en préparation.', NEW.order_number);

    ELSIF NEW.status = 'shipped' THEN
      subject := 'Votre commande a été expédiée 🚚';
      message := format('Bonjour, votre commande #%s a été expédiée par %s. Numéro de suivi : %s. Suivez votre colis ici : %s',
                        NEW.order_number, COALESCE(NEW.carrier_name, 'le transporteur'),
                        COALESCE(NEW.tracking_number, 'non disponible'),
                        COALESCE(NEW.tracking_url, 'non disponible'));

    ELSIF NEW.status = 'delivered' THEN
      subject := 'Votre commande a été livrée 📦';
      message := format('Bonjour, votre commande #%s a été livrée avec succès.', NEW.order_number);

    ELSIF NEW.status = 'completed' THEN
      subject := 'Merci pour votre achat 💙 Votre facture est disponible';
      message := format('Bonjour, votre commande #%s est terminée. Vous pouvez télécharger votre facture depuis votre compte client.', NEW.order_number);

    ELSIF NEW.status = 'canceled' THEN
      subject := 'Votre commande a été annulée ❌';
      message := format('Bonjour, votre commande #%s a été annulée. Raison : %s', NEW.order_number, COALESCE(NEW.admin_comment, 'non spécifiée'));

    ELSE
      RETURN NEW;
    END IF;

    -- Inserăm în istoricul statusurilor
    INSERT INTO public.order_status_history (order_id, old_status, new_status, note)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.admin_comment);

    -- Inserăm email în coada de trimitere
    INSERT INTO public.email_logs (user_id, order_id, email_type, recipient_email, subject, message, status)
    VALUES (NEW.user_id, NEW.id, 'order_status_update', user_email, subject, message, 'queued');

  END IF;
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.send_order_confirmation_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$

CREATE OR REPLACE FUNCTION public.send_shipping_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$

DROP POLICY IF EXISTS pipesan_email_insert_guard ON public.email_logs;
DROP POLICY IF EXISTS pipesan_email_update_guard ON public.email_logs;
DROP POLICY IF EXISTS pipesan_email_delete_guard ON public.email_logs;
ALTER TABLE public.email_logs ALTER COLUMN status SET DEFAULT 'sent';
ALTER TABLE public.email_logs ALTER COLUMN sent_at SET DEFAULT now();
REVOKE ALL ON FUNCTION public.pipesan_claim_emails(integer) FROM service_role;
COMMIT;
-- Keep new audit columns and event index to preserve delivery history.
