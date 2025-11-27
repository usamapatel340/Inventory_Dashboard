# AWS Manual Setup Guide

Your AWS credentials are invalid or not configured. Please follow these steps:

## 1. Configure AWS CLI Credentials

Open PowerShell and run:

```powershell
aws configure
```

When prompted, enter:

- AWS Access Key ID: [Your access key]
- AWS Secret Access Key: [Your secret key]
- Default region: ap-south-1
- Default output format: json

Get your AWS credentials from: AWS Console → My Security Credentials → Access Keys

## 2. Verify Configuration

```powershell
aws sts get-caller-identity
```

Should return your account ID: 873828695513

## 3. Then Run Deployment

```powershell
cd "c:\Users\usama\OneDrive\Desktop\Project_Invent"
powershell -ExecutionPolicy Bypass -File deploy-aws.ps1
```

---

## Alternative: Manual AWS Console Setup

If CLI doesn't work, do this manually:

### Step 1: Create DynamoDB Table

1. Go to AWS Console → DynamoDB (ap-south-1)
2. Click "Create table"
3. Table name: Products
4. Partition key: id (String)
5. Billing: On-demand
6. Click Create

### Step 2: Create Lambda Function

1. Go to AWS Lambda (ap-south-1)
2. Create function:
   - Name: InventoryBackend
   - Runtime: Node.js 18.x
3. Copy code from: backend/lambda-handler.js
4. Paste into Lambda editor
5. Click Deploy

### Step 3: Set Lambda Permissions

1. Lambda → Configuration → Permissions
2. Add inline policy:
   - DynamoDB access to Products table
   - SNS publish access

### Step 4: Create API Gateway

1. API Gateway console (ap-south-1)
2. Create REST API: InventoryAPI
3. Create resource: /products
4. Create methods: GET, POST
5. Create resource: /products/{id}
6. Create methods: GET, PUT, DELETE
7. Create resource: /products/{id}/quantity
8. Create method: PATCH
9. Link all to Lambda
10. Enable CORS
11. Deploy to "prod"
12. Copy Invoke URL

### Step 5: Update Frontend

Edit: `frontend/src/awsConfig.js`

Replace:

```javascript
lambdaEndpoint: "http://localhost:3001",
```

With your Invoke URL:

```javascript
lambdaEndpoint: "https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod",
```

### Step 6: Test

```bash
npm start
```

Login and try adding a product. It should save to DynamoDB!
