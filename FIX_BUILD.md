# FIX: Amplify Build Configuration

## Problem

Your Amplify build needs the correct configuration for your Parcel-based React app.

---

## Solution: Update Build Settings in Amplify Console

### Go to: https://console.amplify.aws/

### Find your app: **ProjectInvent**

### Go to: **Deployment settings** → **Build settings**

---

## EXACT SETTINGS TO USE

### 1. Frontend build command

**Replace with:**

```
cd frontend && npm ci && npm run build
```

### 2. Build output directory

**Replace with:**

```
frontend/dist
```

### 3. Environment variables

Add these (copy exactly):

```
REACT_APP_LAMBDA_ENDPOINT=https://0loi71mh9k.execute-api.ap-south-1.amazonaws.com/prod
REACT_APP_REGION=ap-south-1
REACT_APP_COGNITO_POOL_ID=ap-south-1_OxUvHWqx1
```

### 4. Backend environment

**Select:** `dev`

### 5. Service role

**Create:** New service role (if not already done)

---

## After Saving

1. Click **Save** button
2. Amplify will automatically trigger a new build
3. Wait 3-5 minutes for build to complete
4. You should see **green checkmark** ✅

---

## What Gets Built

```
Your Code (GitHub)
    ↓
Amplify Build Process
    ↓
cd frontend && npm ci && npm run build
    ↓
Creates: frontend/dist/index.html
    ↓
Deployed to CloudFront CDN
    ↓
Live URL: https://d3eawldbyewaly.amplifyapp.com
```

---

## If Build Still Fails

### Check these files exist after local build:

```powershell
cd "c:\Users\usama\OneDrive\Desktop\Project_Invent\frontend"
npm run build
ls dist/index.html  # Should exist!
```

### Verify in Amplify Console:

1. Click **Deployment status** → **Build log**
2. Look for errors
3. Common issues:
   - Missing `npm ci` (use this instead of `npm install`)
   - Wrong build output directory
   - Environment variables not set

---

## Success Indicators ✅

When build works, you'll see:

- ✅ Build log shows: "Build succeeded"
- ✅ Live URL is active
- ✅ Visit URL shows your app
- ✅ Login works with Cognito
- ✅ Products save to DynamoDB

---

## GitHub Integration (After first successful build)

Amplify will ask to connect GitHub:

1. Select: `usamapatel340/Inventory_Dashboard`
2. Branch: `main`
3. Click **Deploy**

Then every GitHub push triggers auto-deployment! 🚀

---

## Complete URL After Deployment

```
https://d3eawldbyewaly.amplifyapp.com
```

Share this with anyone to use your app!

---

**Go to Amplify Console now and update these settings!**
