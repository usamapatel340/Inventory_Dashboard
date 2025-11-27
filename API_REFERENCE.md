# API Reference - Inventory Dashboard Backend

## Base URL

```
https://your-api.execute-api.ap-south-1.amazonaws.com/prod
```

## Authentication

All requests require AWS Cognito bearer token:

```
Authorization: Bearer <cognito_jwt_token>
```

---

## Endpoints

### Products

#### GET /products

Retrieve all products from inventory.

**Request:**

```bash
curl -X GET "https://api.example.com/prod/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response (200):**

```json
[
  {
    "id": "p001",
    "name": "Laptop Dell XPS 13",
    "sku": "LP-DXP13",
    "qty": 5,
    "threshold": 3,
    "contact": "manager@shop.com",
    "autoAlert": true,
    "history": [
      {
        "type": "restock",
        "qtyChange": 10,
        "ts": 1701234567890
      },
      {
        "type": "sale",
        "qtyChange": -5,
        "ts": 1701234456789
      }
    ],
    "createdAt": 1701234100000,
    "updatedAt": 1701234567890
  }
]
```

---

#### POST /products

Create a new product in inventory.

**Request:**

```bash
curl -X POST "https://api.example.com/prod/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "sku": "WM-2024",
    "qty": 50,
    "threshold": 10,
    "contact": "+91-9876543210",
    "autoAlert": true
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | ✓ | Product name |
| sku | String | ✓ | Stock keeping unit |
| qty | Number | ✓ | Initial quantity |
| threshold | Number | ✓ | Low-stock threshold |
| contact | String | - | Email or phone for alerts |
| autoAlert | Boolean | - | Auto-send alerts (default: false) |

**Response (201):**

```json
{
  "id": "p123abc",
  "name": "Wireless Mouse",
  "sku": "WM-2024",
  "qty": 50,
  "threshold": 10,
  "contact": "+91-9876543210",
  "autoAlert": true,
  "history": [],
  "createdAt": 1701234567890,
  "updatedAt": 1701234567890
}
```

---

#### GET /products/{id}

Retrieve a specific product by ID.

**Request:**

```bash
curl -X GET "https://api.example.com/prod/products/p001" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**

```json
{
  "id": "p001",
  "name": "Laptop Dell XPS 13",
  "sku": "LP-DXP13",
  "qty": 5,
  "threshold": 3,
  "contact": "manager@shop.com",
  "autoAlert": true,
  "history": [],
  "createdAt": 1701234100000,
  "updatedAt": 1701234567890
}
```

**Response (404):**

```json
{
  "error": "Product not found"
}
```

---

#### PUT /products/{id}

Update product details (name, SKU, threshold, etc.).

**Request:**

```bash
curl -X PUT "https://api.example.com/prod/products/p001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Dell XPS 15",
    "sku": "LP-DXP15",
    "qty": 5,
    "threshold": 2,
    "contact": "manager@shop.com",
    "autoAlert": false
  }'
```

**Response (200):**

```json
{
  "id": "p001",
  "name": "Laptop Dell XPS 15",
  "sku": "LP-DXP15",
  "qty": 5,
  "threshold": 2,
  "contact": "manager@shop.com",
  "autoAlert": false,
  "updatedAt": 1701234789012
}
```

---

#### DELETE /products/{id}

Remove a product from inventory.

**Request:**

```bash
curl -X DELETE "https://api.example.com/prod/products/p001" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**

```json
{
  "success": true
}
```

---

### Stock Management

#### PATCH /products/{id}/quantity

Adjust product stock quantity (add or remove).

**Request:**

```bash
curl -X PATCH "https://api.example.com/prod/products/p001/quantity" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "delta": -5
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| delta | Number | ✓ | Quantity change (+ve for restock, -ve for sale) |

**Response (200):**

```json
{
  "id": "p001",
  "name": "Laptop Dell XPS 13",
  "sku": "LP-DXP13",
  "qty": 0,
  "threshold": 3,
  "history": [
    {
      "type": "sale",
      "qtyChange": -5,
      "ts": 1701234890123
    },
    {
      "type": "alert",
      "qtyChange": 0,
      "ts": 1701234890000
    }
  ],
  "updatedAt": 1701234890123
}
```

**Auto-Alert Behavior:**

- If `autoAlert=true` AND `oldQty > threshold` AND `newQty <= threshold`:
  - Alert is automatically sent via SNS
  - History entry `{type: "alert", ...}` is added

---

#### POST /products/{id}/alert

Manually send an alert for a product.

**Request:**

```bash
curl -X POST "https://api.example.com/prod/products/p001/alert" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response (200):**

