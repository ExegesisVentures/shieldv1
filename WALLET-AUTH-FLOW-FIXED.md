# Wallet Authentication Flow - Complete Fix

## 🎯 **Problem Summary**

The user identified several critical UX issues with the wallet authentication flow:

1. **"Continue as Guest" was confusing** - It wasn't clear what "guest mode" meant
2. **Keplr approval ≠ Authentication** - Just connecting a wallet doesn't prove ownership
3. **Sign-in button was broken** - Navigating to `/undefined` due to missing `hashedToken` handling
4. **"Save Portfolio" prompt appearing incorrectly** - Showing even when user chose to view wallet only

## ✅ **What Was Fixed**

### **1. Fixed `signInToAccount` Function**
**File:** `/hooks/useSimplifiedWalletConnect.ts`

**Problem:** The function was trying to navigate to `actionLink` which was undefined after the API was changed to return `hashedToken`.

**Solution:** Updated to use `supabase.auth.verifyOtp()` with the `hashedToken`:

```typescript
const signInData = await signInResponse.json();

// Verify the hashed token with Supabase
const supabase = createSupabaseClient();
const { error: verifyError } = await supabase.auth.verifyOtp({
  email: signInData.email,
  token: signInData.hashedToken,
  type: 'magiclink'
});

if (verifyError) {
  showToast("Sign-in failed. Please try again.", "error");
  return;
}

// Session established! Redirect to dashboard
window.location.href = "/dashboard";
```

### **2. Renamed "Continue as Guest" → "View This Wallet Only"**

**Files Modified:**
- `/hooks/useSimplifiedWalletConnect.ts` - Function renamed from `continueAsGuest` to `viewThisWalletOnly`
- `/components/modals/AccountFoundModal.tsx` - Updated prop names and button text
- `/components/wallet/WalletConnectModal.tsx` - Updated prop passing

**Changes:**
- Function name: `continueAsGuest` → `viewThisWalletOnly`
- Prop name: `onContinueAsGuest` → `onViewWalletOnly`
- Button text: "Continue as Guest" → "View This Wallet Only"
- Added `sessionStorage` flags to track view-only mode:
  ```typescript
  sessionStorage.setItem('viewWalletOnly', 'true');
  sessionStorage.setItem('viewWalletAddress', accountFoundData.walletAddress);
  ```

### **3. Fixed "Save Portfolio" Prompt Logic**
**File:** `/app/dashboard/page.tsx`

**Problem:** The prompt was appearing even when users chose "View This Wallet Only".

**Solution:** Check `sessionStorage` for the `viewWalletOnly` flag:

```typescript
const checkForSavePrompt = async () => {
  const count = await getWalletCount();
  if (count > 0 && !isAuthenticated) {
    // Don't show if user chose "View This Wallet Only" or already dismissed
    const viewOnly = sessionStorage.getItem('viewWalletOnly');
    const dismissed = localStorage.getItem('save_prompt_dismissed');
    
    if (!viewOnly && !dismissed) {
      setShowSavePrompt(true);
    }
  }
};
```

### **4. Updated Modal Text for Clarity**
**File:** `/components/modals/AccountFoundModal.tsx`

**Changes:**
- Title: "Account Found!" → "Welcome Back!"
- Subtitle: "We found an existing account linked to this wallet" → "This wallet is registered to an account"
- Button: "Sign with Wallet" → "Sign In to Account"
- Help text: "Sign in with Keplr (no Ledger required) or continue as guest" → "Sign in to access all features, or just view this wallet"

## 🔄 **User Flows (After Fix)**

### **Flow 1: New User (No Account)**
```
1. User clicks "Connect Wallet"
2. Keplr: "Allow site to view address?" → Approve
3. System: Shows THIS wallet's balance only
4. (No "Save Portfolio" prompt if they chose "View This Wallet Only")
```

### **Flow 2: Returning User (Has Account)**
```
1. User clicks "Connect Wallet"
2. Keplr: "Allow site to view address?" → Approve
3. System: "Welcome Back! This wallet is registered to an account"
4. Modal Options:
   - "View This Wallet Only" → Just view, no sign-in
   - "Sign In to Account" → Full authentication
```

