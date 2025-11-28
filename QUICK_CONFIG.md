# AMPLIFY CONFIGURATION SUMMARY - QUICK REFERENCE

## Your Amplify App Details ✅

- **App Name**: ProjectInvent
- **App ID**: d3eawldbyewaly
- **Region**: ap-south-1 (Mumbai)
- **GitHub Repo**: usamapatel340/Inventory_Dashboard

---

## CRITICAL BUILD SETTINGS TO SET

| Setting                    | Value                                       | Status         |
| -------------------------- | ------------------------------------------- | -------------- |
| **Frontend build command** | `npm ci && npm run build --prefix frontend` | ⚠️ CHANGE THIS |
| **Build output directory** | `frontend/dist`                             | ⚠️ CHANGE THIS |
| **Backend environment**    | `dev`                                       | SELECT THIS    |
| **Service role**           | Create new (defaults)                       | CREATE THIS    |

---

## ENVIRONMENT VARIABLES TO ADD

Copy and paste these in "Environment variables" section:

```
REACT_APP_LAMBDA_ENDPOINT = https://0loi71mh9k.execute-api.ap-south-1.amazonaws.com/prod
REACT_APP_REGION = ap-south-1
REACT_APP_COGNITO_POOL_ID = ap-south-1_OxUvHWqx1
```

---

## 3 SIMPLE STEPS:

### ✅ Step 1: Fix Build Settings

- Frontend build command: `npm ci && npm run build --prefix frontend`
- Build output directory: `frontend/dist`
- **Click SAVE**

### ✅ Step 2: Add Backend Environment

- Select backend: `dev`
- **Click SAVE**

### ✅ Step 3: Create Service Role

- Click "Create a new service role"
- Accept defaults
- **Deploy starts automatically!**

---

## AFTER DEPLOYMENT (5 minutes)

Your live app: **https://d3eawldbyewaly.amplifyapp.com**

✅ Visit the URL
✅ Login with Cognito
✅ Add a product
✅ Verify it saves to DynamoDB
✅ Test SNS alert

---

## IMPORTANT LINKS

- **Amplify Console**: https://console.amplify.aws/
- **Your GitHub Repo**: https://github.com/usamapatel340/Inventory_Dashboard
- **AWS Console**: https://console.aws.amazon.com/
- **DynamoDB Table**: https://console.aws.amazon.com/dynamodb (ap-south-1)

---

## GITHUB INTEGRATION (After first deploy)

Amplify will ask to connect GitHub:

1. Click "Connect repository"
2. Select: `usamapatel340/Inventory_Dashboard`
3. Branch: `main`
4. Click "Deploy"

**Result**: Auto-deploy on every GitHub push! 🚀

---

**Need help? Check BUILD_SETTINGS.md for detailed instructions**
