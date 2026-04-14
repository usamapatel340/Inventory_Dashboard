# Firestore Deployment - Debugging Guide

## Problem Found & Fixed ✅

**Issue**: Frontend was pointing to old AWS Lambda endpoint instead of Vercel API
**Solution**: Updated `awsConfig.js` to use relative path `/api`

## What Changed

- `frontend/src/awsConfig.js` now uses `/api` endpoint (Vercel relative path)
- Frontend automatically calls Vercel API routes instead of old AWS

## Deployment Checklist

### Step 1: Verify Environment Variables in Vercel ✅ REQUIRED

Go to **Vercel Dashboard → Project Settings → Environment Variables**

You MUST have these 3 variables set:

```
FIREBASE_CONFIG = {"type":"service_account","project_id":"inventory123456-1",...}
ALERT_EMAIL = your-email@gmail.com
ALERT_EMAIL_PASSWORD = xxxx-xxxx-xxxx-xxxx (Gmail app password)
```

❌ **IF NOT SET**: Your API will fail with authentication errors

1. Check your `.env.local` file locally
2. Copy the exact values to Vercel
3. Redeploy

### Step 2: Redeploy on Vercel

Option A (Automatic - Recommended):

- Push code to GitHub (✅ Already done)
- Vercel will auto-redeploy in ~2-3 minutes
- Check deployment status at https://vercel.com

Option B (Manual):

```bash
npm install -g vercel
vercel --prod
```

### Step 3: Test the Deployment

**1. Check Console Logs (Browser DevTools)**

- Open your Vercel deployment URL
- Press `F12` → Console tab
- Try adding a product
- Look for: `API Call: POST /api/products`

**2. Check the API Response**

- Expected: `Response status: 201` (created) or `200` (updated)
- Error: `Response status: 500` or `404` means API not working

**3. Common Error Messages**

| Error                                                             | Cause                          | Fix                                    |
| ----------------------------------------------------------------- | ------------------------------ | -------------------------------------- |
| `Cannot read properties of undefined (reading 'FIREBASE_CONFIG')` | Environment variables not set  | Add them to Vercel dashboard           |
| `API Error: 404`                                                  | API routes not found           | Rebuild project on Vercel              |
| `API Error: 500`                                                  | Backend error (check Firebase) | Check browser console for details      |
| `Failed to fetch`                                                 | CORS issue                     | Verify Lambda handler has CORS headers |

### Step 4: Verify Firestore Connection

**Test if backend can reach Firestore:**

```bash
# Local test
cd backend
node test-firestore.js
```

**Expected output:**

```
✅ Firebase initialized successfully!
✅ Connected to Firestore!
📊 Products found: X
```

## API Routes Reference

All routes use relative path `/api`:

```
GET    /api/products           → Get all products
GET    /api/products/:id       → Get single product
POST   /api/products           → Create product
PUT    /api/products/:id       → Update product
PATCH  /api/products/:id/quantity → Update quantity
DELETE /api/products/:id       → Delete product
POST   /api/products/:id/alert → Send alert email
GET    /api/products/low-stock → Get low stock items
GET    /api/products/search    → Search products (query param: q)
```

## If Still Not Working

**1. Check Vercel Build Logs:**

- https://vercel.com → Projects → inventory-dashboard → Deployments
- Look for build errors or warnings

**2. Check Vercel Function Logs:**

```
Deployments → Running → Function Details
```

**3. Clear Cache:**

```bash
# Local browser
Press Ctrl+Shift+Delete → Clear browsing data

# Force rebuild
git add .
git commit -m "Trigger redeploy"
git push origin main
```

**4. Test API Directly:**

```bash
# In browser console or terminal
curl https://your-vercel-deployment.vercel.app/api/products
```

## Files Modified

- ✅ `frontend/src/awsConfig.js` - Now uses `/api` endpoint
- ✅ `backend/lambda-handler.js` - Firestore operations
- ✅ `api/handler.js` - Vercel adapter

## Next Steps

1. ✅ Commit pushed to GitHub
2. ⏳ Vercel will auto-redeploy
3. ⏳ Test by adding a product
4. ⏳ Verify data appears in Firestore Console

## Support

If API calls still fail:

1. Check browser DevTools Console (F12)
2. Note the exact error message
3. Verify environment variables are set
4. Check Vercel deployment logs
