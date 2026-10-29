BEGIN;
DROP POLICY IF EXISTS pipesan_profile_read_guard ON public.users;
DROP POLICY IF EXISTS pipesan_profile_insert_guard ON public.users;
DROP TRIGGER IF EXISTS pipesan_protect_profile_identity ON public.users;
DROP FUNCTION IF EXISTS public.pipesan_protect_profile_identity();
DROP POLICY IF EXISTS pipesan_public_product_guard ON public.products;
DROP POLICY IF EXISTS pipesan_public_category_guard ON public.categories;
COMMIT;
