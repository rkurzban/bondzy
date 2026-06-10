# Bondzy

**No More Hoping. Make Things Happen.**

Bondzy lets you motivate anyone to be at the right place, at the right time — with a little buried treasure.

## Running Locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Deploying

This project is configured for deployment on Vercel. Push to GitHub and connect to Vercel for automatic deploys.

Database migrations are separate from Vercel deploys. Apply Supabase migrations from the repo root with:

```bash
npx supabase db push
```
