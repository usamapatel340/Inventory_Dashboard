# AWS Deployment Guide - Inventory Tracking Dashboard

## Table of Contents

1. [Lambda Function Setup](#lambda-function-setup)
2. [API Gateway Configuration](#api-gateway-configuration)
3. [DynamoDB Setup](#dynamodb-setup)
4. [SNS Configuration](#sns-configuration)
5. [Testing](#testing)
6. [Deployment Checklist](#deployment-checklist)

---

## Lambda Function Setup

### Step 1: Create Lambda Function

1. **Open AWS Lambda Console** → ap-south-1 region
2. Click **Create function**
3. Fill in details:
   - **Function name:** `InventoryBackend`
   - **Runtime:** Node.js 18.x
   - **Architecture:** x86_64
   - **Execution role:** Create new role
     - **Role name:** `inventory-lambda-role`

### Step 2: Configure IAM Role

1. In Lambda creation, go to **Change default execution role** → **Create new role from AWS policy templates**
2. **Role name:** `inventory-lambda-role`
3. **Policy templates:** Select `Simple microservice permissions`
4. After role creation, add inline policy for SNS:
   - Go to IAM console → Roles → `inventory-lambda-role`
   - **Add inline policy:**
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "dynamodb:GetItem",
             "dynamodb:Query",
             "dynamodb:Scan",
             "dynamodb:PutItem",
             "dynamodb:UpdateItem",
             "dynamodb:DeleteItem",
             "dynamodb:BatchGetItem",
             "dynamodb:BatchWriteItem"
           ],
           "Resource": "arn:aws:dynamodb:ap-south-1:873828695513:table/Products"
         },
         {
           "Effect": "Allow",
           "Action": ["sns:Publish"],
           "Resource": "*"
         }
       ]
     }
     ```

### Step 3: Upload Code

1. **In Lambda editor:**

   - Copy entire `backend/lambda-handler.js` content
   - Paste into index.js
   - Click **Deploy**

2. **Configure timeout & memory:**
   - **General configuration** → Memory: 512 MB, Timeout: 30 seconds
   - Click **Save**

### Step 4: Environment Variables (Optional)

1. **Configuration** → **Environment variables** → **Edit**
2. Add:
   - `DYNAMODB_TABLE: Products`
   - `AWS_REGION: ap-south-1`
   - Click **Save**

---

## API Gateway Configuration

### Step 1: Create REST API

1. **Open AWS API Gateway** → **Create API**
2. Choose **REST API** (not HTTP API)
3. **API name:** `InventoryAPI`
4. **Endpoint type:** Regional
5. Click **Create API**

### Step 2: Create Resources & Methods

**Resource 1: /products**

1. Click **Create Resource**
2. **Resource name:** `products`
3. **Resource path:** `/products`
4. Click **Create Resource**

**Methods for /products:**

- **GET /products**

  - Click **Create method** → GET
  - **Integration type:** Lambda Function
  - **Lambda Region:** ap-south-1
  - **Lambda Function:** InventoryBackend
  - Click **Save**
  - Go to **Method Request** → **Add Authorization Header**

- **POST /products**
  - Click **Create method** → POST
  - Same setup as GET
  - Click **Save**

**Resource 2: /products/{id}**

1. Select `/products` resource
2. Click **Create Resource**
3. **Resource name:** `{id}`
4. **Resource path:** `{id}`
5. Click **Create Resource**

**Methods for /products/{id}:**

- **GET /products/{id}** → Lambda (same as above)
- **PUT /products/{id}** → Lambda
- **DELETE /products/{id}** → Lambda
- **PATCH /products/{id}** → Lambda

**Resource 3: /products/{id}/quantity**

1. Select `/products/{id}` resource
2. Click **Create Resource**
3. **Resource name:** `quantity`
4. **Resource path:** `quantity`
5. Click **Create Resource**

**Method: PATCH /products/{id}/quantity**

- Click **Create method** → PATCH
- **Integration type:** Lambda Function
- **Lambda Function:** InventoryBackend
- Click **Save**

### Step 3: Enable CORS

1. Select `/products` resource
2. Click **Enable CORS and replace CORS headers**
3. **Access-Control-Allow-Headers:** `Authorization,Content-Type`
4. Click **Replace CORS headers and methods**
5. Repeat for `/products/{id}` and `/products/{id}/quantity`

### Step 4: Deploy API

1. Click **Deploy**
2. **Deployment stage:** Create new stage → `prod`
3. Click **Deploy**
4. **Note the Invoke URL:** (e.g., `https://abc123.execute-api.ap-south-1.amazonaws.com/prod`)

### Step 5: Test API

```bash
# Set variables
$API_URL = "https://abc123.execute-api.ap-south-1.amazonaws.com/prod"
$TOKEN = "your_cognito_token_here"

# Get all products
curl -X GET "$API_URL/products" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json"
```

---

## DynamoDB Setup

### Step 1: Create Table (if not exists)

1. **Open AWS DynamoDB** → **Create table**
2. **Table name:** `Products`
3. **Partition key:** `id` (String)
4. **Billing mode:** On-demand
5. Click **Create table**

### Step 2: Verify Table ARN

Table ARN should be: `arn:aws:dynamodb:ap-south-1:873828695513:table/Products`

### Step 3: Add Sample Data

Use AWS CLI or DynamoDB console:

```powershell
# Install AWS CLI if not present
# aws --version

# Add sample product
aws dynamodb put-item `
  --table-name Products `
  --item '{
    "id": {"S": "p001"},
    "name": {"S": "Laptop Dell XPS 13"},
    "sku": {"S": "LP-DXP13"},
    "qty": {"N": "5"},
    "threshold": {"N": "3"},
    "contact": {"S": "user@example.com"},
    "autoAlert": {"BOOL": true},
    "history": {"L": []},
    "createdAt": {"N": "1234567890"},
    "updatedAt": {"N": "1234567890"}
  }' `
  --region ap-south-1
```

Or use **Items** tab in DynamoDB console to add manually.

### Step 4: Enable Point-in-Time Recovery (Recommended)

1. **Table** → **Backups** tab
2. **Enable** point-in-time recovery
3. Retention: 35 days

---

## SNS Configuration

### Step 1: Create SNS Topic

1. **Open AWS SNS** → **Create topic**
2. **Type:** Standard
3. **Name:** `inventory-alerts`
4. Click **Create topic**
5. **Note the Topic ARN:** `arn:aws:sns:ap-south-1:873828695513:inventory-alerts`

### Step 2: Create Email Subscription

1. In topic details → **Create subscription**
2. **Protocol:** Email
3. **Endpoint:** your-email@example.com
4. Click **Create subscription**
5. **Confirm** subscription in your email inbox

### Step 3: Update Lambda Code

Update `lambda-handler.js` with your topic ARN:

```javascript
const topicArn = "arn:aws:sns:ap-south-1:873828695513:inventory-alerts";
```

### Step 4: Test SNS

```bash
aws sns publish \
  --topic-arn arn:aws:sns:ap-south-1:873828695513:inventory-alerts \
  --subject "Test Alert" \
  --message "This is a test message" \
  --region ap-south-1
```

---

## Testing

### Integration Test Checklist

#### Frontend

- [ ] Sign in with Cognito credentials
- [ ] Email displays in header
- [ ] localStorage fallback works (check DevTools)

#### API Endpoints (with Lambda deployed)

**Test 1: Get Products**

```bash
curl -X GET "https://your-api.amazonaws.com/prod/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Test 2: Create Product**

```bash
curl -X POST "https://your-api.amazonaws.com/prod/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TP-001",
    "qty": 100,
    "threshold": 10,
    "contact": "test@example.com",
    "autoAlert": true
  }'
```

**Test 3: Update Quantity**

```bash
curl -X PATCH "https://your-api.amazonaws.com/prod/products/p001/quantity" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delta": -5}'
```

**Test 4: Send Alert**

```bash
curl -X POST "https://your-api.amazonaws.com/prod/products/p001/alert" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Frontend Testing

1. **Update `frontend/src/awsConfig.js`:**

   ```javascript
   export const awsConfig = {
     region: "ap-south-1",
     lambdaEndpoint: "https://your-api.amazonaws.com/prod",
     tableArn: "arn:aws:dynamodb:ap-south-1:873828695513:table/Products",
     tableName: "Products",
     accountId: "873828695513",
   };
   ```

2. **Update `frontend/src/api.js`:**

   ```javascript
   const useBackend = true; // Enable backend
   ```

3. **Restart dev server:**

   ```powershell
   npm start
   ```

4. **Test operations:**
   - Add product → Should appear in DynamoDB
   - Adjust quantity → Should trigger auto-alert
   - View history → Should show all transactions

### CloudWatch Logs

Monitor Lambda execution:

```bash
# View recent logs
aws logs tail /aws/lambda/InventoryBackend --follow --region ap-south-1
```

---

## Deployment Checklist

- [ ] **Lambda Function**

  - [ ] Created in ap-south-1
  - [ ] Code deployed from `backend/lambda-handler.js`
  - [ ] IAM role has DynamoDB + SNS permissions
  - [ ] Timeout set to 30 seconds
  - [ ] Memory set to 512 MB

- [ ] **API Gateway**

  - [ ] REST API created
  - [ ] Resources: `/products`, `/products/{id}`, `/products/{id}/quantity`
  - [ ] Methods: GET, POST, PUT, DELETE, PATCH
  - [ ] CORS enabled with Authorization header
  - [ ] Deployed to `prod` stage
  - [ ] Invoke URL copied and saved

- [ ] **DynamoDB**

  - [ ] Table `Products` exists
  - [ ] Partition key: `id` (String)
  - [ ] On-demand billing enabled
  - [ ] Sample data added
  - [ ] Point-in-time recovery enabled

- [ ] **SNS**

  - [ ] Topic `inventory-alerts` created
  - [ ] Email subscription confirmed
  - [ ] Topic ARN updated in Lambda code
  - [ ] Test alert sent successfully

- [ ] **Frontend Configuration**

  - [ ] `awsConfig.js` updated with Lambda endpoint
  - [ ] `api.js` has `useBackend = true`
  - [ ] Cognito config verified
  - [ ] Dependencies installed

- [ ] **Testing**
  - [ ] Can sign in with Cognito
  - [ ] Can create product via API
  - [ ] Product appears in DynamoDB
  - [ ] Stock adjustment triggers alert
  - [ ] History logged correctly
  - [ ] Email alert received

---

## Cost Estimation (Monthly)

| Service         | Free Tier         | Usage           | Est. Cost |
| --------------- | ----------------- | --------------- | --------- |
| **Lambda**      | 1M requests       | 500k requests   | $0-2      |
| **DynamoDB**    | 25 GB             | On-demand       | $1-5      |
| **API Gateway** | 1M calls          | 500k calls      | $1-2      |
| **SNS**         | 1000 emails       | 100 alerts      | $0-1      |
| **CloudWatch**  | Included          | Logs            | $0-1      |
| **Cognito**     | 50k users         | 10 users        | $0        |
| **Total**       | **Free (year 1)** | **Small scale** | **$2-11** |

---

## Troubleshooting

| Issue                             | Resolution                                           |
| --------------------------------- | ---------------------------------------------------- |
| **Lambda: Access Denied**         | Check IAM role has DynamoDB permissions              |
| **API Gateway: 403 Unauthorized** | Verify token in Authorization header                 |
| **DynamoDB: Item not created**    | Check Lambda logs in CloudWatch                      |
| **SNS: No email received**        | Confirm subscription in email inbox                  |
| **CORS errors**                   | Enable CORS in API Gateway with Authorization header |
| **Timeout errors**                | Increase Lambda timeout to 30 seconds                |

---

## Rollback Steps

If something goes wrong:

1. **Lambda:** Go back to previous working version in Version history
2. **API Gateway:** Delete and recreate from scratch
3. **DynamoDB:** Use point-in-time recovery to restore
4. **Frontend:** Revert `awsConfig.js` and `api.js` changes

---

## Next: Production Deployment

Once testing passes:

1. **Update frontend environment:**

   ```javascript
   // frontend/src/api.js
   const useBackend = process.env.NODE_ENV === "production";
   ```

2. **Deploy frontend to Amplify Hosting:**

   ```powershell
   npm run build
   # Connect repo to Amplify and auto-deploy on push
   ```

3. **Enable CloudWatch monitoring:**

   - Set up alarms for Lambda errors
   - Alert on DynamoDB throttling
   - Monitor API Gateway latency

4. **Enable logging:**
   - CloudWatch Logs for Lambda
   - DynamoDB CloudTrail for audit
   - VPC Flow Logs (optional)

---

**Last Updated:** December 2024  
**Status:** Ready for deployment
