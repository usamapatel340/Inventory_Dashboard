# 🚀 AMPLIFY DEPLOYMENT - FINAL CHECKLIST

## Your Amplify App Details

- **App Name**: ProjectInvent
- **App ID**: d3eawldbyewaly
- **Region**: ap-south-1 (Mumbai)
- **Status**: ⏳ Waiting for build configuration

---

## ✅ WHAT'S READY

- ✅ Code pushed to GitHub: https://github.com/usamapatel340/Inventory_Dashboard
- ✅ Frontend builds locally: `frontend/dist/index.html` created
- ✅ Backend (Lambda + DynamoDB) deployed in AWS
- ✅ SNS alerts configured
- ✅ amplify.yml created with correct build config

---

## 🔧 FINAL CONFIGURATION (DO THIS NOW)

Go to: **https://console.amplify.aws/**

### 1. Find your app

- Click: **ProjectInvent**

### 2. Go to Build Settings

- Left sidebar → **App settings** → **Build settings**

### 3. Update these fields:

| Field                  | Current  | Set To                                      |
| ---------------------- | -------- | ------------------------------------------- |
| Frontend build command | ❌ Wrong | ✅ `cd frontend && npm ci && npm run build` |
| Build output directory | ❌ `/`   | ✅ `frontend/dist`                          |
| Service role           | ❓       | ✅ Create new (accept defaults)             |
| Backend environment    | -        | ✅ Select `dev`                             |

### 4. Add Environment Variables

Click **Environment variables** → **Add**

```
REACT_APP_LAMBDA_ENDPOINT = https://0loi71mh9k.execute-api.ap-south-1.amazonaws.com/prod
REACT_APP_REGION = ap-south-1
REACT_APP_COGNITO_POOL_ID = ap-south-1_OxUvHWqx1
```

### 5. Save

- **Click**: "Save" button
- Amplify triggers new build (3-5 minutes)

---

## 📊 Build Process

```
You click SAVE
    ↓
Amplify pulls code from GitHub
    ↓
Runs: cd frontend && npm ci && npm run build
    ↓
Creates: dist/index.html (verified ✅)
    ↓
Deploys to CloudFront CDN
    ↓
Live URL: https://d3eawldbyewaly.amplifyapp.com
```

---

## ✅ AFTER BUILD COMPLETES

### Success! You'll see:

- ✅ Green checkmark on Deployments tab
- ✅ Status: "Build succeeded"
- ✅ Live URL is active
- ✅ Preview URL works

### Test your app:

1. **Visit**: https://d3eawldbyewaly.amplifyapp.com
2. **Login** with Cognito credentials
3. **Add product** → Check DynamoDB saved it ✅
4. **Set qty low** → Check SNS email arrived ✅

---

## 🔗 GITHUB AUTO-DEPLOY (After first build)

After build succeeds, Amplify will show:

- **"Connect repository"** button
- Select: `usamapatel340/Inventory_Dashboard`
- Branch: `main`
- Click: **Deploy**

**Result**: Every GitHub push = automatic deployment! 🚀

---

## 📱 Your Live URLs

### Frontend (Amplify Hosting)

```
https://d3eawldbyewaly.amplifyapp.com
```

### Backend (Lambda API)

```
https://0loi71mh9k.execute-api.ap-south-1.amazonaws.com/prod
```

### Database (DynamoDB)

```
ap-south-1 - Products table
```

### Backend Environment (SNS Alerts)

```
arn:aws:sns:ap-south-1:873828695513:ExpenseSNS
```

---

## 🎯 NEXT STEPS (In Order)

1. ✅ Go to Amplify Console
2. ✅ Update build settings (6 fields from table above)
3. ✅ Add environment variables (3 variables)
4. ✅ Click SAVE
5. ⏳ Wait for build (3-5 minutes)
6. ✅ Visit live URL
7. ✅ Test app (login → add product → check email alert)
8. ✅ Connect GitHub for auto-deploy

---

## 💡 TIPS

- Build takes **3-5 minutes** - be patient!
- Check **Build log** in Amplify if it fails
- Your **Lambda & DynamoDB are already live** in AWS
- **First deployment = manual** → After connecting GitHub, all auto!

---

## 🆘 HELP

If build fails:

1. Check build log in Amplify Console
2. Verify build settings match the table above
3. Ensure `frontend/dist/index.html` exists locally

If app doesn't work:

1. Check browser console (F12)
2. Verify API endpoint in logs
3. Check Lambda logs in CloudWatch

---

## ✨ YOU'RE ALMOST THERE!

**3 more minutes of setup = Your app LIVE! 🎉**

Go to Amplify Console and update those build settings now!
