
CREATE TYPE public.truth_state AS ENUM ('early_signal','corroborated','confirmed','disputed','false','expired');
CREATE TYPE public.evidence_kind AS ENUM ('text_report','image','video','audio','official_statement','media_report','sensor');
CREATE TYPE public.source_kind AS ENUM ('anonymous','eyewitness','official','broadcast','social','unknown');

CREATE TABLE public.pulse_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pulse_users TO anon, authenticated;
GRANT ALL ON public.pulse_users TO service_role;
ALTER TABLE public.pulse_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pulse_users readable" ON public.pulse_users FOR SELECT USING (true);
CREATE POLICY "pulse_users insertable" ON public.pulse_users FOR INSERT WITH CHECK (true);
CREATE POLICY "pulse_users updatable" ON public.pulse_users FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.source_kind NOT NULL DEFAULT 'unknown',
  label text NOT NULL,
  verification_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  history jsonb NOT NULL DEFAULT '{}'::jsonb,
  reliability numeric NOT NULL DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sources TO anon, authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources readable" ON public.sources FOR SELECT USING (true);
CREATE POLICY "sources insertable" ON public.sources FOR INSERT WITH CHECK (true);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location_name text NOT NULL,
  city text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  first_reported_at timestamptz NOT NULL DEFAULT now(),
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  truth_state public.truth_state NOT NULL DEFAULT 'early_signal',
  freshness_score numeric NOT NULL DEFAULT 1,
  share_count integer NOT NULL DEFAULT 0,
  independent_sources integer NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events readable" ON public.events FOR SELECT USING (true);
