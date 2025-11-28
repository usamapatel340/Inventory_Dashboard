# Connect GitHub to Your Amplify App

## Your Amplify App Details ✅

- **App Name**: ProjectInvent
- **App ID**: d3eawldbyewaly
- **Region**: ap-south-1 (Mumbai)

## Step-by-Step: Connect GitHub for Auto-Deploy

### 1. Go to Amplify Console

Visit: https://console.amplify.aws/

### 2. Find Your App

- You should see "ProjectInvent" in the list
- Click on it

### 3. Connect GitHub Repository

- In the left sidebar, click **"Hosting environments"**
- Click **"Connect repository"** or **"Create deployment"**
- Select **GitHub** as source
- Click **"Authorize AWS Amplify"** and login to GitHub
- Select your repository: **usamapatel340/Inventory_Dashboard**
- Select branch: **main**
- Click **"Next"**

### 4. Configure Build Settings

Amplify will auto-detect your React app. Make sure:

- **Build command**: `npm run build --prefix frontend`
- **Build output directory**: `frontend/dist`
- Click **"Save and deploy"**

### 5. Wait for Deployment

- Amplify will build and deploy your app
- Takes 2-5 minutes
- You'll see a live URL like: `https://d3eawldbyewaly.amplifyapp.com`

---

## After Deployment is Live ✅

### Test Your App:

1. Visit the live URL
2. Login with Cognito
3. Add a product
4. Verify it saves to DynamoDB
5. Test SNS alert by setting qty below threshold

### Set Environment Variables (if needed):

In Amplify Console → App settings → Environment variables, add:

```
REACT_APP_LAMBDA_ENDPOINT = https://0loi71mh9k.execute-api.ap-south-1.amazonaws.com/prod
REACT_APP_REGION = ap-south-1
```

### Enable Auto-Deploy from GitHub:

- Every time you push to GitHub main branch
- Amplify automatically builds and deploys
- No manual steps needed!

---

## Your Live Application Architecture

```
Your GitHub Code (main branch)
        ↓ (push code)
Amplify CI/CD Pipeline
        ↓ (builds React)
CloudFront CDN (global, fast)
        ↓ (frontend served)
Your React App Lives Here! 🎉
        ↓ (API calls)
Lambda + DynamoDB + SNS (backend)
```

---

## Next Action:

**Go to https://console.amplify.aws/ and connect your GitHub repository!**

It's just 2 clicks after login 🚀
