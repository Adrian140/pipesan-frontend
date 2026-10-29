-- Invoices are issued by administrators or trusted server code, never by their recipients.
-- Restrictive policies close legacy permissive rules without widening existing access.
BEGIN;
CREATE POLICY pipesan_invoice_insert_guard ON public.invoices AS RESTRICTIVE
FOR INSERT TO anon, authenticated WITH CHECK (public.check_admin_role());
CREATE POLICY pipesan_invoice_update_guard ON public.invoices AS RESTRICTIVE
FOR UPDATE TO anon, authenticated USING (public.check_admin_role()) WITH CHECK (public.check_admin_role());
CREATE POLICY pipesan_invoice_delete_guard ON public.invoices AS RESTRICTIVE
FOR DELETE TO anon, authenticated USING (public.check_admin_role());
CREATE POLICY pipesan_invoice_file_read_guard ON storage.objects AS RESTRICTIVE
FOR SELECT TO anon, authenticated USING (
 bucket_id <> 'user-invoices' OR public.check_admin_role() OR EXISTS (
  SELECT 1 FROM public.invoices i JOIN public.users u ON u.id=i.user_id
  WHERE u.auth_id=auth.uid() AND i.file_path=storage.objects.name
 )
);
CREATE POLICY pipesan_invoice_file_insert_guard ON storage.objects AS RESTRICTIVE
FOR INSERT TO anon, authenticated WITH CHECK (bucket_id <> 'user-invoices' OR public.check_admin_role());
CREATE POLICY pipesan_invoice_file_update_guard ON storage.objects AS RESTRICTIVE
FOR UPDATE TO anon, authenticated USING (bucket_id <> 'user-invoices' OR public.check_admin_role())
WITH CHECK (bucket_id <> 'user-invoices' OR public.check_admin_role());
CREATE POLICY pipesan_invoice_file_delete_guard ON storage.objects AS RESTRICTIVE
FOR DELETE TO anon, authenticated USING (bucket_id <> 'user-invoices' OR public.check_admin_role());

SELECT set_config('request.jwt.claim.sub',(select auth_id::text from public.users where role='user' and auth_id is not null limit 1),true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Missing ordinary user'; END IF;
 IF EXISTS (SELECT 1 FROM storage.objects o WHERE bucket_id='user-invoices' AND NOT EXISTS (SELECT 1 FROM public.invoices i JOIN public.users u ON i.user_id=u.id WHERE u.auth_id=auth.uid() AND i.file_path=o.name)) THEN RAISE EXCEPTION 'Invoice file isolation failed'; END IF;
END $$;
RESET ROLE;
SELECT 'Invoice policies compile; unrelated invoice files hidden: PASS (rolled back)' as validation;
ROLLBACK;
