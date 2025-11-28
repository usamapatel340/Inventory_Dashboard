# AWS Amplify Deployment Guide - Inventory Dashboard

## Overview

This guide walks you through deploying your React inventory dashboard to AWS Amplify with automatic CI/CD, hosting, and backend integration.

---

## Prerequisites

- Git installed and your project pushed to GitHub (✅ Done)
- AWS Account (873828695513)
- Amplify CLI installed
- Node.js 18+ installed

---

## Step 1: Install Amplify CLI

```powershell
npm install -g @aws-amplify/cli
```

Verify installation:

```powershell
amplify --version
```

---

## Step 2: Configure Amplify CLI

```powershell
amplify configure
```

Follow the prompts:

1. Region: **ap-south-1** (Mumbai)
2. Username: Create an IAM user (or use existing)
3. Complete AWS Console login
4. Create access key

---

## Step 3: Initialize Amplify in Your Project

Navigate to your project root:

```powershell
cd "c:\Users\usama\OneDrive\Desktop\Project_Invent"
amplify init
```

When prompted, provide:

- **Project name**: `inventory-dashboard`
- **Environment name**: `prod`
- **Default editor**: None (just press Enter)
- **App type**: JavaScript
- **JavaScript framework**: React
- **Source directory path**: `frontend/src`
- **Distribution directory path**: `frontend/dist`
- **Build command**: `npm run build --prefix frontend`
- **Start command**: `npm run start --prefix frontend`
- **Deploy to AWS Console?**: Yes (optional)

---

## Step 4: Add Hosting to Amplify

```powershell
amplify add hosting
```

Choose:

- **Hosting service**: Amplify Hosting
- **Environment**: `prod`
- **Deploy amplify app**: Yes

---

## Step 5: Add Backend (Lambda + API)

### Add API (REST)

```powershell
amplify add api
```

Choose:

- **API service**: REST
- **Provide API name**: `inventoryapi`
- **Provide a resource path**: `/products`
- **Choose a Lambda source**: **Create a new Lambda function**
- **Provide a friendly name**: `inventoryHandler`
- **Provide the Lambda function name**: `inventory-handler`
- **Choose the runtime**: Node.js 20.x
- **Do you want to add another path?**: No

This creates an API Gateway and Lambda function managed by Amplify.

---

## Step 6: Replace Lambda Handler

Amplify creates a default Lambda. Replace it with your handler:

1. Find the generated Lambda file:

   ```powershell
   Get-ChildItem "amplify/backend/function/inventoryHandler/src" -Recurse
   ```

2. Copy your handler code to the Lambda directory:

   ```powershell
   Copy-Item "backend/lambda-handler.js" "amplify/backend/function/inventoryHandler/src/index.js" -Force
   ```

3. Update the handler export if needed (Amplify uses `handler` export)

---

## Step 7: Add DynamoDB Resource

```powershell
amplify add storage
```

Choose:

- **Select from one of the below services**: DynamoDB
- **Provide a friendly name for resource**: `inventorytable`
- **Table name**: `Products`
- **Add a sort key?**: No
- **Attributes for this table**:
  - Partition key: `product_id` (String)
- **Add more attributes?**: Yes
  - Add: `name` (String)
  - Add: `qty` (Number)
  - Add: `threshold` (Number)
  - Add: `sku` (String)
  - Add: `contact` (String)
  - Add: `autoAlert` (String)
  - Done
- **Add Global Secondary Indexes?**: No

---

## Step 8: Add SNS for Alerts

```powershell
amplify add analytics
```

Or manually add SNS in `amplify/backend/storage/`:

Create `sns-resource.json` (or use console to add SNS topic):

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "SNS Topic for inventory alerts",
  "Resources": {
    "InventoryAlertsTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": "ExpenseSNS"
      }
    }
  },
  "Outputs": {
    "TopicArn": {
      "Value": { "Ref": "InventoryAlertsTopic" }
    }
  }
}
```

---

## Step 9: Update Frontend Configuration

### Update `frontend/src/amplifyConfig.js`:

```javascript
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";

Amplify.configure(awsconfig);

export default awsconfig;
```

### Update `frontend/src/awsConfig.js`:

After `amplify init`, your API endpoint will be in `aws-exports.js`. Update:

```javascript
// In awsConfig.js or use aws-exports directly
const API_BASE_URL =
  "https://your-api-id.execute-api.ap-south-1.amazonaws.com/prod";
