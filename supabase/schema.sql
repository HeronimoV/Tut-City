-- Users table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
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

-- Solve history
CREATE TABLE public.solves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
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

-- Per-concept tracking
CREATE TABLE public.concept_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  concept TEXT NOT NULL,
  attempts INT DEFAULT 0,
  correct_first_try INT DEFAULT 0,
  total_score INT DEFAULT 0,
  last_attempted TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject, concept)
);

-- Weaknesses (auto-calculated)
CREATE TABLE public.user_weaknesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  concept TEXT NOT NULL,
  weakness_score FLOAT,
  recommendation TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject, concept)
);

-- Promo codes (migrated from JSON)
CREATE TABLE public.promo_codes (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('unlimited', 'limited', 'single-use', 'expiring')),
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  uses INT DEFAULT 0,
  max_uses INT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default promo
INSERT INTO public.promo_codes (code, type, description) VALUES ('LARIZZA', 'unlimited', 'Family VIP - Larizza');

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weaknesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own solves" ON public.solves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own solves" ON public.solves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own concept scores" ON public.concept_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own weaknesses" ON public.user_weaknesses FOR SELECT USING (auth.uid() = user_id);
