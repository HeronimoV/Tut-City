-- Fresh install - run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  has_subscription BOOLEAN DEFAULT FALSE,
  has_promo_access BOOLEAN DEFAULT FALSE,
  promo_code_used TEXT,
  stripe_customer_id TEXT,
  free_solves_used INT DEFAULT 0,
  free_solve_limit INT DEFAULT 3
);

CREATE TABLE IF NOT EXISTS public.solves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  problem_description TEXT,
  answer TEXT,
  concept TEXT,
  steps JSONB,
  understanding_score INT,
  comprehension_results JSONB,
  time_spent_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.concept_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  concept TEXT NOT NULL,
  attempts INT DEFAULT 0,
  correct_first_try INT DEFAULT 0,
  total_score INT DEFAULT 0,
  last_attempted TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject, concept)
);

CREATE TABLE IF NOT EXISTS public.user_weaknesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  concept TEXT NOT NULL,
  weakness_score FLOAT,
  recommendation TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject, concept)
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('unlimited', 'limited', 'single-use', 'expiring')),
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  uses INT DEFAULT 0,
  max_uses INT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.promo_codes (code, type, description) VALUES ('LARIZZA', 'unlimited', 'Family VIP - Larizza') ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weaknesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_solves" ON public.solves FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_concept_scores" ON public.concept_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_weaknesses" ON public.user_weaknesses FOR ALL USING (true) WITH CHECK (true);
