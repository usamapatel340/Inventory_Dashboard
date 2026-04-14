# Migration Checklist: DynamoDB to Firestore on Vercel

## Pre-Migration (Before Any Changes)

- [ ] **Backup DynamoDB data**
  - Export Products table to S3 or download JSON
  - Keep backup in safe location

- [ ] **Review current architecture**
  - Document all API endpoints
  - List all Lambda functions
  - Check SNS topics and subscriptions

## Firebase Setup (20 minutes)

- [ ] **Create Firebase Project**
  - Go to https://console.firebase.google.com/
  - Click "Add Project"
  - Name: "inventory-dashboard"
  - Disable Google Analytics

- [ ] **Create Firestore Database**
  - In Firebase Console: Build → Firestore Database
  - Create Database
  - Region: asia-south1
  - Mode: Production
  - Accept rules
  - Click Create

- [ ] **Update Firestore Security Rules**

  ```firestore
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /products/{document=**} {
        allow read: if true;
        allow write: if true;
      }
    }
  }
  ```

- [ ] **Create Products Collection**
  - Firestore Database → Create Collection
  - Collection ID: "products"
  - Add first document (optional)

- [ ] **Get Service Account JSON**
  - Project Settings (⚙️)
  - Service Accounts tab
  - Click "Generate New Private Key"
  - Save file: `firebase-service-account.json`

- [ ] **Setup Gmail App Password (for alerts)**
  - Go to https://myaccount.google.com/security
  - Enable 2-Step Verification
  - App passwords → Select Mail and Windows
  - Generate password (16 characters)
  - Save it

## Local Development Setup (10 minutes)

- [ ] **Copy environment template**

  ```bash
  cd backend
  cp .env.example .env.local
  ```

- [ ] **Update .env.local**
  - Paste Firebase service account JSON as FIREBASE_CONFIG
  - Set ALERT_EMAIL to your Gmail
  - Set ALERT_EMAIL_PASSWORD to your app password

- [ ] **Install dependencies**

  ```bash
  cd backend
  npm install
  ```

- [ ] **Test locally**

  ```bash
  # Option 1: Using Node directly
  npm start

  # Option 2: Using Vercel CLI
  npm install -g vercel
  vercel dev
  ```

## Data Migration (5-10 minutes)

- [ ] **Migrate DynamoDB data to Firestore**

  ```bash
  cd backend
  node migrate-dynamodb-to-firestore.js
  ```

  OR manually:
  - Export DynamoDB table to JSON
  - Upload documents to Firestore collection

- [ ] **Verify data in Firestore**
  - Firebase Console → Firestore Database
  - Check "products" collection
  - Verify document count matches DynamoDB

## Frontend Updates (5 minutes)

- [ ] **Update API imports in React components**

  ```javascript
  // Change from:
  import productApi from "./api.js";

  // To:
  import productApi from "./vercelApi.js";
  ```

- [ ] **Update all API calls**
  - The endpoint format stays the same
  - Base URL will be set by environment variable

- [ ] **Test locally**
  ```bash
  cd frontend
  npm install
  npm start
  ```

## Deploy to Vercel (15 minutes)

- [ ] **Connect GitHub to Vercel**
  - Push code to GitHub
  - Go to https://vercel.com/new
  - Select repository
  - Click Import

- [ ] **Configure Vercel project**
  - Framework: Other
  - Root Directory: .
  - Build Command: `npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend`
  - Output Directory: `frontend/dist`

- [ ] **Add Environment Variables in Vercel**
  - Project Settings → Environment Variables
  - Add:
    ```
    FIREBASE_CONFIG={"type":"service_account",...}
    ALERT_EMAIL=your-email@gmail.com
    ALERT_EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
    ```
  - Save

- [ ] **Deploy**
  - Vercel will auto-deploy on push
  - Wait for build to complete
  - Check deployment URL

## Post-Deployment Testing (10 minutes)

- [ ] **Test API endpoints**

  ```bash
  # Get all products
  curl https://your-project.vercel.app/api/products

  # Create product
  curl -X POST https://your-project.vercel.app/api/products \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","sku":"TEST1","qty":10,"threshold":5}'
  ```

- [ ] **Test frontend**
  - Visit https://your-project.vercel.app
  - Create a product
  - Update quantity
  - Search products
  - Delete product

- [ ] **Test email alerts**
  - Create product with email contact
  - Lower quantity below threshold
  - Check email inbox

- [ ] **Monitor Firestore**
  - Firebase Console → Firestore Database
  - Watch for new documents
  - Check read/write counts

## Cleanup (Optional)

- [ ] **Disable AWS Lambda functions**
  - Keep Lambda functions (in case needed)
  - Update SNS to not trigger as often

- [ ] **Monitor AWS costs**
  - Set billing alerts
  - Verify no unexpected charges

- [ ] **Delete DynamoDB table** (after confirmation all works)
  - Keep backups before deletion
  - DynamoDB → Tables → Delete

## Troubleshooting

If you encounter issues, check:

### Build Failures

- [ ] Node version is 18+
- [ ] All npm packages installed: `npm install`
- [ ] Environment variables are set in Vercel

### Runtime Errors

- [ ] FIREBASE_CONFIG is valid JSON string
- [ ] Gmail 2FA is enabled
- [ ] App password is recent (regenerate if needed)
- [ ] Firestore collection is named "products"

### API Errors

- [ ] Check Vercel logs: `vercel logs`
- [ ] Verify endpoint format: `/api/products`
- [ ] Check CORS headers in Firestore backend

### Firestore Quota

- [ ] Monitor reads/writes in Firebase Console
- [ ] Upgrade to Blaze plan if exceeding free tier

## Success Indicators

✅ **You know migration is successful when:**

1. Firestore has all your products from DynamoDB
2. API endpoints respond from Vercel
3. Frontend loads and fetches products
4. Email alerts send correctly
5. You don't see any Lambda invocations in CloudWatch

## Next Steps

1. ✅ Archive this checklist
2. ✅ Set up monitoring for Firestore
3. ✅ Configure domain (optional)
4. ✅ Set up CI/CD for auto-deployments
5. ✅ Monitor costs and usage

## Support

- **Firebase Issues**: https://console.firebase.google.com → Firestore Database → Monitoring
- **Vercel Issues**: https://vercel.com/dashboard → your-project → Deployments
- **Code Issues**: Check `FIRESTORE_SETUP.md` and `FIRESTORE_MIGRATION.md`

---

**Status**: Ready to start migration! 🚀
**Estimated Time**: 60-90 minutes total
**Cost After Migration**: $0 (free tier)
