# Firestore Migration Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a Project"
3. Enter your project name (e.g., "inventory-dashboard")
4. Enable Google Analytics (optional)
5. Create the project

## Step 2: Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create Database**
3. Choose region: **asia-south1** (closest to your previous ap-south-1)
4. Start in **Production mode**
5. Click **Create**

## Step 3: Set Firestore Security Rules

Go to **Firestore Database** → **Rules** and replace with:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /products/{document=**} {
      allow read, write: if request.auth != null;
    }

    // For testing only (remove in production)
    // match /{document=**} {
    //   allow read, write: if true;
    // }
  }
}
```

## Step 4: Get Service Account JSON

1. Go to **Project Settings** (⚙️ icon)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file
5. Copy its contents (you'll paste this as FIREBASE_CONFIG environment variable)

## Step 5: Create Firestore Collection

In **Firestore Database**, create a collection named `products` with this document structure:

```json
{
  "name": "Product Name",
  "sku": "SKU123",
  "qty": 100,
  "threshold": 20,
  "autoAlert": true,
  "contact": "email@example.com",
  "price": 99.99,
  "category": "Electronics",
  "history": [
    {
      "type": "restock",
      "qtyChange": 50,
      "ts": "2026-04-14T10:00:00Z"
    }
  ],
  "createdAt": "2026-04-14T10:00:00Z",
  "updatedAt": "2026-04-14T10:00:00Z"
}
```

## Step 6: Set Up Environment Variables

### Local Development

Create `.env.local` in the `backend/` directory:

```bash
FIREBASE_CONFIG='{"type":"service_account","project_id":"your-project-id","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

ALERT_EMAIL=your-email@gmail.com
ALERT_EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### Vercel Production

1. Go to your Vercel project settings
2. Click **Environment Variables**
3. Add:
   - `FIREBASE_CONFIG`: Paste the entire service account JSON (stringified)
   - `ALERT_EMAIL`: Your Gmail address
   - `ALERT_EMAIL_PASSWORD`: Your Gmail App Password

## Step 7: Gmail App Password Setup (for alerts)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go back to Security tab
4. Find **App passwords** option
5. Select "Mail" and "Windows Computer" (or your device)
6. Google will generate a 16-character password
7. Use this password in `ALERT_EMAIL_PASSWORD`

## Step 8: Migration Checklist

- [ ] Firebase project created
- [ ] Firestore database created
- [ ] Service account JSON downloaded
- [ ] Products collection created
- [ ] Security rules set
- [ ] Environment variables configured locally
- [ ] `npm install` in backend/ directory
- [ ] Test locally with `npm start`
- [ ] Deploy to Vercel
- [ ] Set environment variables in Vercel
- [ ] Test API endpoints

## Step 9: API Endpoints

The Firestore backend supports the same endpoints:

```bash
# Get all products
GET /api/products

# Get single product
GET /api/products/{productId}

# Create product
POST /api/products
Body: { name, sku, qty, threshold, autoAlert, contact, ... }

# Update product
PUT /api/products/{productId}
Body: { name, sku, qty, ... }

# Update quantity
PATCH /api/quantity
Body: { product_id: "xxx", delta: 10 }

# Get low stock
GET /api/low-stock

# Search products
GET /api/search?q=keyword

# Send alert
POST /api/alert
Body: { product_id: "xxx" }
```

## Step 10: Deployment to Vercel

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
vercel deploy --prod
```

## Troubleshooting

### "Firebase initialization error"

- Check `FIREBASE_CONFIG` environment variable is set correctly
- Ensure the JSON is properly stringified (no newlines)

### "Permission denied" errors

- Check Firestore security rules
- Verify service account has proper permissions
- For testing, temporarily allow all reads/writes

### "Email failed to send"

- Verify Gmail App Password is correct
- Check 2FA is enabled on Gmail account
- Verify `ALERT_EMAIL` is correct

### Firestore quota issues

- Free tier: 50k reads/day, 20k writes/day
- Monitor usage in Firebase Console
- Consider upgrading to Blaze if needed

## Cost Estimation

**Firebase Firestore Pricing (Free Tier)**:

- First 1GB stored: Free
- First 50k reads/day: Free
- First 20k writes/day: Free
- First 20k deletes/day: Free
- Outbound bandwidth: First 1GB/month free

**Gmail App Passwords**: Free

**Total**: $0 for small projects! ✨
