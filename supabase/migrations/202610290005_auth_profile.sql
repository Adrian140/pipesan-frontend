BEGIN;
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE country_code text;
BEGIN
 country_code:=upper(coalesce(NEW.raw_user_meta_data->>'delivery_country',NEW.raw_user_meta_data->>'country','FR'));
 IF country_code NOT IN ('FR','DE','IT','ES','NL','BE','PL','RO') THEN country_code:='FR'; END IF;
 INSERT INTO public.users(id,auth_id,email,first_name,last_name,phone,company_name,country,language,role,two_factor_enabled,email_verified)
 VALUES(NEW.id,NEW.id,NEW.email,left(coalesce(NEW.raw_user_meta_data->>'first_name',''),100),left(coalesce(NEW.raw_user_meta_data->>'last_name',''),100),left(coalesce(NEW.raw_user_meta_data->>'phone',''),50),left(coalesce(NEW.raw_user_meta_data->>'company_name',''),200),country_code,'en','user',false,NEW.email_confirmed_at IS NOT NULL)
 ON CONFLICT(auth_id) DO NOTHING;
 RETURN NEW;
END $$;
CREATE FUNCTION public.pipesan_sync_auth_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 UPDATE public.users SET email=NEW.email,email_verified=NEW.email_confirmed_at IS NOT NULL WHERE auth_id=NEW.id;
 RETURN NEW;
END $$;
CREATE TRIGGER pipesan_sync_auth_identity AFTER UPDATE OF email,email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.pipesan_sync_auth_identity();
ALTER POLICY pipesan_profile_insert_guard ON public.users WITH CHECK (
 (auth.uid()=auth_id AND role='user' AND two_factor_enabled IS NOT TRUE AND two_factor_secret IS NULL AND email_verified IS NOT TRUE)
 OR public.check_admin_role()
);
COMMIT;
