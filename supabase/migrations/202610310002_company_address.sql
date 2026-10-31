-- Invoice and tracking emails show the company's registered address (FISH VALLEY S.R.L.).
DO $$
DECLARE f regprocedure;
BEGIN
 FOREACH f IN ARRAY ARRAY['public.send_invoice_upload_notification'::regproc::regprocedure,'public.send_tracking_notification'::regproc::regprocedure] LOOP
  EXECUTE replace(pg_get_functiondef(f),'Sat Leamna de jos, Comuna Bucovat, nr.159 A, Dolj, România','FISH VALLEY S.R.L., Sat Lemna de Jos, Com. Bucovăț, Nr. 159A, 207128, Jud. Dolj, România');
 END LOOP;
END $$;
