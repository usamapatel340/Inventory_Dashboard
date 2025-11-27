# Complete AWS Deployment Guide - DynamoDB Auto-Save

Your AWS Account Details:

- **Account ID**: 873828695513
- **Region**: ap-south-1 (Mumbai)
- **Table Name**: Products
- **Cognito Pool**: ap-south-1_OxUvHWqx1

---

## Step 1: Create DynamoDB Table

### Option A: Using AWS Console (Easiest)

1. Go to https://console.aws.amazon.com/dynamodb
2. Click **Create table**
3. Fill in:
   - **Table name**: `Products`
   - **Partition key**: `id` (String)
   - **Sort key**: Leave empty
4. Under **Billing settings**, select **On-demand**
5. Click **Create table**
6. Wait for status to be "Active"

### Option B: Using AWS CLI

```powershell
aws dynamodb create-table `
  --table-name Products `
  --attribute-definitions AttributeName=id,AttributeType=S `
  --key-schema AttributeName=id,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region ap-south-1
```

---

## Step 2: Create IAM Role for Lambda

### Using AWS Console:

1. Go to https://console.aws.amazon.com/iam/home#/roles
2. Click **Create role**
3. Select **AWS service** → **Lambda** → Click **Next**
4. Search for and select these policies:
   - `AmazonDynamoDBFullAccess`
   - `AmazonSNSFullAccess`
5. Click **Next** → Give it a name: `LambdaInventoryRole`
6. Click **Create role**

### Copy the Role ARN:

1. In the IAM console, find the role you just created
2. Copy the **ARN** (looks like: `arn:aws:iam::873828695513:role/LambdaInventoryRole`)
3. **Save this ARN** - you'll need it for Lambda

---

## Step 3: Deploy Lambda Function

### Option A: Using AWS Console (Manual)

1. Go to https://console.aws.amazon.com/lambda
2. Click **Create function**
3. Fill in:
   - **Function name**: `inventory-handler`
   - **Runtime**: Node.js 20.x
   - **Role**: Select **Use an existing role** → `LambdaInventoryRole`
4. Click **Create function**
5. In the code editor:
   - Delete the default code
   - Copy the entire content from: `backend/lambda-handler.js`
   - Paste it into the editor
6. Click **Deploy**

### Set Environment Variables:

1. Scroll down to **Configuration** → **Environment variables**
2. Click **Edit** and add:
   - Key: `TABLE_NAME`, Value: `Products`
   - Key: `REGION`, Value: `ap-south-1`
3. Click **Save**

### Option B: Using AWS CLI

```powershell
# First, create a deployment package
cd backend
Compress-Archive -Path lambda-handler.js -DestinationPath lambda-function.zip -Force

# Deploy to Lambda
aws lambda create-function `
  --function-name inventory-handler `
  --runtime nodejs20.x `
  --role arn:aws:iam::873828695513:role/LambdaInventoryRole `
  --handler lambda-handler.handler `
  --zip-file fileb://lambda-function.zip `
  --region ap-south-1 `
  --environment Variables={TABLE_NAME=Products,REGION=ap-south-1}

cd ..
```

---

## Step 4: Create API Gateway

### Using AWS Console:

1. Go to https://console.aws.amazon.com/apigateway
2. Click **Create API** → **REST API** → **Build**
3. Fill in:
   - **API name**: `inventory-api`
   - **Description**: `Inventory Management API`
4. Click **Create API**

### Create Resources and Methods:

#### 1. Create `/products` Resource

1. In the API, right-click on `/` (root)
2. Click **Create resource**
3. Enter **Resource name**: `products`
4. Check **Enable API Gateway CORS**
5. Click **Create resource**

#### 2. Add GET method for `/products`

1. Select `/products` resource
2. Click **Create method** → **GET**
3. For **Integration type**, select **Lambda Function**
4. Enter function name: `inventory-handler`
5. Click **Save**
6. Click **Method Request** → Check **Authorization**: `AWS_IAM`

