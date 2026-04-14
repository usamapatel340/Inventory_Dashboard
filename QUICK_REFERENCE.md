# Quick Reference: Firestore + Vercel Migration

## Architecture Diagram

### Before (AWS)

```
┌─────────────────┐
│   React App     │
│   (Amplify)     │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────┐
│  API Gateway (AWS)      │
│  ap-south-1             │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐      ┌──────────────────┐
│  Lambda Functions        │      │  SNS Topic       │
│  (lambda-handler.js)     │─────▶│  (Email alerts)  │
└────────┬─────────────────┘      └──────────────────┘
         │
         ▼
┌──────────────────────────┐
│  DynamoDB                │
│  (Products table)        │
│  ap-south-1              │
└──────────────────────────┘
```

### After (Google Cloud + Vercel)

```
┌─────────────────┐
│   React App     │
│   (Vercel)      │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────┐
│  Vercel Functions       │
│  (api/handler.js)       │
│  Edge Network (Global)  │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐      ┌──────────────────────┐
│  Firebase Admin SDK      │      │  Gmail SMTP          │
│  (lambda-handler.js)     │─────▶│  (Email alerts)      │
└────────┬─────────────────┘      └──────────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Firestore               │
│  (products collection)   │
│  asia-south1             │
└──────────────────────────┘
```

## Quick Commands

### Setup

```bash
# Clone and install
git clone <your-repo>
cd Project_Invent

# Install dependencies
npm install --prefix backend
npm install --prefix frontend

# Setup environment
cd backend
cp .env.example .env.local
# Edit .env.local with Firebase credentials
```

### Local Testing

```bash
# Start Vercel dev server
vercel dev

# Test API
curl http://localhost:3000/api/products
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Product","sku":"SKU1","qty":100}'

# View logs
vercel logs
```

### Data Migration

```bash
# Migrate from DynamoDB to Firestore
node backend/migrate-dynamodb-to-firestore.js
```

### Deployment

```bash
# Push to GitHub
git add .
git commit -m "Migrate to Firestore + Vercel"
git push

# Or deploy directly
npm install -g vercel
vercel deploy --prod
```

## Environment Variables

### Local (.env.local)

```
FIREBASE_CONFIG='{"type":"service_account",...}'
ALERT_EMAIL=your-email@gmail.com
ALERT_EMAIL_PASSWORD=app-password-here
```

### Vercel Dashboard

```
Project Settings → Environment Variables → Add:
- FIREBASE_CONFIG
- ALERT_EMAIL
- ALERT_EMAIL_PASSWORD
```

## API Endpoints Reference

| Method | Endpoint                | Body                | Returns         |
| ------ | ----------------------- | ------------------- | --------------- |
| GET    | `/api/products`         | -                   | All products    |
| GET    | `/api/products/{id}`    | -                   | Single product  |
| POST   | `/api/products`         | Product data        | Created product |
| PUT    | `/api/products/{id}`    | Product data        | Updated product |
| DELETE | `/api/products/{id}`    | -                   | {success: true} |
| PATCH  | `/api/quantity`         | {product_id, delta} | Updated product |
| GET    | `/api/low-stock`        | -                   | Low stock items |
| GET    | `/api/search?q=keyword` | -                   | Search results  |
| POST   | `/api/alert`            | {product_id}        | {success: true} |

## Frontend API Usage

### Old (AWS)

```javascript
import productApi from "./api.js";

const products = await productApi.getAll();
```

### New (Vercel)

```javascript
import productApi from "./vercelApi.js";

const products = await productApi.getAll();
// Same interface, no code changes needed!
```

## Monitoring

### Firestore Stats

- **Location**: Firebase Console → Firestore Database → Stats
- **Key Metrics**:
  - Documents count
  - Storage size
  - Read/Write operations
- **Free Tier Limits**:
  - 50,000 reads/day
  - 20,000 writes/day
  - 1GB storage

### Vercel Stats

- **Location**: Vercel Dashboard → your-project → Analytics
- **Key Metrics**:
  - Request count
  - Edge network usage
  - Function execution time
  - Build status
- **Free Tier Limits**:
  - 100GB bandwidth/month
  - 12 serverless functions
  - Unlimited builds (if using GitHub)

### Error Tracking

```bash
# View Vercel logs
vercel logs --prod

# Watch for errors
vercel logs --prod --follow

# Check specific deployment
vercel logs <DEPLOYMENT_ID>
```

## Troubleshooting Quick Fixes

| Problem                             | Solution                                        |
| ----------------------------------- | ----------------------------------------------- |
| "Firebase not initialized"          | Check FIREBASE_CONFIG env var                   |
| "Cannot read property 'collection'" | Verify service account JSON valid               |
| "Collection not found"              | Create "products" collection in Firestore       |
| "Email failed to send"              | Check Gmail 2FA and app password                |
| "API 404"                           | Verify endpoint path `/api/...`                 |
| "Build fails on Vercel"             | Check Node version 18+, run `npm install`       |
| "Firestore quota exceeded"          | Upgrade to Blaze plan or optimize queries       |
| "CORS errors"                       | Check backend CORS headers in lambda-handler.js |

## Performance Notes

### Before (AWS)

- Cold start: 500ms - 3s
- Lightning pricing model
- Regional latency (Mumbai region)

### After (Vercel)

- Cold start: 100-500ms
- Edge network (50+ regions)
- Global latency improved
- Fixed costs (mostly FREE!)

## Cost Breakdown

| Service       | Before                   | After                       |
| ------------- | ------------------------ | --------------------------- |
| Compute       | Lambda $0.20/1M req      | Vercel FREE                 |
| Database      | DynamoDB $1.25/1M writes | Firestore FREE (50k writes) |
| Notifications | SNS $0.50/1M req         | Gmail FREE                  |
| **Monthly**   | **~$20-50**              | **~$0**                     |

## Deployment Workflow

```bash
# 1. Make changes locally
git checkout -b feature/something

# 2. Test locally
vercel dev
# Test your changes...

# 3. Commit and push
git add .
git commit -m "Feature: something"
git push origin feature/something

# 4. Create Pull Request on GitHub

# 5. Vercel auto-deploys preview
# Check preview URL in PR

# 6. Merge PR
git checkout main
git merge feature/something
git push origin main

# 7. Vercel auto-deploys to production
# Watch deployment in Vercel dashboard
```

## Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Vercel Documentation](https://vercel.com/docs)
- [Backend Code](./backend/lambda-handler.js)
- [Frontend API](./frontend/src/vercelApi.js)
- [Setup Guide](./FIRESTORE_SETUP.md)
- [Migration Checklist](./MIGRATION_CHECKLIST.md)

## One-Liner Commands

```bash
# Copy env template
cp backend/.env.example backend/.env.local

# Install all dependencies
npm install --prefix backend && npm install --prefix frontend

# Migrate data
node backend/migrate-dynamodb-to-firestore.js

# Deploy
git push && vercel deploy --prod

# View logs
vercel logs --prod --follow

# Test API
curl https://your-project.vercel.app/api/products
```

---

**Start here**: Read `MIGRATION_CHECKLIST.md` → Follow each step → Deploy! 🚀
