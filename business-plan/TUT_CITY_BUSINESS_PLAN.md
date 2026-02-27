# Tut City — Business Plan & Investment Pitch
### *AI-Powered Math Tutoring for Every Student*
### February 2026

---

## 🏙️ What Is Tut City?

Tut City (tutcity.org) is an AI-powered math tutoring web app for students in grades 1-12. Students snap a photo of any math problem and get an interactive, step-by-step walkthrough — not just answers, but real teaching.

**What makes us different from Photomath, Mathway, etc.:**
- **Anti-skip system** — Students can't rush to answers. Timed reveals force them to actually read each step.
- **Comprehension checks** — Multiple choice questions every 2-3 steps test understanding.
- **Understanding score** — Students (and parents) see how well they actually grasped the material.
- **Visual learning** — Proper math rendering (KaTeX), color-coded step changes, AI-generated diagrams.
- **9 math subjects** — Arithmetic through Calculus & Statistics, auto-detected from the photo.
- **Multiple teaching methods** — Common Core and Singapore Math support.

**We're not a calculator. We're a tutor.**

---

## 👤 Who's It For?

**Primary:** Students grades 6-12 who struggle with math homework
**Secondary:** Parents who can't afford $40-80/hr human tutors
**Tertiary:** Homeschool families, tutoring centers, after-school programs

**The problem we solve:**
- Private tutoring costs $40-80/hour
- Parents can't always help with math past 6th grade
- Existing apps (Photomath) give answers but DON'T teach
- Kids need to understand the *why*, not just the *what*

---

## 💰 Revenue Model

### Current Pricing
- **Subscription:** $39.99/month (increased from $34.99)
- **Trial:** 3 free solves before paywall
- **Promo codes:** VIP access for early adopters & affiliates

### Future Pricing (Phase 2)
| Tier | Price | Features |
|------|-------|----------|
| Basic | $29.99/mo | 20 solves/month |
| Pro | $49.99/mo | Unlimited solves + progress tracking |
| Family | $79.99/mo | Up to 4 kids + parent dashboard |

### Additional Revenue Streams (Phase 2-3)
- **Affiliate program** — 15% recurring commission for referrers
- **School/district licenses** — Bulk pricing for institutions ($10-15/student/mo)
- **Tutoring center partnerships** — White-label or bulk access

---

## 📊 Monthly Operating Costs

| Expense | Monthly Cost | Notes |
|---------|-------------|-------|
| Anthropic Claude API | $15-50 | ~$0.01-0.03 per solve (detection + solving) |
| Vercel Pro hosting | $20 | Current plan |
| Supabase (database) | $0 (free tier) | Upgrades to $25/mo at scale |
| Domain (tutcity.org) | ~$1.50 | $18/year |
| OpenClaw/Kip (AI builder) | $20-30 | Development & maintenance |
| Stripe fees | 2.9% + $0.30/txn | Per subscription payment |
| **Total (current)** | **~$60-100/mo** | **Before any revenue** |

### Cost Scaling
| Users | API Cost | Hosting | DB | Total Monthly |
|-------|----------|---------|-----|---------------|
| 10 | $5 | $20 | $0 | ~$85 |
| 50 | $25 | $20 | $0 | ~$105 |
| 200 | $100 | $20 | $25 | ~$205 |
| 500 | $250 | $40 | $25 | ~$375 |
| 1,000 | $500 | $40 | $25 | ~$625 |

**Key insight:** Costs scale linearly but revenue scales faster. Each new subscriber adds ~$39 revenue but only ~$1-3 in API costs.

---

## 📈 Revenue Projections

### Worst Case — Slow Organic Growth
*Minimal marketing, word-of-mouth only*

| Month | Subscribers | Monthly Revenue | Monthly Costs | Net |
|-------|------------|-----------------|---------------|-----|
| Month 1 (Mar) | 3 | $120 | $85 | +$35 |
| Month 2 | 5 | $200 | $90 | +$110 |
| Month 3 | 8 | $320 | $95 | +$225 |
| Month 6 | 15 | $600 | $110 | +$490 |
| Month 12 | 30 | $1,200 | $150 | +$1,050 |
| **Year 1 Total** | | **~$5,000** | **~$1,300** | **+$3,700** |

### Average Case — Active Marketing + Referrals
*Consistent social media, affiliate program active, local outreach*

| Month | Subscribers | Monthly Revenue | Monthly Costs | Net |
|-------|------------|-----------------|---------------|-----|
| Month 1 (Mar) | 5 | $200 | $85 | +$115 |
| Month 2 | 12 | $480 | $95 | +$385 |
| Month 3 | 25 | $1,000 | $110 | +$890 |
| Month 6 | 75 | $3,000 | $175 | +$2,825 |
| Month 12 | 200 | $8,000 | $300 | +$7,700 |
| **Year 1 Total** | | **~$40,000** | **~$2,500** | **+$37,500** |

### Best Case — Viral Growth + School Partnerships
*TikTok content hits, school partnerships, PR coverage*