CREATE POLICY "events insertable" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "events updatable" ON public.events FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.pulse_users(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  content text NOT NULL,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  location_name text,
  latitude double precision,
  longitude double precision,
  extracted_claim text,
  ai_analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'analyzing',
  is_duplicate_of uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO anon, authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports readable" ON public.reports FOR SELECT USING (true);
CREATE POLICY "reports insertable" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports updatable" ON public.reports FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  kind public.evidence_kind NOT NULL DEFAULT 'text_report',
  supports_claim boolean NOT NULL DEFAULT false,
  contradicts_claim boolean NOT NULL DEFAULT false,
  excluded boolean NOT NULL DEFAULT false,
  exclusion_reason text,
  independence_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  analysis text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.evidence TO anon, authenticated;
GRANT ALL ON public.evidence TO service_role;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evidence readable" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "evidence insertable" ON public.evidence FOR INSERT WITH CHECK (true);

CREATE TABLE public.event_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  label text NOT NULL,
  tone text NOT NULL DEFAULT 'neutral',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.event_timeline TO anon, authenticated;
GRANT ALL ON public.event_timeline TO service_role;
ALTER TABLE public.event_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_timeline readable" ON public.event_timeline FOR SELECT USING (true);
CREATE POLICY "event_timeline insertable" ON public.event_timeline FOR INSERT WITH CHECK (true);

CREATE INDEX events_city_idx ON public.events (city);
CREATE INDEX events_updated_idx ON public.events (last_updated_at DESC);
CREATE INDEX evidence_event_idx ON public.evidence (event_id);
CREATE INDEX timeline_event_idx ON public.event_timeline (event_id, occurred_at);
CREATE INDEX reports_event_idx ON public.reports (event_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_timeline;

-- Seed sources
INSERT INTO public.sources (id, kind, label, verification_signals, reliability) VALUES
 ('11111111-1111-1111-1111-111111111101','eyewitness','On-site resident','["geolocated","first-hand","unique wording"]',0.72),
 ('11111111-1111-1111-1111-111111111102','official','State emergency agency','["registered account","verified history"]',0.93),
 ('11111111-1111-1111-1111-111111111103','social','Forwarded messaging chain','["repeated wording","no original author"]',0.21),
 ('11111111-1111-1111-1111-111111111104','broadcast','Local radio desk','["editorial process","named reporter"]',0.81),
 ('11111111-1111-1111-1111-111111111105','anonymous','Unidentified submitter','["no corroboration"]',0.35);

-- Seed events
INSERT INTO public.events (id,title,description,location_name,city,latitude,longitude,first_reported_at,last_updated_at,truth_state,freshness_score,share_count,independent_sources,category) VALUES
 ('22222222-2222-2222-2222-222222222201','Explosion reported near Central Market','Loud blast reported close to Central Market. Independent eyewitnesses and a credible local source support the account. One contradictory report is on file and displayed.','Central Market, Wuse','Abuja',9.0643,7.4892, now() - interval '46 minutes', now() - interval '3 minutes','confirmed',0.86,147,4,'incident'),
 ('22222222-2222-2222-2222-222222222202','Carriageway blocked on Ahmadu Bello Way','Several reports describe a blocked carriageway with traffic backing up toward Garki. Two independent accounts match on location and time.','Ahmadu Bello Way','Abuja',9.0563,7.4708, now() - interval '68 minutes', now() - interval '12 minutes','corroborated',0.72,38,2,'traffic'),
 ('22222222-2222-2222-2222-222222222203','Power outage reported around Garki','A single report describes a blackout across part of Garki. Insufficient independent evidence to corroborate.','Garki District','Abuja',9.0333,7.4833, now() - interval '9 minutes', now() - interval '8 minutes','early_signal',0.95,4,1,'utility'),
 ('22222222-2222-2222-2222-222222222204','Conflicting reports of road closure at Wuse 2','Credible reports conflict on whether the route is fully closed. Both accounts are shown rather than resolved.','Wuse 2','Abuja',9.0765,7.4661, now() - interval '95 minutes', now() - interval '31 minutes','disputed',0.55,62,3,'traffic'),
 ('22222222-2222-2222-2222-222222222205','Water pressure drop in Maitama','Reported drop in mains pressure. No new supporting evidence for over two hours.','Maitama','Abuja',9.0857,7.4951, now() - interval '5 hours', now() - interval '3 hours','expired',0.12,11,3,'utility'),
 ('22222222-2222-2222-2222-222222222206','Claim of school closure order circulating','A widely forwarded message claims an immediate closure order. The education ministry statement on file contradicts the claim.','Central Area','Abuja',9.0579,7.4951, now() - interval '2 hours', now() - interval '40 minutes','false',0.4,890,1,'rumour'),
 ('22222222-2222-2222-2222-222222222207','Heavy security presence near Kaduna Central','Multiple independent reports describe an increased security presence. No official statement yet.','Kaduna Central','Kaduna',10.5222,7.4383, now() - interval '52 minutes', now() - interval '7 minutes','corroborated',0.78,54,3,'security'),
 ('22222222-2222-2222-2222-222222222208','Reports of fuel queues on Ali Akilu Road','Early reports of long queues at two stations. Only one independent source so far.','Ali Akilu Road','Kaduna',10.5105,7.4165, now() - interval '18 minutes', now() - interval '15 minutes','early_signal',0.9,9,1,'utility'),
 ('22222222-2222-2222-2222-222222222209','Market fire contained at Kurmi Market','Fire reported and subsequently contained. Confirmed by the state fire service.','Kurmi Market','Kano',11.9925,8.5167, now() - interval '3 hours', now() - interval '80 minutes','confirmed',0.44,210,5,'incident'),
 ('22222222-2222-2222-2222-22222222220a','Claimed curfew announcement in Kano','A forwarded voice note claims a curfew. No official source supports it; wording is identical across submissions.','Kano Municipal','Kano',12.0022,8.5919, now() - interval '70 minutes', now() - interval '22 minutes','disputed',0.6,433,1,'rumour'),
 ('22222222-2222-2222-2222-22222222220b','Flooding on Lekki-Epe Expressway','Standing water reported across several lanes. Three independent reports and one geolocated image.','Lekki-Epe Expressway','Lagos',6.4478,3.5352, now() - interval '35 minutes', now() - interval '5 minutes','corroborated',0.83,96,3,'weather'),
 ('22222222-2222-2222-2222-22222222220c','Power restoration reported in Yaba','Restoration reported after an earlier outage. Confirmed by the distribution company.','Yaba','Lagos',6.5095,3.3711, now() - interval '110 minutes', now() - interval '55 minutes','confirmed',0.51,22,4,'utility'),
 ('22222222-2222-2222-2222-22222222220d','Unverified claim of bridge closure in Apapa','A single unattributed message claims a bridge closure. No independent confirmation.','Apapa','Lagos',6.4478,3.3592, now() - interval '25 minutes', now() - interval '19 minutes','early_signal',0.88,318,1,'rumour');

-- Seed timeline for the Central Market event
INSERT INTO public.event_timeline (event_id, occurred_at, label, tone) VALUES
 ('22222222-2222-2222-2222-222222222201', now() - interval '46 minutes','First report received.','signal'),
 ('22222222-2222-2222-2222-222222222201', now() - interval '43 minutes','Five additional reports detected in the same area.','signal'),
 ('22222222-2222-2222-2222-222222222201', now() - interval '41 minutes','Four reports identified as copies of the same message. Counted as one source.','negative'),
 ('22222222-2222-2222-2222-222222222201', now() - interval '38 minutes','Submitted video matched to earlier published footage. Excluded from supporting evidence.','negative'),
 ('22222222-2222-2222-2222-222222222201', now() - interval '35 minutes','Two independent eyewitness reports received from within 2.5 km.','positive'),
 ('22222222-2222-2222-2222-222222222201', now() - interval '33 minutes','Credible local source confirms the incident.','positive'),
 ('22222222-2222-2222-2222-222222222201', now() - interval '3 minutes','Contradictory report received on the scale of damage. Displayed, not hidden.','contradiction');

INSERT INTO public.event_timeline (event_id, occurred_at, label, tone) VALUES
 ('22222222-2222-2222-2222-222222222202', now() - interval '68 minutes','First report of stopped traffic.','signal'),
 ('22222222-2222-2222-2222-222222222202', now() - interval '55 minutes','Second independent report matches the location.','positive'),
 ('22222222-2222-2222-2222-222222222202', now() - interval '12 minutes','Image received showing a blocked lane at the reported point.','positive'),
 ('22222222-2222-2222-2222-222222222206', now() - interval '2 hours','Forwarded message received claiming an immediate closure order.','signal'),
 ('22222222-2222-2222-2222-222222222206', now() - interval '100 minutes','Identical wording found across 40 submissions. Counted as one source.','negative'),
 ('22222222-2222-2222-2222-222222222206', now() - interval '40 minutes','Ministry statement on file contradicts the claim.','contradiction');

-- Seed evidence for the Central Market event
INSERT INTO public.evidence (event_id, source_id, kind, supports_claim, contradicts_claim, excluded, exclusion_reason, independence_signals, analysis) VALUES
 ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','text_report',true,false,false,null,'["unique wording","geolocated within 2.5 km"]','First-hand account with location detail that matches the reported site.'),
 ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','text_report',true,false,false,null,'["unique wording","independent submitter"]','Second eyewitness account describing the same time window.'),
 ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111102','official_statement',true,false,false,null,'["verified source history"]','Credible local source confirms an incident occurred at the market.'),
 ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111103','text_report',false,false,true,'Five submissions share identical wording and no original author. Counted as one source.','["repeated wording","no original author"]','High circulation, low corroboration. Treated as a single source.'),
 ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111105','video',false,false,true,'Footage matches material published before the reported time.','["reused imagery"]','AI visual review found reused imagery and inconsistent resolution. Not a forensic determination.'),
 ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111104','media_report',false,true,false,null,'["named reporter"]','Broadcast desk disputes the reported scale of damage.'),
 ('22222222-2222-2222-2222-222222222206','11111111-1111-1111-1111-111111111103','text_report',false,false,true,'40 identical forwards traced to one origin.','["repeated wording"]','Virality without independent corroboration.'),
 ('22222222-2222-2222-2222-222222222206','11111111-1111-1111-1111-111111111102','official_statement',false,true,false,null,'["verified source history"]','Official statement directly contradicts the circulating claim.');
