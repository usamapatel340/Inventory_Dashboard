# Inventory Tracking Dashboard

A professional web application for local retailers to track stock levels, manage product catalogs, and generate low-stock alerts using AWS cloud services.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Parcel)                 │
│          - Inventory Dashboard                              │
│          - Product Management (Add/Edit/View)               │
│          - Stock Adjustment & History                       │
│          - Real-time Low-Stock Alerts                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                ┌──────────────────┐
                │   AWS Amplify    │
                │  (Cognito Auth)  │
                └──────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
    │  Lambda │  │   API   │  │ DynamoDB│
    │ Handler │─→│ Gateway │←─│  Table  │
    └─────────┘  └─────────┘  └─────────┘
         │             │             │
         └─────────────┼─────────────┘
                       │
                ┌──────▼──────┐
                │     SNS     │
                │   (Alerts)  │
                └─────────────┘
```

## Features

✅ **User Authentication**

- AWS Cognito-based login/sign-up
- Forgot password with 2-step verification
- Session management and secure logout

✅ **Inventory Management**

- Add/edit products with SKU tracking
- Real-time stock quantity management
- Custom low-stock thresholds per product
- Automatic and manual low-stock alerts

✅ **Data Persistence**

- Hybrid API architecture: localStorage fallback + DynamoDB sync
- Complete transaction history per product
- Offline-first capability

✅ **Responsive UI**

- Professional gradient design
- Product search and filtering
- Low-stock alerts panel
- Transaction history view

## Tech Stack

| Layer              | Technology                  |
| ------------------ | --------------------------- |
| **Frontend**       | React 18.3.1, Parcel 2.16.1 |
| **Authentication** | AWS Amplify 5.2.0, Cognito  |
| **Database**       | AWS DynamoDB                |
| **Backend**        | AWS Lambda, API Gateway     |
| **Notifications**  | AWS SNS (mock in demo)      |
| **Storage**        | localStorage (fallback)     |

## Project Structure

```
Project_Invent/
├── frontend/
│   ├── index.html                 # React root
│   ├── package.json               # Dependencies
│   └── src/
│       ├── index.js               # Entry point
│       ├── App.js                 # Main component (675 lines)
│       ├── Login.js               # Auth UI (Cognito)
│       ├── ForgotPassword.js      # Password reset
│       ├── amplifyConfig.js       # Cognito config
│       ├── awsConfig.js           # DynamoDB config
│       └── api.js                 # Hybrid API layer
│
└── backend/
    └── lambda-handler.js          # Lambda function stub
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- AWS Account with Cognito User Pool and DynamoDB table
- AWS credentials configured locally

### Frontend Setup

1. **Navigate to frontend directory:**

   ```powershell
   cd frontend
   ```

2. **Install dependencies:**

   ```powershell
   npm install
   ```

3. **Start development server:**
   ```powershell
   npm start
   ```
   The app will be available at `http://localhost:1234` with hot-reload enabled.

### AWS Configuration

#### 1. Cognito User Pool (Already Set Up)

- **Region:** ap-south-1
- **User Pool ID:** ap-south-1_OxUvHWqx1
- **Client ID:** 76ef4o66hsegmfkmo1t52p3f5o
- **File:** `frontend/src/amplifyConfig.js`

#### 2. DynamoDB Table (Already Set Up)

- **Region:** ap-south-1
- **Table Name:** Products
- **Table ARN:** arn:aws:dynamodb:ap-south-1:873828695513:table/Products
- **Partition Key:** id (String)
- **File:** `frontend/src/awsConfig.js`

#### 3. Lambda Function Deployment (Next Step)

**Step 1: Create Lambda Function**

- Go to AWS Lambda console → Create function
- **Name:** InventoryBackend
- **Runtime:** Node.js 18.x
- **Region:** ap-south-1
- **Execution Role:** Create new → name: inventory-lambda-role
  - Add inline policy with DynamoDB access:
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
            "dynamodb:DeleteItem"
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

**Step 2: Upload Code**

- Copy `backend/lambda-handler.js` code into Lambda editor
- Install AWS SDK: Lambda includes `aws-sdk` (v2) by default
- Click Deploy

