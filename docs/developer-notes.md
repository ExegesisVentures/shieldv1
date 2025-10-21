# ShieldNest Developer Notes

## Identity
ShieldNest = Coreum-only portfolio app with 3 modes:
- Visitor: explore (not saved) + upgrade nudges
- Public: save addresses, portfolio via Supabase
- Private: PMA (PDF + on-chain hash) + Shield NFT → member features

## Tech
Next.js (App Router) on Vercel, Supabase (Auth/DB/Storage). Update.dev present but optional.

## Style
- TS strict, small pure functions
- UI in `components/`, logic in `hooks/`/`contexts/`, data/helpers in `utils/`
- Errors: `{ code, message, hint?, causeId }`
- Security: no secrets client-side; RLS; sanitize logs

## Feature Flags
DEX & sell-back = coming soon

## Branch Flow
main (prod), develop (staging), feature/*, hotfix/*

## PR Template
What/Why, Risk, Rollback, Tests, Screens

## Visitor → Public → Private
- Visitor data in `localStorage` only, with exit-intent + post-action nudges
- Public saves to Supabase
- Private gated by PMA + NFT cache (fallback live check)

## Shield NFT Placeholder
Admin edits image + $ range; portfolio displays placeholder value for member accounts.

