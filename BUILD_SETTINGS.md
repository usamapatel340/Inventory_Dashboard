# Amplify Build Settings Configuration

## Your App: ProjectInvent

**App ID**: d3eawldbyewaly
**Region**: ap-south-1 (Mumbai)

---

## Build Settings to Configure in Amplify Console

### Frontend Build Command

```
npm ci && npm run build --prefix frontend
```

### Build Output Directory

```
frontend/dist
```

### Environment Variables (Add these)

```
REACT_APP_LAMBDA_ENDPOINT=https://0loi71mh9k.execute-api.ap-south-1.amazonaws.com/prod
REACT_APP_REGION=ap-south-1
REACT_APP_COGNITO_POOL_ID=ap-south-1_OxUvHWqx1
```

---

## Step-by-Step Configuration:

### 1. **Frontend build command**

- Current: (auto-detected or empty)
- Change to: `npm ci && npm run build --prefix frontend`
- ✅ This builds your React app from the `frontend` folder

### 2. **Build output directory**

- Current: `/` (wrong!)
- Change to: `frontend/dist`
- ✅ This tells Amplify where your built app is located

### 3. **Select Backend Environment**

- Choose: `dev` (already exists)
- ✅ This connects your frontend to DynamoDB/Lambda

### 4. **Service Role**

- Click: "Create a new service role"
- Accept all defaults in the new window
- ✅ This gives Amplify permissions to deploy

### 5. **Click Save**

- After saving, Amplify will deploy your app
- Takes 3-5 minutes

---

## After Build Completes ✅

You'll see:

- ✅ Build status: **Success**
- ✅ Live URL: `https://d3eawldbyewaly.amplifyapp.com`
- ✅ Your React app is LIVE!

---

## Test Your Live App:

1. **Visit**: https://d3eawldbyewaly.amplifyapp.com
2. **Login** with Cognito credentials
3. **Add a product** → Should save to DynamoDB ✅
4. **Set qty below threshold** → Should trigger SNS email ✅

---

## Troubleshooting:

### If build fails:

- Check browser console (F12) for errors
- Check CloudWatch logs in AWS Console
- Verify environment variables are set

### If products don't save:

- Verify API endpoint is correct in awsConfig.js
- Check Lambda has DynamoDB permissions
- Check CORS is enabled in API Gateway

### If emails don't send:

- Verify SNS topic has email subscription confirmed
- Check Lambda is publishing to ExpenseSNS topic

---

## Your Complete Architecture Now Live:

```
GitHub (usamapatel340/Inventory_Dashboard)
    ↓ (auto-deploy on push)
Amplify CI/CD
    ↓ (builds & hosts)
CloudFront CDN
    ↓ (serves React app)
Your Users Can Visit:
https://d3eawldbyewaly.amplifyapp.com
    ↓ (API calls)
Lambda + API Gateway
    ↓
DynamoDB (Products table)
+ SNS (Email alerts)
```

---

## Next: Connect GitHub

After you save build settings, Amplify will ask to connect your GitHub repository.

Select:

- **Repository**: usamapatel340/Inventory_Dashboard
- **Branch**: main
- **Click Deploy**

Then every GitHub push = auto-deployed! 🚀

---

**Questions? Let me know!**
