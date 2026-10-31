-- New accounts keep any country we deliver to (previously only eight were kept, others became FR).
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $$
DECLARE country_code text;
BEGIN
 country_code:=upper(coalesce(NEW.raw_user_meta_data->>'delivery_country',NEW.raw_user_meta_data->>'country','FR'));
 IF country_code NOT IN ('FR','AT','BE','BG','HR','CZ','DK','EE','FI','DE','GR','HU','IE','IT','LV','LI','LT','LU','NL','NO','PL','PT','RO','SK','SI','ES','SE','CH','GB') THEN country_code:='FR'; END IF;
 INSERT INTO public.users(id,auth_id,email,first_name,last_name,phone,company_name,country,language,role,two_factor_enabled,email_verified)
 VALUES(NEW.id,NEW.id,NEW.email,left(coalesce(NEW.raw_user_meta_data->>'first_name',''),100),left(coalesce(NEW.raw_user_meta_data->>'last_name',''),100),left(coalesce(NEW.raw_user_meta_data->>'phone',''),50),left(coalesce(NEW.raw_user_meta_data->>'company_name',''),200),country_code,'en','user',false,NEW.email_confirmed_at IS NOT NULL)
 ON CONFLICT(auth_id) DO NOTHING;
 RETURN NEW;
END $$;
