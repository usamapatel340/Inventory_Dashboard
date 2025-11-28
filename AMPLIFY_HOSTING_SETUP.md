# Quick Amplify Hosting Setup via Console

## Your GitHub Repository is Ready ✅

- Repository: https://github.com/usamapatel340/Inventory_Dashboard
- Branch: main
- All code is pushed and ready!

## Next Steps to Deploy:

### Option 1: Connect GitHub to Amplify Console (RECOMMENDED - Easiest)

1. Go to: **https://console.amplify.aws/**
2. Click **"Create app"** → **"Host web app"**
3. Select **GitHub** as source
4. Click **"Authorize"** and login to your GitHub account
5. Select repository: **usamapatel340/Inventory_Dashboard**
6. Select branch: **main**
7. Click **"Next"** → **"Save and deploy"**

Amplify will automatically:

- Build your React app
- Deploy to CloudFront (CDN)
- Give you a live URL
- Auto-deploy every time you push to GitHub

**Your app will be live in 2-5 minutes!**

---

### Option 2: Using AWS CLI (Alternative)

```powershell
# Connect your GitHub repo to Amplify
aws amplify create-app `
  --name inventory-dashboard `
  --repository https://github.com/usamapatel340/Inventory_Dashboard `
  --platform WEB `
  --region ap-south-1
```

---

## What You'll Get:

✅ **Live URL**: `https://your-app-id.amplifyapp.com`
✅ **Free HTTPS**: Secure connection
✅ **Auto CI/CD**: Updates on every GitHub push
✅ **Global CDN**: Fast loading worldwide
✅ **Mumbai Region**: Your data stays in ap-south-1

---

## After Deployment:

1. Visit your live URL
2. Login with your Cognito credentials
3. Add a product to test
4. Verify it saves to DynamoDB
5. Test SNS alert by setting quantity below threshold

---

**Recommendation**: Go to https://console.amplify.aws and click "Create app" - it's the easiest way!
