BEGIN;
DROP POLICY IF EXISTS pipesan_invoice_insert_guard ON public.invoices;
DROP POLICY IF EXISTS pipesan_invoice_update_guard ON public.invoices;
DROP POLICY IF EXISTS pipesan_invoice_delete_guard ON public.invoices;
DROP POLICY IF EXISTS pipesan_invoice_file_read_guard ON storage.objects;
DROP POLICY IF EXISTS pipesan_invoice_file_insert_guard ON storage.objects;
DROP POLICY IF EXISTS pipesan_invoice_file_update_guard ON storage.objects;
DROP POLICY IF EXISTS pipesan_invoice_file_delete_guard ON storage.objects;
COMMIT;