**Step 3: Create API Gateway**

- AWS API Gateway → Create REST API
- **Name:** InventoryAPI
- Create resource `/products` with methods:
  - `GET` → Lambda Proxy integration → Select your Lambda
  - `POST` → Lambda Proxy integration → Select your Lambda
- Create resource `/products/{id}` with methods:
  - `GET`
  - `PUT`
  - `DELETE`
- Create resource `/products/{id}/quantity` with method:
  - `PATCH` → Lambda Proxy integration
- **Enable CORS** for all methods with headers `Authorization, Content-Type`
- Deploy to stage: `prod`
- Copy invoke URL (e.g., `https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod`)

**Step 4: Update Frontend Configuration**
Update `frontend/src/awsConfig.js`:

```javascript
export const awsConfig = {
  region: "ap-south-1",
  lambdaEndpoint: "https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod", // Your API Gateway URL
  tableArn: "arn:aws:dynamodb:ap-south-1:873828695513:table/Products",
  tableName: "Products",
  accountId: "873828695513",
};
```

**Step 5: Seed DynamoDB Data**

Use AWS CLI or DynamoDB console to add sample products:

```bash
aws dynamodb batch-write-item --request-items file://products.json --region ap-south-1
```

Sample products (`products.json`):

```json
{
  "Products": [
    {
      "PutRequest": {
        "Item": {
          "id": { "S": "p001" },
          "name": { "S": "Laptop Dell XPS 13" },
          "sku": { "S": "LP-DXP13" },
          "qty": { "N": "5" },
          "threshold": { "N": "3" },
          "contact": { "S": "+91-9876543210" },
          "autoAlert": { "BOOL": true },
          "history": { "L": [] },
          "createdAt": { "N": "1234567890" },
          "updatedAt": { "N": "1234567890" }
        }
      }
    }
  ]
}
```

### Demo Mode (No Backend Required)

The app includes a **hybrid API layer** that automatically falls back to localStorage:

1. Start frontend: `npm start`
2. Login with your Cognito credentials (or use test user if available)
3. All operations are saved to browser localStorage
4. When Lambda is deployed, data will sync to DynamoDB (no code changes needed!)

## API Endpoints

All endpoints require `Authorization` header with Cognito token.

### Products

**Get all products**

```
GET /products
Response: [{ id, name, sku, qty, threshold, contact, autoAlert, history, createdAt, updatedAt }]
```

**Get single product**

```
GET /products/{id}
Response: { id, name, sku, qty, threshold, ... }
```

**Create product**

```
POST /products
Body: { name, sku, qty, threshold, contact, autoAlert }
Response: { id, name, sku, ... } (201)
```

**Update product**

```
PUT /products/{id}
Body: { name, sku, qty, threshold, contact, autoAlert }
Response: { id, name, sku, ... }
```

**Delete product**

```
DELETE /products/{id}
Response: { success: true }
```

**Update stock quantity**

```
PATCH /products/{id}/quantity
Body: { delta: number } // +1 for restock, -1 for sale
Response: { id, qty, history, ... }
Auto-alerts triggered if qty crosses threshold
```

**Send alert manually**

```
POST /products/{id}/alert
Response: { success: true }
Sends SNS notification to contact (email/SMS)
```

## Database Schema

**DynamoDB Table: Products**

| Attribute | Type        | Description                                 |
| --------- | ----------- | ------------------------------------------- |
| id        | String (PK) | Unique product identifier                   |
| name      | String      | Product name                                |
| sku       | String      | Stock Keeping Unit                          |
| qty       | Number      | Current quantity in stock                   |
| threshold | Number      | Low-stock alert threshold                   |
| contact   | String      | Phone/Email for alerts                      |
| autoAlert | Boolean     | Auto-send alerts when below threshold       |
| history   | Array       | Transaction history [{type, qtyChange, ts}] |
| createdAt | Number      | Timestamp (ms)                              |
| updatedAt | Number      | Timestamp (ms)                              |

**History Entry Types:**

- `restock` - Stock added
- `sale` - Stock removed
- `alert` - Alert sent

