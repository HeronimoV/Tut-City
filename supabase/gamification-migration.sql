ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_solve_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]';

CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  requirement TEXT,
  xp_reward INT DEFAULT 0
);

CREATE POLICY "allow_all_badge_definitions" ON public.badge_definitions FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

INSERT INTO public.badge_definitions (id, name, description, emoji, xp_reward) VALUES
  ('first_solve', 'First Steps', 'Solved your first problem', '🎯', 50),
  ('streak_3', 'On Fire', '3-day solve streak', '🔥', 100),
  ('streak_7', 'Unstoppable', '7-day solve streak', '⚡', 250),
  ('streak_30', 'Math Machine', '30-day solve streak', '🏆', 1000),
  ('perfect_score', 'Perfect Score', '100% understanding score', '🌟', 150),
  ('ten_solves', 'Getting Started', 'Solved 10 problems', '📚', 100),
  ('fifty_solves', 'Math Warrior', 'Solved 50 problems', '🗡️', 500),
  ('hundred_solves', 'Math Legend', 'Solved 100 problems', '👑', 1000),
  ('multi_subject', 'Well Rounded', 'Solved problems in 3+ subjects', '🎨', 200),
  ('high_scorer', 'Brain Power', 'Average score above 90%', '🧠', 300)
ON CONFLICT (id) DO NOTHING;