```json
{
  "success": true
}
```

**Response (400):**

```json
{
  "error": "No contact info for this product"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "error": "Product not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Status Codes

| Code | Meaning      |
| ---- | ------------ |
| 200  | Success      |
| 201  | Created      |
| 400  | Bad Request  |
| 401  | Unauthorized |
| 404  | Not Found    |
| 500  | Server Error |

---

## Field Types & Validation

| Field     | Type   | Min | Max | Pattern        |
| --------- | ------ | --- | --- | -------------- |
| name      | String | 1   | 100 | -              |
| sku       | String | 1   | 50  | -              |
| qty       | Number | 0   | -   | Integer        |
| threshold | Number | 0   | -   | Integer        |
| contact   | String | -   | -   | Email or phone |
| delta     | Number | -   | -   | Integer (±)    |

---

## Rate Limiting

Currently **no rate limits** implemented. For production:

- Recommended: 100 requests/minute per user
- Cognito handles authentication throttling

---

## Examples

### Example 1: Receive a Restock Shipment

```bash
# Step 1: Get current product
curl -X GET "https://api.example.com/prod/products/p001" \
  -H "Authorization: Bearer $TOKEN"
# Response: qty: 5

# Step 2: Add 50 units
curl -X PATCH "https://api.example.com/prod/products/p001/quantity" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delta": 50}'
# Response: qty: 55, history: [{type: "restock", qtyChange: 50, ...}]
```

### Example 2: Record a Sale

```bash
curl -X PATCH "https://api.example.com/prod/products/p001/quantity" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delta": -3}'
# Response: qty: 52, history: [{type: "sale", qtyChange: -3, ...}]
```

### Example 3: Create New Product Line

```bash
curl -X POST "https://api.example.com/prod/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "USB-C Cable",
    "sku": "USB-C-100",
    "qty": 200,
    "threshold": 50,
    "contact": "warehouse@shop.com",
    "autoAlert": true
  }'
```

### Example 4: Low-Stock Alert

```bash
# Product at qty: 2, threshold: 5
# Adjust by -1
curl -X PATCH "https://api.example.com/prod/products/p001/quantity" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delta": -1}'

# Response: qty: 1
# Auto-alert sent to contact (threshold crossed)
# Email received: "Low stock alert: Product Name (SKU) has 1 units left"
```

---

## Response Time Targets

| Endpoint              | Typical | Max   |
| --------------------- | ------- | ----- |
| GET /products         | 200ms   | 1s    |
| GET /products/{id}    | 100ms   | 500ms |
| POST /products        | 300ms   | 2s    |
| PUT /products/{id}    | 250ms   | 1.5s  |
| PATCH /quantity       | 200ms   | 1s    |
| DELETE /products/{id} | 300ms   | 2s    |

---

## Testing with cURL

**Set token variable:**

```bash
$TOKEN="your_cognito_token_here"
```

**Get all products:**

```bash
curl -X GET "https://api.example.com/prod/products" \
  -H "Authorization: Bearer $TOKEN"
```

**Create product:**

```bash
curl -X POST "https://api.example.com/prod/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "name": "Test Product",
  "sku": "TP-001",
  "qty": 100,
  "threshold": 10,
  "contact": "test@example.com",
  "autoAlert": true
}
EOF
```

---

## Testing with Postman

1. **Create collection:** `Inventory API`
2. **Set environment variable:**
   - Key: `token`
   - Value: Your Cognito JWT token
3. **Set authorization header:**
   - Authorization: Bearer {{token}}
4. **Import endpoints** from this guide
5. **Send requests** with `Send` button

---

## Webhooks (Future)

Planned for v2.0:

- Webhook notifications for low-stock alerts
- Event-driven architecture with SNS
- SMS notifications via Twilio
- Integration with POS systems

---

**API Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Production Ready
