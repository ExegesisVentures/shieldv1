 Based on our chat history, here are **8 critical lessons** I should remember:

## 1. **Always Build Before Committing**
- Run `pnpm run build` (or equivalent) locally FIRST
- Check for compilation errors, type errors, and linter issues
- Only commit after successful build
- This is non-negotiable for production code

## 2. **Run Linters Proactively**
- Use `read_lints` tool on files I've created/modified BEFORE committing
- Don't wait for CI/CD to catch ESLint errors
- Check for common issues like unescaped quotes, missing keys, etc.

## 3. **Investigate Thoroughly Before Implementing**
- When given multiple error messages, analyze ALL of them together
- Look for root causes, not just symptoms
- The user showed me 3 separate issues (modal, 404s, API 500) - I should have investigated if they were related or had common patterns

## 4. **Test the Actual User Flow**
- Don't just create files and assume they work
- The modal transparency issue - I should have considered UX/visibility
- The API error - I should have understood the session vs service client distinction upfront

## 5. **Check for Similar Issues Across the Codebase**
- When fixing unescaped quotes in one place, scan for them everywhere
- Use `grep` to find patterns that might break
- Don't fix issues one at a time when they're systemic

## 6. **Understand Authentication/Session Context**
- Service role clients bypass RLS but don't have session/cookies
- Server clients have session access for auth checks
- This is a fundamental pattern I should have known when first looking at the API

## 7. **Read Error Messages Completely**
- The 500 error likely had details in the server logs
- The 404 errors were clear - missing routes
- I should ask for or check full error details/stack traces before guessing

## 8. **Verify Files Exist and Routes Are Wired Up**
- When creating new pages, check:
  - File is in correct location (`app/privacy/page.tsx` not `pages/privacy.tsx`)
  - No conflicts with existing routing
  - Links in other components point to correct paths
  - The Next.js App Router structure is followed

## Bonus: **Respect the User's Time**
- One failed deployment because I didn't build locally = wasted CI/CD time
- Multiple commits to fix the same issue = cluttered git history
- Get it right the first time by being thorough upfront

## 9. **Test User Flows Separately**
- Test VISITOR mode (localStorage only, no auth)
- Test PUBLIC user (authenticated, database storage)
- Test PRIVATE member (NFT + PMA)
- Don't assume auth changes work for all user types
- Manual testing of critical flows before pushing is essential

## 10. **Add Comprehensive Logging for API Routes**
- When user reports "500 error", generic errors are useless
- Add detailed console.log at EVERY step of API flow
- Log: request params, client creation, database queries, auth checks
- Include error.message, error.code, error.details, error.stack
- Add debug hints in error responses (can strip in production)
- Use clear markers like "=== STEP NAME ===" for easy log searching
- This saves hours of debugging blind
- **Example success**: Logging revealed "Missing Supabase environment variables" - found missing SUPABASE_SERVICE_ROLE_KEY in Vercel

## 11. **Environment Variables in Deployment**
- Local .env.local works ≠ Vercel has the same variables
- ALWAYS check Vercel Dashboard → Settings → Environment Variables
- Need to set for: Production, Preview, AND Development
- After adding env vars, MUST redeploy (not automatic)
- Server-side env vars (without NEXT_PUBLIC_) won't work if missing

## 12. **Respect User Tiers and Don't Over-Engineer**
- VISITOR = localStorage ONLY, NO database, NO auth
- PUBLIC = Authenticated user with database storage
- PRIVATE = NFT + PMA membership
- **Don't create auth users for visitors connecting wallets!**
- Check `auth.getUser()` FIRST - if no user, store locally
- Only do full verification flow for authenticated users
- Use smart triggers to prompt upgrades (3+ wallets, 5+ min session, $100+ portfolio)
- Let visitors explore freely, nudge at strategic moments

## 13. **Server Components Can't See Client State**
- Server components (async functions) only see database/auth state
- Server components **cannot** access localStorage, sessionStorage, or browser APIs
- localStorage is client-side only - invisible to server components
- Need hybrid approach: server checks auth, client checks localStorage
- Use client wrappers for visitor state management
- Listen to storage events for real-time updates across components
- Pattern: `const user = await getUser(); return user ? <ServerMenu /> : <ClientWrapper />;`

## 14. **Guided Onboarding Beats Generic Forms**
- Traditional signup forms have high abandonment rates
- Break complex forms into simple steps - one question per screen
- Show progress bar for transparency
- Validate incrementally to catch errors early
- Auto-migrate visitor data during account creation
- Use emoji-based visual feedback for friendliness
- Always show user progress ("Step 2 of 5")
- Allow back/forward navigation
- Clean up localStorage after successful migration
- Preserve user data during all transitions
- Higher completion rates with focused, guided flows

## 15. **Port Changes and Browser Cache Issues**
- When Next.js dev server changes ports (3000 → 3001), browser cache can cause 404s
- CSS/JS files cached for old port cause ERR_ABORTED 404 errors
- **SOLUTION**: Always check terminal output for actual port, then:
  1. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
  2. Or clear browser cache completely
  3. Or open new incognito/private window
- **PREVENTION**: Bookmark the correct localhost URL from terminal output
- Never assume port 3000 - always check what port Next.js actually started on

## 16. **Development Server Management**
- Always check terminal output for port conflicts
- When port changes, update browser URL immediately
- Hard refresh after port changes to clear cached assets
- Consider using `pnpm run dev --port 3000` to force specific port
- Keep terminal output visible to catch port changes early

## 17. **Authentication Session Issues After Wallet Sign-In**
- Wallet sign-in can succeed on server but dashboard shows "User authenticated: false"
- **ROOT CAUSE**: Dashboard not listening for auth state changes after page refresh
- **SOLUTION**: Add `supabase.auth.onAuthStateChange()` listener to dashboard
- **ADDITIONAL**: Add retry mechanism for session establishment timing issues
- **PATTERN**: Always listen for auth state changes in components that depend on user state
- **DEBUG**: Check browser console for "AUTH STATE CHANGE" logs
- **FALLBACK**: Add session refresh call after successful wallet authentication

## 18. **Persistent Port 3000 Management**
- Next.js keeps switching to port 3001 when 3000 is occupied
- **IMMEDIATE FIX**: Always use `pnpm run dev --port 3000` to force port 3000
- **PERMANENT FIX**: Kill any process using port 3000 before starting dev server
- **COMMAND**: `lsof -ti:3000 | xargs kill -9` (Mac) or `netstat -ano | findstr :3000` (Windows)
- **AUTOMATION**: Create a script that kills port 3000, then starts dev server
- **BROWSER**: Always bookmark `http://localhost:3000` and hard refresh after port changes