// OR better: import from aws-exports
```

The Amplify CLI generates `aws-exports.js` automatically with your API endpoint.

---

## Step 10: Update Dependencies

Add Amplify to frontend `package.json`:

```powershell
cd frontend
npm install aws-amplify @aws-amplify/ui-react
cd ..
```

---

## Step 11: Deploy to Amplify

```powershell
amplify push
```

Amplify will:

1. Ask to create IAM roles
2. Deploy DynamoDB table
3. Deploy Lambda function
4. Create/configure API Gateway
5. Set up hosting

This typically takes 5-10 minutes.

---

## Step 12: Enable Hosting

After `amplify push`, enable hosting:

```powershell
amplify publish
```

This:

1. Builds your React app
2. Uploads to S3
3. Deploys through CloudFront CDN
4. Gives you a live URL

---

## Step 13: Set Up CI/CD Pipeline

### Connect GitHub to Amplify Console:

1. Go to: https://console.amplify.aws/
2. Click **Hosting environments** → **Create app**
3. Select **GitHub** as source
4. Authorize and select your repository: `usamapatel340/Inventory_Dashboard`
5. Choose branch: `main`
6. Amplify creates a build spec automatically

### Build Settings (if needed):

Create `amplify.yml` in project root:

```yaml
version: 1

frontend:
  phases:
    install:
      commands:
        - npm install
        - cd frontend && npm install && cd ..
        - cd backend && npm install && cd ..
    build:
      commands:
        - cd frontend && npm run build && cd ..
  artifacts:
    baseDirectory: frontend/dist
    files:
      - "**/*"
  cache:
    paths:
      - "node_modules/**/*"
      - "frontend/node_modules/**/*"
      - "backend/node_modules/**/*"
```

---

## Step 14: Environment Variables

Add environment variables in Amplify Console:

1. **App settings** → **Environment variables**
2. Add:
   - `REACT_APP_API_ENDPOINT`: Your Lambda API endpoint
   - `REACT_APP_REGION`: `ap-south-1`
   - `REACT_APP_COGNITO_POOL_ID`: `ap-south-1_OxUvHWqx1`

---

## Step 15: Configure Domain (Optional)

In Amplify Console:

1. **Domain management** → **Add domain**
2. Add custom domain or use Amplify's domain

---

## Complete Deployment Checklist

- [ ] Amplify CLI installed
- [ ] Project pushed to GitHub
- [ ] `amplify init` completed
- [ ] Hosting added with `amplify add hosting`
- [ ] API added with `amplify add api`
- [ ] Lambda handler replaced with your code
- [ ] DynamoDB table added with `amplify add storage`
- [ ] SNS topic configured
- [ ] `amplify push` completed
- [ ] `amplify publish` completed
- [ ] Live URL from Amplify Console working
- [ ] Products saving to DynamoDB
- [ ] SNS alerts sending emails
- [ ] GitHub connected for CI/CD (optional)

---

## Quick Commands Reference

```powershell
# Initialize Amplify
amplify init

# Add resources (API, Database, Storage, etc.)
amplify add api
amplify add storage
amplify add auth

# Deploy all changes
amplify push

# Publish to hosting
amplify publish

# View status
amplify status

# Delete resources (careful!)
amplify delete

# View logs
amplify logs

# Pull backend from cloud
amplify pull
```

---

## Your Final Architecture

```
Frontend (React)
    ↓ (Amplify Hosting - CloudFront CDN)
    ↓
Amplify Console (CI/CD)
    ↓
API Gateway (REST API)
    ↓
Lambda Function (inventory-handler)
    ↓
DynamoDB (Products table)
    ↓
SNS (Email alerts)
```

---

## Testing After Deployment

1. **Visit your Amplify URL** (provided after `amplify publish`)
2. **Login with Cognito**
3. **Add a product** and verify it saves to DynamoDB
4. **Set quantity below threshold** and verify SNS email arrives
5. **Check CloudWatch logs** if issues occur

---

## Troubleshooting Amplify Deployment

### Build fails?

```powershell
amplify logs
```

### Can't connect to API?

1. Check `aws-exports.js` has correct API endpoint
2. Verify Lambda has DynamoDB permissions
3. Check CORS settings in API Gateway

### DynamoDB not working?

```powershell
amplify override storage
# Edit and redeploy
amplify push
```

### Need to rollback?

```powershell
amplify env remove prod
amplify init
```

---

## Your Live Application

Once deployed, your app will be live at:

```
https://your-app-id.amplifyapp.com
```

All changes pushed to GitHub `main` branch will auto-deploy within 2-3 minutes!

---

## Next Steps

1. Run: `amplify init`
2. Follow the prompts
3. Run: `amplify push`
4. Run: `amplify publish`
5. Share your live URL!
