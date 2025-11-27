# AWS Deployment Checklist - Your Account Details

**Account ID:** 873828695513  
**Region:** ap-south-1 (Asia Pacific - Mumbai)  
**Table Name:** Products  
**Status:** ✅ Frontend ready, ⏳ Backend deployment needed

---

## ✅ What's Ready

```
✅ Frontend configured with your account details
✅ DynamoDB backend ENABLED (useBackend = true)
✅ Lambda code ready (backend/lambda-handler.js)
✅ Configuration files updated
```

---

## ⏳ What's Needed: 3 AWS Steps

### Step 1: Create DynamoDB Table (2 minutes)

**Go to:** AWS Console → DynamoDB → ap-south-1 region

```
1. Click "Create table"
2. Table name: Products
3. Partition key: id (String)
4. Billing mode: On-demand (pay per request)
5. Click "Create table"

✅ Done - Table created in ap-south-1
```

**Verify:**

- Table name: `Products` ✓
- Partition key: `id` ✓
- Region: `ap-south-1` ✓
- ARN: `arn:aws:dynamodb:ap-south-1:873828695513:table/Products` ✓

---

### Step 2: Deploy Lambda Function (5 minutes)

**Go to:** AWS Lambda Console → ap-south-1 region

```
1. Click "Create function"
2. Function name: InventoryBackend
3. Runtime: Node.js 18.x
4. Architecture: x86_64
5. Execution role: Create new role
   - Role name: inventory-lambda-role

6. Click "Create function"
```

**Add Permissions to Role:**

1. Go to IAM Console → Roles → inventory-lambda-role
2. Click "Add inline policy"
3. Paste this policy:

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

4. Click "Review policy" → "Create policy"

**Deploy Lambda Code:**

1. Go back to Lambda function
2. Copy entire code from: `backend/lambda-handler.js`
3. In Lambda editor, select all and paste
4. Click "Deploy"

**Configure Settings:**

1. Go to Lambda → Configuration → General configuration
2. Set:
   - Memory: 512 MB
   - Timeout: 30 seconds
3. Click "Save"

✅ Done - Lambda deployed

---

### Step 3: Create API Gateway (10 minutes)

**Go to:** AWS API Gateway Console → ap-south-1 region

**Create API:**

```
1. Click "Create API"
2. Choose "REST API"
3. API name: InventoryAPI
4. Endpoint type: Regional
5. Click "Create API"
```

**Create Resources & Methods:**

```
1. Create resource: /products
   - Select root (/)
   - Click "Create Resource"
   - Resource name: products
   - Resource path: /products
   - Click "Create Resource"

2. Add GET method to /products
   - Select /products
   - Click "Create Method" → GET
   - Integration type: Lambda Function
   - Lambda Region: ap-south-1
   - Lambda Function: InventoryBackend
   - Click "Save"

3. Add POST method to /products
   - Click "Create Method" → POST
   - Same settings as GET
   - Click "Save"

4. Create resource: /{id}
   - Select /products
   - Click "Create Resource"
   - Resource name: {id}
   - Resource path: {id}
   - Click "Create Resource"

5. Add GET method to /products/{id}
   - Select /products/{id}
   - Click "Create Method" → GET
   - Lambda Function: InventoryBackend
   - Click "Save"

6. Add PUT method to /products/{id}
   - Click "Create Method" → PUT
   - Lambda Function: InventoryBackend
   - Click "Save"

7. Add DELETE method to /products/{id}
   - Click "Create Method" → DELETE
   - Lambda Function: InventoryBackend
   - Click "Save"

8. Create resource: /quantity
   - Select /products/{id}
   - Click "Create Resource"
   - Resource name: quantity
   - Resource path: quantity
   - Click "Create Resource"

9. Add PATCH method to /products/{id}/quantity
   - Click "Create Method" → PATCH
   - Lambda Function: InventoryBackend
   - Click "Save"
```

**Enable CORS:**

```
1. Select /products resource
2. Click "Enable CORS"
3. Access-Control-Allow-Headers: Authorization,Content-Type
4. Click "Replace CORS headers and methods"
5. Repeat for /products/{id} and /products/{id}/quantity
```

**Deploy API:**