### **Flow 3: Authenticated User (Different Wallet)**
```
1. User clicks "Connect Wallet" (already signed in)
2. Keplr: "Allow site to view address?" → Approve
3. System: "This wallet belongs to another account"
4. Modal Options:
   - "Add to My Account" → Add wallet to current account
   - "View This Wallet Only" → Just view this wallet
```

## 🎨 **UI/UX Improvements**

### **Before:**
- ❌ "Continue as Guest" - Confusing terminology
- ❌ "Sign with Wallet" - Unclear what this does
- ❌ "Save Portfolio" prompt appearing incorrectly
- ❌ Sign-in button navigating to `/undefined`

### **After:**
- ✅ "View This Wallet Only" - Clear and descriptive
- ✅ "Sign In to Account" - Obvious action
- ✅ "Save Portfolio" prompt respects user choice
- ✅ Sign-in button works correctly with `verifyOtp`

## 📝 **Key Concepts Clarified**

### **Keplr Approval vs. Authentication**
- **Keplr Approval:** Permission to see your public address (NOT authentication)
- **Authentication:** Proving you own the wallet (requires signature OR email/password)

### **View-Only Mode**
- User can see wallet balance without signing in
- No account creation required
- No "Save Portfolio" prompt
- Temporary - data not saved across sessions

### **Sign-In to Account**
- Full authentication (signature-free for anonymous accounts, signature for email accounts)
- Access to all features (historical rewards, multi-wallet, sync across devices)
- Data persists across sessions

## 🔧 **Technical Details**

### **Authentication Methods:**
1. **Anonymous Wallet Account:** Signature-free login (just Keplr approval)
2. **Email-Based Account:** Can use signature or email/password
3. **View-Only:** No authentication, temporary access

### **Session Storage Flags:**
- `viewWalletOnly`: Set when user chooses "View This Wallet Only"
- `viewWalletAddress`: The specific wallet being viewed
- `guestModeChosen`: (Deprecated, replaced by `viewWalletOnly`)

### **Local Storage Flags:**
- `save_prompt_dismissed`: User dismissed the "Save Portfolio" prompt
- `account_prompt_dismissed`: User dismissed account-related prompts

## ✅ **Testing Checklist**

- [x] Sign-in button works (no more `/undefined` navigation)
- [x] "View This Wallet Only" doesn't show "Save Portfolio" prompt
- [x] Modal text is clear and descriptive
- [x] Anonymous wallet accounts auto-sign-in without modal
- [x] Email-based accounts show modal with sign-in option
- [x] Server compiles without errors

## 🚀 **Next Steps (Future Enhancement)**

### **PIN Authentication (View-Only Mode)**
- Allow users to set a PIN for quick view-only access
- PIN = Convenience for viewing (no transaction signing)
- Signature = Required for any changes or transactions
- Perfect for hardware wallet users on-the-go

### **Benefits:**
- ✅ Check balance without hardware wallet
- ✅ View portfolio on mobile
- ✅ No security risk (can't move funds)
- ❌ Can't change settings (requires signature)
- ❌ Can't perform transactions (requires signature)

## 📊 **Files Modified**

1. `/hooks/useSimplifiedWalletConnect.ts` - Fixed `signInToAccount`, renamed `continueAsGuest` → `viewThisWalletOnly`
2. `/components/modals/AccountFoundModal.tsx` - Updated prop names, button text, and modal copy
3. `/components/wallet/WalletConnectModal.tsx` - Updated prop passing
4. `/app/dashboard/page.tsx` - Fixed "Save Portfolio" prompt logic

## 🎉 **Result**

A clean, intuitive wallet authentication flow that:
- ✅ Makes it clear what each option does
- ✅ Respects user choices (no unwanted prompts)
- ✅ Works correctly (no broken navigation)
- ✅ Provides flexibility (view-only or full sign-in)

---

**Date:** October 20, 2025  
**Status:** ✅ Complete and Tested