#### 3. Add POST method for `/products`

1. Select `/products` resource
2. Click **Create method** → **POST**
3. Select **Lambda Function** → `inventory-handler`
4. Save

#### 4. Create `/products/{id}` Resource

1. Select `/products`
2. Create resource → Name: `{id}`
3. Create methods: **GET**, **PUT**, **DELETE**
4. All pointing to `inventory-handler`

#### 5. Create `/products/{id}/quantity` Resource

1. Select `/products/{id}`
2. Create resource → Name: `quantity`
3. Add **PATCH** method → `inventory-handler`

#### 6. Create `/products/{id}/alert` Resource

1. Select `/products/{id}`
2. Create resource → Name: `alert`
3. Add **POST** method → `inventory-handler`

### Enable CORS on All Methods:

1. Select `/products`
2. Click **Actions** → **Enable CORS and replace CORS headers**
3. Click **Yes, replace existing values**
4. Repeat for all resources

### Deploy API:

1. Click **Deploy API**
2. Select **Stage**: `prod`
3. Click **Deploy**
4. **Copy the Invoke URL** (looks like: `https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod`)

---

## Step 5: Update Frontend Configuration

### Edit `frontend/src/awsConfig.js`:

Find this line:

```javascript
lambdaEndpoint: "http://localhost:3001",
```

Replace with your API Gateway URL:

```javascript
lambdaEndpoint: "https://YOUR_API_GATEWAY_URL/prod",
```

Example:

```javascript
lambdaEndpoint: "https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod",
```

---

## Step 6: Configure Cognito Authorization

### In Lambda Function:

The lambda-handler.js already includes authorization checking. It expects:

- Cognito User Pool: `ap-south-1_OxUvHWqx1`
- Authorization header with valid JWT token

### In API Gateway:

1. For each method, go to **Method Request**
2. Set **Authorization** to `AWS_IAM` or add custom authorizer
3. Or disable for testing: Click **Authorization** → **None**

---

## Step 7: Test the Deployment

1. Go to your frontend app: `http://localhost:60112`
2. Make sure you're logged in with Cognito
3. Try adding a product:
   - Click **Add Product**
   - Fill in details
   - Click **Save**

### If it fails:

1. Check browser DevTools (F12) → Console
2. Look for error messages
3. Check Lambda logs: https://console.aws.amazon.com/lambda/home#/functions/inventory-handler
4. Check CloudWatch logs for errors

---

## Complete Checklist

- [ ] DynamoDB table created and active
- [ ] IAM role created with DynamoDB + SNS permissions
- [ ] Lambda function deployed
- [ ] API Gateway created with all resources
- [ ] All methods created (GET, POST, PUT, DELETE, PATCH)
- [ ] CORS enabled
- [ ] API deployed to "prod" stage
- [ ] API Gateway URL copied
- [ ] Frontend awsConfig.js updated with API URL
- [ ] Frontend app tested with Add Product
- [ ] Products appearing in DynamoDB table

---

## Troubleshooting

### Products not saving?

1. Check browser console for errors
2. Verify API endpoint in awsConfig.js is correct
3. Check Lambda function logs in CloudWatch
4. Ensure DynamoDB table is active

### CORS errors?

1. Go back to API Gateway
2. Enable CORS on all resources and methods
3. Redeploy the API

### Authorization errors?

1. Make sure you're logged in with Cognito
2. Check that your token is valid
3. In API Gateway, temporarily set Authorization to "None" for testing

---

## Quick Command Reference

```powershell
# Check AWS CLI version
aws --version

# List DynamoDB tables
aws dynamodb list-tables --region ap-south-1

# List Lambda functions
aws lambda list-functions --region ap-south-1

# View Lambda logs
aws logs tail /aws/lambda/inventory-handler --follow --region ap-south-1
```

---

Once everything is deployed, your app will:
✅ Save products to **DynamoDB** automatically
✅ Load products from **DynamoDB** on startup
✅ Sync all changes in real-time
✅ Be production-ready!
