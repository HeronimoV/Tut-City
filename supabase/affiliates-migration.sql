CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id),
  code TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  commission_rate FLOAT DEFAULT 0.15,
  total_referrals INT DEFAULT 0,
  total_earnings FLOAT DEFAULT 0,
  pending_earnings FLOAT DEFAULT 0,
  paid_earnings FLOAT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id),
  referred_user_id TEXT REFERENCES public.profiles(id),
  status TEXT DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'subscribed', 'churned')),
  commission_amount FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "allow_all_affiliates" ON public.affiliates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_referrals" ON public.referrals FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Add referral tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;