```
1. Click "Deploy API"
2. Deployment stage: Create new stage
3. Stage name: prod
4. Click "Deploy"

5. COPY YOUR INVOKE URL:
   https://xxxxxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

✅ Done - API Gateway created

---

## Step 4: Update Frontend with API Gateway URL

**Copy your Invoke URL from Step 3** (looks like: `https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod`)

**Update Frontend:**

File: `frontend/src/awsConfig.js`

Replace this line:

```javascript
lambdaEndpoint: process.env.REACT_APP_LAMBDA_ENDPOINT || "http://localhost:3001",
```

With:

```javascript
lambdaEndpoint: "https://YOUR_INVOKE_URL_HERE/prod",
// Example:
lambdaEndpoint: "https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod",
```

---

## Step 5: Test Everything

1. **Restart Frontend:**

   ```bash
   npm start
   ```

2. **Login with Cognito**

3. **Add a Product:**

   - Click "Add Product"
   - Fill form: Name, SKU, Qty, Threshold
   - Click "Save"

4. **Verify in DynamoDB:**

   - AWS Console → DynamoDB → Products table → Items
   - You should see the product you just created! ✅

5. **Verify in CloudWatch Logs:**
   - AWS Lambda → InventoryBackend → Monitor → Logs
   - Check for successful execution

---

## Status After Deployment

```
✅ DynamoDB Table Created
✅ Lambda Function Deployed
✅ API Gateway Active
✅ Frontend Connected
✅ Cognito Authentication Working
✅ Data syncing to DynamoDB

Result: FULLY CONNECTED! 🎉
```

---

## Quick Test Commands (Optional - Using curl)

**Get your API endpoint and token first**

```powershell
# 1. Get Cognito token from browser
# Login to app (http://localhost:1234)
# Open DevTools (F12) → Console
# Type: await Auth.currentSession().then(s => console.log(s.getIdToken().getJwtToken()))
# Copy the token

$API_URL = "https://your-invoke-url.execute-api.ap-south-1.amazonaws.com/prod"
$TOKEN = "your-cognito-token-here"

# Test: Get all products
curl -X GET "$API_URL/products" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json"

# Test: Create product
curl -X POST "$API_URL/products" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Test Product",
    "sku": "TP-001",
    "qty": 100,
    "threshold": 10,
    "contact": "test@example.com",
    "autoAlert": true
  }'
```

---

## Your Account Info (Verified)

| Item            | Value                                                     |
| --------------- | --------------------------------------------------------- |
| Account ID      | 873828695513 ✓                                            |
| Region          | ap-south-1 (Mumbai) ✓                                     |
| Table Name      | Products ✓                                                |
| DynamoDB ARN    | arn:aws:dynamodb:ap-south-1:873828695513:table/Products ✓ |
| Lambda Runtime  | Node.js 18.x ✓                                            |
| Frontend Status | Ready ✓                                                   |

---

## Troubleshooting

**If Lambda says "Access Denied":**

- Check IAM role has DynamoDB permissions
- Verify table ARN matches exactly

**If API Gateway returns 403:**

- Verify Cognito token in Authorization header
- Check token hasn't expired

**If DynamoDB shows no items:**

- Check Lambda CloudWatch logs
- Verify Lambda permissions to table
- Check table name is exactly "Products"

**If CORS error in browser:**

- Verify CORS enabled in API Gateway
- Check Authorization header in CORS settings

---

## Final Checklist Before Production

- [ ] DynamoDB table "Products" created
- [ ] Lambda function "InventoryBackend" deployed
- [ ] Lambda IAM role has DynamoDB access
- [ ] API Gateway "InventoryAPI" created with all methods
- [ ] CORS enabled on API Gateway
- [ ] API Gateway deployed to "prod" stage
- [ ] Frontend awsConfig.js has correct Invoke URL
- [ ] Frontend useBackend = true in api.js ✅ (Already done)
- [ ] Test: Can login with Cognito
- [ ] Test: Can add product → appears in DynamoDB
- [ ] Test: Can edit/delete products
- [ ] Test: CloudWatch logs show successful execution

---

## Timeline

```
Total Setup Time: ~20-30 minutes

Step 1: Create DynamoDB    [2 min]  ✓
Step 2: Deploy Lambda      [5 min]  ✓
Step 3: API Gateway        [10 min] ✓
Step 4: Update Frontend    [2 min]  ✓
Step 5: Test               [5 min]  ✓
                          ─────────────
                          Total:    ~25 min
```

---

## ✅ YOUR FRONTEND IS NOW READY

**What's done:**

```javascript
// api.js - useBackend is NOW true
export const hybridAPI = {
  useBackend: true, ✅ ENABLED
```

**All you need to do now:**

1. Create DynamoDB table
2. Deploy Lambda
3. Create API Gateway
4. Update Invoke URL

Then your app will be **fully connected to DynamoDB!** 🚀

---

**Account Verified:** 873828695513  
**Region Confirmed:** ap-south-1 (Mumbai)  
**Table Confirmed:** Products  
**Status:** Ready for AWS deployment
