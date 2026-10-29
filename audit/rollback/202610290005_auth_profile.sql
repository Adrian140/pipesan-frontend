BEGIN;
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into public.users (id, auth_id, first_name, last_name, country, language, role, two_factor_enabled, email_verified)
  values (new.id, new.id, '','', 'RO', 'ro', 'user', false, coalesce(new.email_confirmed_at is not null, false))
  on conflict (auth_id) do nothing;
  return new;
end;
$function$

DROP TRIGGER IF EXISTS pipesan_sync_auth_identity ON auth.users;
DROP FUNCTION IF EXISTS public.pipesan_sync_auth_identity();
COMMIT;
