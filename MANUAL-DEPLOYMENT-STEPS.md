# 🚨 URGENT: Manual Deployment Steps

Your production site is running **OLD CODE** with the bug. Here's how to deploy the fix:

---

## ⚡ QUICK FIX (Recommended)

### Option A: Use the Deployment Script

```bash
# In your local shieldv2 directory:
./DEPLOY-NOW.sh
```

**Note**: You may need to edit the script first with your server details.

---

## 🔧 MANUAL DEPLOYMENT (If script doesn't work)

### Step 1: SSH into Your Server

```bash
ssh root@your-server-ip
# Or whatever user/server you use
```

### Step 2: Navigate to Project Directory

```bash
cd /root/shieldv2
# Or wherever you deployed the project
```

### Step 3: Pull Latest Code

```bash
git pull origin main
```

**Expected output**:
```
Updating 61c51b0..c69d97a
Fast-forward
 app/dashboard/page.tsx | 117 ++++++++++++++++++-----------------
 components/ErrorBoundary.tsx | 125 +++++++++++++++++++++++++++++++++++++
 2 files changed, 191 insertions(+), 51 deletions(-)
```

### Step 4: Install Dependencies (if needed)

```bash
npm install
```

### Step 5: Build Production Bundle

```bash
npm run build
```

**This is the CRITICAL step!** Wait for it to complete.

Expected output:
```
✓ Compiled successfully
✓ Generating static pages (50/50)
Route (app)                     Size  First Load JS
├ ƒ /dashboard                33.9 kB         552 kB
...
```

### Step 6: Restart the Application

**If using PM2:**
```bash
pm2 restart shieldnest
# Or whatever your PM2 app is named
pm2 logs shieldnest --lines 50  # Check for errors
```

**If using systemd:**
```bash
sudo systemctl restart shieldnest
sudo journalctl -u shieldnest -n 50  # Check for errors
```

**If using Docker:**
```bash
docker-compose down
docker-compose up -d --build
docker-compose logs -f --tail=50
```

**If running directly:**
```bash
# Kill the old process first
pkill -f "next start"

# Start fresh
npm run start
```

---

## ✅ VERIFICATION

### 1. Check the Bundle Hash Changed

Visit: https://v1.shieldnest.org/dashboard

Open DevTools → Network tab → Look for files like:
- OLD: `page-07a9a273d6aaebc0.js` ❌
- NEW: `page-DIFFERENT-HASH.js` ✅

### 2. Hard Refresh Your Browser

- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`
- Or open in Incognito/Private mode

### 3. Test the Dashboard

1. Connect wallet
2. Check console - NO React Error #310 ✅
3. Try hiding a token - should work smoothly ✅
4. No error boundary screen ✅

---

## 🔍 TROUBLESHOOTING

### Issue: "git pull" says "Already up to date"

**Solution:**
```bash
git fetch origin
git reset --hard origin/main
npm run build
pm2 restart shieldnest
```

### Issue: Build fails with errors

**Solution:**
```bash
rm -rf .next node_modules/.cache
npm install
npm run build
```

### Issue: Still seeing old bundle hash

**Solution:**
1. Check if build actually completed successfully
2. Ensure PM2/systemd restarted the new code
3. Clear CDN cache if using Cloudflare/etc
4. Try `pm2 restart shieldnest --update-env`

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart shieldnest
```

---

## 📊 WHAT WAS FIXED

The latest code includes:

✅ Removed useMemo that was causing infinite loops  
✅ Stable Set references for hidden tokens  
✅ Error Boundary with detailed error messages  
✅ Simplified token filtering (inline computation)  
✅ Fixed explorer links to use proper denoms  
✅ Enhanced tooltips for all actions  
✅ Made hide button always visible  

**Commits included**: `61c51b0` → `c69d97a` (7 commits)

---

## 🆘 STILL HAVING ISSUES?

### Check Server Status

```bash
ssh root@your-server
pm2 status
pm2 logs shieldnest --lines 100
```

### Check Build Output

The build should show:
```
✓ Compiled successfully
Route (app)                     Size  First Load JS
├ ƒ /dashboard                33.9 kB         552 kB
```

If you see errors during build, share them!

### Nuclear Option (Last Resort)

```bash
cd /root/shieldv2
git fetch origin
git reset --hard origin/main
rm -rf .next node_modules
npm install
npm run build
pm2 delete shieldnest
pm2 start npm --name "shieldnest" -- start
pm2 save
```

---

## 📝 IMPORTANT NOTES

1. **The code is fixed in Git** - you just need to deploy it
2. **Bundle must be rebuilt** - `git pull` alone isn't enough
3. **Application must restart** - PM2/systemd must restart with new code
4. **Browser cache** - users may need to hard refresh

---

**Status**: 🟢 Fix is ready in Git  
**Action Required**: Deploy to production server  
**Expected Result**: Error #310 eliminated  

---

Once deployed successfully, you should see a **different bundle hash** and **no more errors**! 🎉