| Month | Subscribers | Monthly Revenue | Monthly Costs | Net |
|-------|------------|-----------------|---------------|-----|
| Month 1 (Mar) | 10 | $400 | $90 | +$310 |
| Month 2 | 30 | $1,200 | $110 | +$1,090 |
| Month 3 | 80 | $3,200 | $160 | +$3,040 |
| Month 6 | 300 | $12,000 | $375 | +$11,625 |
| Month 12 | 1,000 | $40,000 | $750 | +$39,250 |
| **Year 1 Total** | | **~$180,000** | **~$5,000** | **+$175,000** |

---

## 🏗️ What's Already Built (Execution So Far)

**Built in under 2 months, from zero to live product:**

✅ Full Next.js 14 web application — live at tutcity.org
✅ AI Vision integration — Claude reads handwritten + printed math from photos
✅ Anti-skip tutoring system — timed reveals + comprehension checks
✅ 9 math subjects — auto-detected, with subject-specific AI tutor prompts
✅ Stripe subscription billing ($39.99/mo)
✅ Promo code system (unlimited, limited, single-use, expiring types)
✅ Admin dashboard — manage promos, view stats
✅ Student progress tracking — subject breakdown, strengths, weaknesses
✅ Parent dashboard — monitor your kids' progress
✅ Visual learning — KaTeX math rendering, color-coded steps, AI-generated SVG diagrams
✅ PWA support — installable on phones like a native app
✅ Multiple teaching methods — Common Core & Singapore Math
✅ Affiliate program — 15% recurring commission
✅ Gamification — XP, levels, badges
✅ Practice mode — AI-generated problems by subject
✅ "I'm Stuck" button — extra hints without giving away answers
✅ Push notifications — streak reminders

**Tech stack:** Next.js 14, TypeScript, Tailwind CSS, Anthropic Claude Vision, Stripe, Supabase, Vercel

---

## 🗺️ Roadmap — Next 6 Months

### Phase 1: User Acquisition (Mar-Apr 2026)
- Get first 50 paying subscribers
- TikTok/Instagram content strategy (demo videos, problem-solving clips)
- Local outreach — Denver-area tutoring centers, homeschool co-ops
- Affiliate program push through current users
- Collect testimonials and social proof

### Phase 2: Product Expansion (May-Jun 2026)
- Tiered pricing (Basic/Pro/Family)
- Apple App Store + Google Play via Capacitor wrapper
- Science subjects (Physics, Chemistry)
- Study group features
- AI-generated practice tests

### Phase 3: Scale (Jul-Aug 2026)
- School district licensing program
- White-label option for tutoring centers
- API for third-party integrations
- Expand beyond math (English, History with different AI approaches)
- Hire first part-time team member (content/marketing)

---

## 🏆 Competitive Advantage

| Feature | Tut City | Photomath | Mathway | Khan Academy |
|---------|----------|-----------|---------|--------------|
| Photo → Solution | ✅ | ✅ | ✅ | ❌ |
| Anti-skip teaching | ✅ | ❌ | ❌ | ❌ |
| Comprehension checks | ✅ | ❌ | ❌ | ✅ (videos) |
| Understanding score | ✅ | ❌ | ❌ | ❌ |
| Visual diagrams | ✅ | ❌ | ❌ | ✅ (videos) |
| Multiple teaching methods | ✅ | ❌ | ❌ | ❌ |
| Parent dashboard | ✅ | ❌ | ❌ | ✅ |
| Affordable | $39.99/mo | Free/$$$ | $9.99/mo | Free |

**Our moat:** We don't just solve — we TEACH. And we prove the student understood it.

---

## 💼 The Investment Ask

**What I need:** Seed funding to cover 6 months of operating costs + marketing budget across all my companies.

**What Tut City specifically needs:**
- $100/mo — Operating costs (hosting, API, tools)
- $200-500/mo — Marketing budget (social media ads, content creation)
- **Total: ~$300-600/mo for Tut City's share**

**What investors get:**
- 5% revenue share across all companies, OR
- 5% equity stake in the portfolio

**Why it's a good bet:**
1. Product is ALREADY BUILT and live — this isn't an idea, it's a working business
2. Margins are insane — ~95% gross margin at scale (SaaS + AI)
3. Market is massive — US tutoring market is $12B+ and growing
4. Recurring revenue — subscriptions = predictable income
5. Low burn rate — we're profitable from subscriber #3

---

## 📋 Summary

| Metric | Value |
|--------|-------|
| Product | Live at tutcity.org |
| Built in | < 2 months |
| Current cost | ~$80/mo |
| Break-even | 3 subscribers |
| Year 1 projection (avg) | $37,500 profit |
| Year 1 projection (best) | $175,000 profit |
| Gross margin | ~95% |
| Market size | $12B+ (US tutoring) |

**Tut City is built, live, and ready to grow. The only thing between here and scale is time and marketing fuel.**

---

*Prepared by Kip Klaw 🦀 — February 2026*
