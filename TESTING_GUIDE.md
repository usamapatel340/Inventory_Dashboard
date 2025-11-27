# Testing Guide - DynamoDB Integration

## Current Status ✅

- **Lambda Function**: Deployed successfully with all CRUD endpoints
- **API Gateway**: Connected at `https://0loi71mh9k.execute-api.ap-south-1.amazonaws.com/prod`
- **DynamoDB Table**: `Products` table is ready and empty
- **Frontend**: Running at http://localhost:56744
- **Authentication**: Cognito configured

## Test DynamoDB Product Save

### Step 1: Login

1. Open http://localhost:56744 in your browser
2. Sign in with your Cognito credentials

### Step 2: Add a New Product

1. Click **"Add Product"** button
2. Fill in the form:
   - **Name**: Test Product
   - **SKU**: TEST-001
   - **Qty**: 10
   - **Threshold**: 5
   - **Contact**: your-email@example.com
   - **Auto Alert**: Check the box
3. Click **"Save"**

### Step 3: Verify in DynamoDB

Run this command to check if the product was saved:

```powershell
aws dynamodb scan --table-name Products --region ap-south-1
```

### Step 4: Test Quantity Adjustment

1. Click **"+ Add"** or **"- Remove"** on the product
2. Verify the quantity updates
3. Check DynamoDB again to confirm the change persisted

### Step 5: Test Low Stock Alert

1. Reduce quantity below threshold (5)
2. An automatic alert should trigger
3. Or click **"Send Alert"** button manually

## Verify Backend Routes

All these endpoints are now available:

- `GET /products` - Get all products
- `POST /products` - Create product
- `GET /products/:id` - Get single product
- `PUT /products/:id` - Update product
- `PATCH /products/:id/quantity` - Update quantity with history
- `DELETE /products/:id` - Delete product
- `GET /products/low-stock` - Get items below threshold
- `GET /products/search?q=query` - Search products
- `POST /products/:id/alert` - Send SNS alert

## Troubleshooting

### If products don't save:

1. Check browser console (F12) for errors
2. Check Network tab for API calls
3. Verify Cognito authentication token is valid
4. Check Lambda logs:
   ```powershell
   aws logs tail /aws/lambda/inventory-handler --follow --region ap-south-1
   ```

### If authentication fails:

1. Ensure you're logged into Cognito
2. Check `frontend/src/awsConfig.js` has correct User Pool settings
3. Verify Cognito user exists in the User Pool

## Expected Behavior

✅ **Working correctly when:**

- Products appear in the list after adding
- Browser refresh loads products from DynamoDB (not localStorage)
- Quantity changes persist after page reload
- DynamoDB scan shows the products

❌ **Not working if:**

- Products disappear after refresh
- Console shows "Failed to save product" errors
- DynamoDB table remains empty after adding products
