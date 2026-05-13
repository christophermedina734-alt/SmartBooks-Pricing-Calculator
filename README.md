# SmartBooks CPA Pricing Calculator

Working MVP for quoting bookkeeping, cleanup, advisory, and monthly accounting services.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase

The app works with sample data and browser storage by default. To connect Supabase:

1. Copy `.env.example` to `.env.local`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Create tables from `supabase/schema.sql`.

Pricing assumptions live in `lib/pricing.ts` so the formula is easy to edit later.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New > Project**.
3. Import the GitHub repository.
4. Keep the detected framework as **Next.js**.
5. Add Supabase environment variables if you want cloud quote storage:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**.
