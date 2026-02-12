# Tut City 🏙️📐

**Your geometry BFF** — Upload a photo of any geometry problem and get step-by-step solutions with clear explanations.

## Features

- 📸 **Photo upload / camera capture** — snap a pic or drag & drop
- 🧠 **Step-by-step solver** — powered by Claude AI vision, reveals steps one at a time
- 💬 **Follow-up chat** — ask questions about any step you don't understand
- 💳 **Stripe subscriptions** — $34.99/month paywall
- 🎟️ **Promo codes** — grant free access (e.g., `LARIZZA` for unlimited)
- 🔐 **Auth** — Google sign-in or email/password via NextAuth.js

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS (mobile-first)
- Anthropic Claude API (vision)
- Supabase (database, user profiles, progress tracking)
- Stripe (subscriptions)
- NextAuth.js (authentication)

## Setup

### 1. Install dependencies

```bash
cd tut-city
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your keys:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXTAUTH_URL` | Your app URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe Price ID for the $34.99/mo subscription |

### 3. Set up Stripe

1. Create a product in [Stripe Dashboard](https://dashboard.stripe.com/products) — "$34.99/month Tut City subscription"
2. Copy the Price ID to `STRIPE_PRICE_ID`
3. Set up a webhook endpoint pointing to `https://yourdomain.com/api/webhook` for events: `checkout.session.completed`, `customer.subscription.deleted`

### 4. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your project URL, anon key, and service role key to `.env.local`

### 5. Set up Google OAuth (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pre-loaded Promo Codes

| Code | Access |
|---|---|
| `LARIZZA` | Unlimited free access |
| `GEOMETRY_ROCKS` | Free access (100 uses) |
| `FREEMONTH` | Free access (50 uses) |

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Add all environment variables in Vercel project settings
4. Update `NEXTAUTH_URL` to your production URL
5. Update Stripe webhook URL to production
6. Update Google OAuth redirect URI to production

```bash
vercel --prod
```

## Admin Panel

Tut City includes a built-in admin panel for managing promo codes.

### Setup

1. Set `ADMIN_SECRET` in your `.env.local`:
   ```
   ADMIN_SECRET=some-strong-secret
   ```

2. Visit `/admin` in your browser

3. Enter your admin secret to log in

### Features

- **View all promo codes** with usage stats
- **Create new codes** — unlimited, limited (max uses), single-use, or expiring
- **Activate/deactivate codes** with one click
- **Stats dashboard** — total promos, active promos, total redemptions
- **Pricing management** — link to Stripe Dashboard for subscription price changes

### API Endpoints

All admin API routes require `Authorization: Bearer <ADMIN_SECRET>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/promos` | List all promo codes |
| POST | `/api/admin/promos` | Create new promo code |
| PATCH | `/api/admin/promos` | Update a promo code |
| DELETE | `/api/admin/promos` | Deactivate a promo code |
| GET | `/api/admin/stats` | Basic stats |

### Promo Code Storage

Promo codes are stored in Supabase (`promo_codes` table). The default `LARIZZA` code is created by the schema migration.

## Project Structure

```
tut-city/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing page (sign in)
│   ├── providers.tsx       # NextAuth session provider
│   ├── globals.css         # Tailwind + custom styles
│   ├── dashboard/page.tsx  # Main dashboard (after login)
│   ├── solve/page.tsx      # Photo upload + step walkthrough
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── solve/route.ts    # Claude vision solver
│       ├── chat/route.ts     # Follow-up chat
│       ├── promo/route.ts    # Promo code validation
│       ├── subscribe/route.ts # Stripe checkout
│       └── webhook/route.ts  # Stripe webhook
├── components/
│   ├── CameraCapture.tsx     # Photo/camera input
│   ├── StepWalkthrough.tsx   # Step-by-step reveal UI
│   ├── ChatFollowUp.tsx      # Chat interface
│   ├── PaywallGate.tsx       # Subscription prompt
│   └── PromoCodeInput.tsx    # Promo code form
├── lib/
│   ├── anthropic.ts          # Claude API client
│   ├── stripe.ts             # Stripe client
│   ├── auth.ts               # NextAuth config
│   ├── supabase.ts           # Supabase client setup
│   ├── db.ts                 # Database helpers (profiles, solves, progress)
│   └── promo.ts              # Legacy promo code logic (now in Supabase)
├── supabase/
│   └── schema.sql            # Database schema + RLS policies
└── middleware.ts              # Auth middleware
```

## License

MIT
