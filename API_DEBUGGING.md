# API Debugging Guide

## Problem Summary

- ✅ Data persists on website (localStorage fallback working)
- ❌ Data not appearing in Firestore (API calls failing)

When you add a product, `hybridAPI` tries the real API first, but if it fails, it silently falls back to localStorage. This explains why your data doesn't disappear (it's stored locally) but doesn't show in Firestore (it never reached the API).

## Root Cause: API Requests Failing Silently

The flow is:

1. Frontend: `hybridAPI.create()`
2. Tries: `productsAPI.create()` → `fetch('/api/products', { method: 'POST', body })`
3. **Fails** ❌ (reason unknown)
4. Falls back to: `localStorageAPI.create()` → saves to localStorage

## Debugging Steps (In Your Deployed App)

### Step 1: Test If Requests Reach Vercel

**In browser console, run:**

```javascript
fetch("/api/test")
  .then((r) => r.json())
  .then(console.log);
```

**Expected response:**

```json
{
  "success": true,
  "message": "Test endpoint works - requests are reaching Vercel",
  "received": { ... }
}
```

**If this fails:**

- ❌ Requests not reaching Vercel at all
- Check network tab (F12 → Network)
- Check CORS headers

### Step 2: Check Firestore Connection

**In browser console, run:**

```javascript
fetch("/api/debug")
  .then((r) => r.json())
  .then(console.log);
```

**Expected response:**

```json
{
  "timestamp": "...",
  "checks": {
    "firestore_connection": "✅ Connected",
    "firestore_readable": "✅ Yes"
  },
  "data": {
    "product_count": 1,
    "products": [...]
  },
  "environment": {
    "FIREBASE_CONFIG": "✅ Set (...)",
    "ALERT_EMAIL": "✅ Set",
    "NODE_ENV": "production"
  }
}
```

**If you get errors:**

- Check if FIREBASE_CONFIG is set in Vercel environment variables
- Check if Firebase credentials are valid

### Step 3: Test Create Product API Directly

**In browser console, run:**

```javascript
fetch("/api/products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test Product",
    sku: "TEST-001",
    qty: 10,
    threshold: 5,
    category: "Test",
    contact: "test@example.com",
    autoAlert: false,
  }),
})
  .then((r) => r.json())
  .then((data) => {
    console.log("Response:", data);
    console.log("Success?", data.product_id ? "YES" : "NO");
  });
```

**Expected response:**

```json
{
  "product_id": "...",
  "name": "Test Product",
  "sku": "TEST-001",
  "qty": 10,
  "threshold": 5,
  ...
}
```

**If this fails:**

- Write down the exact error message
- Check browser console for detailed error logs
- Check Vercel Function Logs (in Vercel dashboard)

### Step 4: Open Browser Console (F12)

The App.js now logs every API call:

**When loading page:**

```
=== APP MOUNT: Loading products ===
📥 API Response: { success: true, data: [...] }
✅ Loaded X products
```

**When saving product:**

```
Saving product: { name: "...", ... }
Save result: { success: true, data: {...} }
✅ Saved: {...}
```

**If API fails, you'll see:**

```
Saving product: { name: "...", ... }
Save result: { success: false, error: "..." }
❌ Save failed: [error message]
```

**Copy this error message - it's the key to solving the problem!**

## Possible Issues & Solutions

### Issue 1: FIREBASE_CONFIG Not Set in Vercel

**Symptom:**

- `/api/debug` returns: `"FIREBASE_CONFIG": "❌ Not set"`
- Or error: `Firebase initialization error`

**Fix:**

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add these variables:
   - `FIREBASE_CONFIG` = Paste your entire service account JSON
   - `ALERT_EMAIL` = Your Gmail address
   - `ALERT_EMAIL_PASSWORD` = Your Google app password
3. Redeploy

### Issue 2: Request Body Not Being Passed

**Symptom:**

- Fetch request works, but product isn't created
- Error: `body is empty` or `name is undefined`

**Fix:**

- This would be a path routing issue
- The problem is in `api/handler.js` or `backend/lambda-handler.js` path matching
- Would need to check request logs in Vercel dashboard

### Issue 3: Firestore Operations Timeout

**Symptom:**

- Requests hang for 10+ seconds then fail
- Error: `DEADLINE_EXCEEDED`

**Fix:**

- Increase `maxDuration` in `vercel.json` from 30 to 60 seconds
- Check Firestore has proper security rules

### Issue 4: Mixed Content (HTTP vs HTTPS)

**Symptom:**

- Fetch requests fail in browser console with CORS error
- Error: `Mixed Content: The page was loaded over HTTPS, but requested an insecure resource`

**Fix:**

- Make sure your Vercel deployment URL is HTTPS
- Make sure frontend is using relative paths (`/api/...` not `http://localhost`)

## Next Steps

1. **Run the three tests above** in browser console of your deployed app
2. **Share the responses** - this will immediately show where the problem is
3. **Check browser console** for any error messages (F12 → Console tab)
4. **Check Vercel logs** (Vercel Dashboard → Functions → Click on function → Logs)

Example of what to share:

```
Test 1 Response: [paste response or error]
Debug 1 Response: [paste response or error]
Create Test Response: [paste response or error]
Browser Console Errors: [any red errors]
```

Once we see the exact error, the fix will be clear!
