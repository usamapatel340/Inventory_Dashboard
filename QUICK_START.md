# Quick Deployment Checklist

## ⚡ 5-Minute Pre-Deployment Review

### Frontend Status ✅

- [x] React app created and tested
- [x] Cognito authentication working
- [x] Inventory dashboard functional
- [x] Hybrid API layer implemented
- [x] All CRUD operations wired
- [x] localStorage fallback working
- [x] Dev server running: `npm start`

**Current Location:** `frontend/src/`  
**Dev URL:** http://localhost:1234

---

## 🚀 Backend Deployment Steps (In Order)

### Step 1: Create Lambda Function (5 minutes)

```
AWS Console → Lambda → Create function
- Name: InventoryBackend
- Runtime: Node.js 18.x
- Region: ap-south-1
- Execution role: Create new (name: inventory-lambda-role)

Then:
- Copy backend/lambda-handler.js code
- Paste into Lambda editor
- Click Deploy
```

**Verify:**

- [ ] Function created and deployed
- [ ] Name: InventoryBackend

---

### Step 2: Set Lambda Permissions (5 minutes)

```
IAM Console → Roles → inventory-lambda-role
- Select the role
- Add inline policy:
  * DynamoDB: All actions on arn:aws:dynamodb:ap-south-1:873828695513:table/Products
  * SNS: sns:Publish on *

- Attach policy AWSLambdaDynamoDBExecutionRole (optional)
```

**Verify:**

- [ ] Role has DynamoDB permissions
- [ ] Role has SNS permissions

---

### Step 3: Create REST API Gateway (10 minutes)

```
API Gateway → Create API
- Type: REST API
- Name: InventoryAPI
- Endpoint: Regional

Create Resources & Methods:
├── /products
│   ├── GET → Lambda: InventoryBackend
│   └── POST → Lambda: InventoryBackend
├── /products/{id}
│   ├── GET → Lambda
│   ├── PUT → Lambda
│   └── DELETE → Lambda
└── /products/{id}/quantity
    └── PATCH → Lambda

Enable CORS on ALL methods:
- Authorization, Content-Type headers

Deploy:
- Stage: prod
- Copy Invoke URL
```

**Verify:**

- [ ] All methods created
- [ ] CORS enabled
- [ ] Deployed to prod
- [ ] Invoke URL copied

---

### Step 4: Create SNS Topic (3 minutes)

```
SNS → Topics → Create topic
- Type: Standard
- Name: inventory-alerts

Create subscription:
- Protocol: Email
- Endpoint: your-email@example.com
- Confirm in email inbox
```

**Verify:**

- [ ] Topic created
- [ ] Topic ARN noted
- [ ] Email subscription confirmed

---

### Step 5: Update Lambda SNS Configuration (2 minutes)

```
Lambda → InventoryBackend → Code
Find line: const topicArn = 'arn:aws:sns:...'
Replace with your topic ARN
Click Deploy
```

**Verify:**

- [ ] SNS topic ARN updated

---

### Step 6: Update Frontend Config (2 minutes)

```
frontend/src/awsConfig.js:
- lambdaEndpoint: 'https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod'
- Keep other values same

frontend/src/api.js:
- Change: const useBackend = false;
- To: const useBackend = true;
```

**Verify:**

- [ ] Lambda endpoint URL correct (from Step 3)
- [ ] useBackend = true

---

### Step 7: Restart Dev Server (1 minute)

```powershell
# Kill existing server (Ctrl+C)
# Run:
npm start

# Check: http://localhost:1234 loads successfully
```

**Verify:**

- [ ] Dev server running
- [ ] No errors in console
- [ ] Login works

---

### Step 8: Test End-to-End (10 minutes)

**Test 1: Create Product**

- Click "Add Product"
- Fill form: Name, SKU, Qty, Threshold
- Click Save
- ✅ Product appears in list
- ✅ Check DynamoDB: Product in table

**Test 2: Adjust Stock**

- Find product in list
- Click "+ Add"
- ✅ Qty increases
- ✅ Check DynamoDB: Qty updated
- ✅ History entry created

**Test 3: Low-Stock Alert**

- Add product with qty=5, threshold=10
- Click "- Remove" 5+ times
- ✅ Qty drops below threshold
- ✅ Auto-alert triggered (if autoAlert=true)
- ✅ Check email for alert

**Test 4: Manual Alert**

- Find a product
- Click "Send Alert"
- ✅ Alert sent message appears
- ✅ Check email for alert

