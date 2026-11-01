-- First-party analytics that only runs after cookie consent, plus a consent log.
-- Browsers no longer write analytics tables directly: two validated RPCs do it,
-- for anonymous and signed-in visitors alike.
BEGIN;
DROP POLICY IF EXISTS a_events_insert ON public.analytics_events;
DROP POLICY IF EXISTS a_pageviews_insert ON public.analytics_pageviews;
DROP POLICY IF EXISTS a_sessions_insert ON public.analytics_sessions;
DROP POLICY IF EXISTS a_visitors_insert ON public.analytics_visitors;
REVOKE INSERT,UPDATE,DELETE ON public.analytics_events,public.analytics_pageviews,public.analytics_sessions,public.analytics_visitors FROM anon,authenticated;

CREATE INDEX IF NOT EXISTS analytics_pageviews_ts_idx ON public.analytics_pageviews(ts);
CREATE INDEX IF NOT EXISTS analytics_events_ts_name_idx ON public.analytics_events(ts,name);
CREATE INDEX IF NOT EXISTS analytics_sessions_started_idx ON public.analytics_sessions(started_at);

CREATE FUNCTION public.pipesan_track_pageview(p_visitor uuid, p_session uuid, p_path text, p_referrer text, p_source text, p_medium text, p_device text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE uid uuid := auth.uid(); dev text := CASE WHEN p_device IN ('mobile','tablet','desktop') THEN p_device END;
BEGIN
 IF p_visitor IS NULL OR p_session IS NULL OR coalesce(p_path,'')='' THEN RETURN; END IF;
 INSERT INTO public.analytics_visitors(id,first_source,first_medium,last_source,last_medium,device,user_id)
 VALUES(p_visitor,left(p_source,120),left(p_medium,120),left(p_source,120),left(p_medium,120),dev,uid)
 ON CONFLICT(id) DO UPDATE SET last_seen_at=now(),
  last_source=coalesce(left(EXCLUDED.last_source,120),analytics_visitors.last_source),
  last_medium=coalesce(left(EXCLUDED.last_medium,120),analytics_visitors.last_medium),
  device=coalesce(EXCLUDED.device,analytics_visitors.device),
  user_id=coalesce(analytics_visitors.user_id,EXCLUDED.user_id);
 INSERT INTO public.analytics_sessions(id,visitor_id,landing_path,landing_utm_source,landing_utm_medium,device)
 VALUES(p_session,p_visitor,left(p_path,500),left(p_source,120),left(p_medium,120),dev)
 ON CONFLICT(id) DO UPDATE SET ended_at=now() WHERE analytics_sessions.visitor_id=p_visitor;
 -- A session id belongs to one visitor; ignore pageviews that try to reuse someone else's.
 IF NOT EXISTS (SELECT 1 FROM public.analytics_sessions WHERE id=p_session AND visitor_id=p_visitor) THEN RETURN; END IF;
 INSERT INTO public.analytics_pageviews(session_id,visitor_id,path,referrer) VALUES(p_session,p_visitor,left(p_path,500),left(p_referrer,500));
 INSERT INTO public.analytics_events(session_id,visitor_id,user_id,name,props) VALUES(p_session,p_visitor,uid,'page_view',jsonb_build_object('path',left(p_path,500)));
END $$;

CREATE FUNCTION public.pipesan_track_event(p_visitor uuid, p_session uuid, p_name text, p_props jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_visitor IS NULL OR p_session IS NULL OR p_name !~ '^[a-z][a-z0-9_]{1,39}$' OR p_name='page_view' THEN RETURN; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.analytics_sessions WHERE id=p_session AND visitor_id=p_visitor) THEN RETURN; END IF;
 INSERT INTO public.analytics_events(session_id,visitor_id,user_id,name,props)
 VALUES(p_session,p_visitor,auth.uid(),p_name,CASE WHEN jsonb_typeof(p_props)='object' AND length(p_props::text)<=2000 THEN p_props ELSE '{}'::jsonb END);
END $$;

-- Proof of consent (GDPR art. 7(1)): what was chosen, when, under which banner version.
CREATE TABLE public.pipesan_cookie_consents (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 consent_id uuid NOT NULL,
 analytics boolean NOT NULL,
 version text NOT NULL,
 language text,
 user_id uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pipesan_cookie_consents_created_idx ON public.pipesan_cookie_consents(created_at);
ALTER TABLE public.pipesan_cookie_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pipesan_cookie_consents FROM anon,authenticated;
GRANT SELECT ON public.pipesan_cookie_consents TO authenticated;
GRANT ALL ON public.pipesan_cookie_consents TO service_role;
CREATE POLICY pipesan_cookie_consents_admin_read ON public.pipesan_cookie_consents FOR SELECT TO authenticated USING(public.is_admin());

CREATE FUNCTION public.pipesan_record_consent(p_consent uuid, p_analytics boolean, p_version text, p_language text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_consent IS NULL OR p_analytics IS NULL THEN RETURN; END IF;
 INSERT INTO public.pipesan_cookie_consents(consent_id,analytics,version,language,user_id)
 VALUES(p_consent,p_analytics,left(coalesce(p_version,'?'),20),left(p_language,5),auth.uid());
END $$;

REVOKE ALL ON FUNCTION public.pipesan_track_pageview(uuid,uuid,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pipesan_track_event(uuid,uuid,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pipesan_record_consent(uuid,boolean,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pipesan_track_pageview(uuid,uuid,text,text,text,text,text) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pipesan_track_event(uuid,uuid,text,jsonb) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pipesan_record_consent(uuid,boolean,text,text) TO anon,authenticated;
COMMIT;