## Business Case Studies

### Case 1: Micro Shop (1 Employee, 50-100 Products)

- **Scenario:** Single owner managing inventory manually
- **Benefits:**
  - Quick product lookup and stock checks
  - Automatic low-stock alerts prevent stockouts
  - History tracking shows sales trends
- **Cost:** ~$1-2/month (AWS free tier)

### Case 2: Small Retail Store (5 Employees, 200-500 Products)

- **Scenario:** Multiple staff, inventory manager on duty
- **Benefits:**
  - Centralized stock visibility for all staff
  - Scheduled daily reports via SNS
  - Real-time alerts for critical items
  - Search/filter features save time on manual checks
- **Cost:** ~$5-10/month (DynamoDB on-demand)

### Case 3: Medium Retail Chain (20+ Employees, 1000+ Products)

- **Scenario:** Multiple locations, regional inventory manager
- **Future Enhancements:**
  - Multi-location support with location-specific alerts
  - Advanced analytics and reorder recommendations
  - Barcode scanning integration
  - Integration with POS systems
- **Cost:** ~$20-50/month (provisioned capacity)

## Usage Examples

### Example 1: Add a Product

1. Click "Add Product" button
2. Fill in: Name, SKU, Qty, Threshold, Contact
3. Check "Send automatic alert" if desired
4. Click "Save"
5. Product appears at top of list

### Example 2: Adjust Stock

1. Find product in list
2. Click "+ Add" to increase or "- Remove" to decrease
3. Stock updates instantly
4. If qty crosses threshold → auto-alert sent (if enabled)

### Example 3: Manual Alert

1. Click "Send Alert" on any product
2. Simulates SNS notification (mock in demo mode)
3. History entry created with alert timestamp

### Example 4: Search & Filter

1. Type in search box (by name or SKU)
2. Check "Show low only" to see only low-stock items
3. Results filter in real-time

## Troubleshooting

| Issue                      | Solution                                                    |
| -------------------------- | ----------------------------------------------------------- |
| **Parcel build errors**    | Delete `dist` folder, run `npm install` again               |
| **Cognito login fails**    | Verify User Pool ID and Client ID in `amplifyConfig.js`     |
| **Data not persisting**    | Check browser's localStorage (DevTools → Application)       |
| **Lambda timeout**         | Increase timeout in Lambda settings (currently 3s, try 10s) |
| **DynamoDB access denied** | Verify Lambda IAM role has DynamoDB permissions             |
| **CORS errors**            | Enable CORS in API Gateway with `Authorization` header      |

## Environment Variables

Create a `.env` file in `frontend/` (optional, Parcel auto-loads):

```
REACT_APP_LAMBDA_ENDPOINT=https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod
REACT_APP_USE_BACKEND=true
```

Or directly edit `frontend/src/api.js`:

```javascript
const useBackend = false; // Set to true when Lambda deployed
```

## Deployment to Production

### Frontend

```powershell
npm run build
# Output in `dist/` folder
# Deploy to AWS Amplify Hosting or S3 + CloudFront
```

### Backend

1. Lambda function auto-scales
2. DynamoDB on-demand billing pays per request
3. API Gateway automatically scales

### Monitoring

- CloudWatch Logs for Lambda errors
- DynamoDB metrics for read/write performance
- CloudWatch Alarms for failures

## Next Steps

1. ✅ Frontend complete with Cognito auth
2. ⏳ Deploy Lambda function with DynamoDB integration
3. ⏳ Test API endpoints with real data
4. ⏳ Configure SNS for real email/SMS alerts
5. ⏳ Deploy to AWS Amplify Hosting
6. ⏳ Add barcode scanning (optional)
7. ⏳ Add multi-location support (optional)

## Support & Troubleshooting

**Need help?**

1. Check console logs (F12 → Console)
2. Review Lambda CloudWatch logs
3. Verify DynamoDB table permissions
4. Test API with curl/Postman

## License

Private project for inventory management system.

---

**Last Updated:** December 2024  
**Version:** 1.0.0-beta  
**Status:** Frontend complete, Backend in progress