**All Tests Pass?** ✅ → Deployment successful!

---

## 📊 Validation Checklist

### Frontend ✅

- [ ] Login works with Cognito
- [ ] Dashboard loads products
- [ ] Search/filter works
- [ ] Can add new product
- [ ] Can edit existing product
- [ ] Can adjust stock
- [ ] Can view history
- [ ] No JavaScript errors (F12 console)

### Backend ✅

- [ ] Lambda function deployed
- [ ] API Gateway endpoints responding
- [ ] IAM permissions correct
- [ ] DynamoDB items created/updated
- [ ] SNS alerts sending
- [ ] CloudWatch logs showing execution

### Integration ✅

- [ ] Frontend communicates with Lambda
- [ ] Data appears in DynamoDB
- [ ] Alerts reach email inbox
- [ ] No CORS errors
- [ ] All operations latency < 2 seconds

---

## 🔧 If Something Goes Wrong

### Lambda: "Access Denied"

```
Fix: IAM role needs DynamoDB + SNS permissions
- Go to IAM → Roles → inventory-lambda-role
- Add inline policy with correct ARNs
```

### API Gateway: 403 Unauthorized

```
Fix: Missing or invalid token
- Check auth token in header
- Verify Cognito user pool credentials
```

### DynamoDB: No items created

```
Fix: Check Lambda CloudWatch logs
- Lambda console → Monitor → Logs
- Look for error messages
```

### CORS: Blocked by browser

```
Fix: Enable CORS in API Gateway
- Method Response → 200 → Response Headers
- Add Access-Control-Allow-Origin: *
```

### SNS: No emails received

```
Fix: Check subscription and topic
- SNS console → Topics → Subscriptions
- Look for "ConfirmationFailed" subscriptions
- Re-confirm email address
```

### Frontend data not syncing

```
Fix: Check configuration
- Verify Lambda endpoint in awsConfig.js (no typos)
- Check useBackend = true in api.js
- Restart dev server (npm start)
- Check browser console for errors (F12)
```

---

## 📞 Support Info

**Issues to check in this order:**

1. **Browser console (F12)** - JavaScript errors
2. **Network tab (F12)** - API calls and responses
3. **Lambda CloudWatch logs** - Backend errors
4. **DynamoDB console** - Check if data exists
5. **Cognito console** - Check user pool status

---

## ✨ Success Indicators

### You know it's working when:

- ✅ Can login with Cognito
- ✅ Products appear on dashboard
- ✅ Adding a product stores it in DynamoDB
- ✅ Adjusting stock updates DynamoDB
- ✅ Lowering qty below threshold sends alert
- ✅ Email alert arrives in inbox
- ✅ All operations complete in < 2 seconds
- ✅ No errors in console or CloudWatch logs

---

## 📋 Final Checklist Before Launch

**Pre-Launch Verification:**

- [ ] Frontend builds without errors: `npm run build`
- [ ] Dev server runs without errors: `npm start`
- [ ] Cognito login works
- [ ] Lambda function deployed and tested
- [ ] API Gateway responding with correct data
- [ ] DynamoDB items created successfully
- [ ] SNS alerts working (email received)
- [ ] All 8 test steps above passed
- [ ] Documentation reviewed
- [ ] Cost understood ($0-2/month)

**If all checkboxes ✅:**

## 🎉 YOU ARE READY FOR PRODUCTION!

---

## 📈 Next Phase (Optional)

After backend is working:

1. **Deploy Frontend to Amplify:**

   ```bash
   npm run build
   # Connect repo to Amplify Hosting
   ```

2. **Enable Advanced Features:**

   - Barcode scanning
   - Multi-location support
   - Predictive alerts
   - Analytics dashboard

3. **Monitor with CloudWatch:**
   - Set up alarms
   - Track performance
   - Optimize costs

---

## 📞 Emergency Contacts

- **AWS Support:** Console → Support → Contact AWS
- **Cognito Issues:** AWS Cognito console → Support
- **DynamoDB Throttling:** CloudWatch → DynamoDB metrics

---

## 🎓 Learning Resources

- **AWS Docs:** https://docs.aws.amazon.com/
- **React Docs:** https://react.dev/
- **Parcel Docs:** https://parceljs.org/
- **Amplify Docs:** https://docs.amplify.aws/

---

**Last Updated:** December 2024  
**Estimated Deployment Time:** 45 minutes  
**Difficulty Level:** Intermediate  
**Status:** Ready to Deploy ✅
