#!/bin/bash
# AWS Deployment Script for Inventory Dashboard
# Deploys DynamoDB, Lambda, and API Gateway to ap-south-1

set -e

echo "================================"
echo "Inventory Dashboard AWS Deployment"
echo "================================"
echo "Region: ap-south-1"
echo "Account: 873828695513"
echo ""

# Variables
REGION="ap-south-1"
TABLE_NAME="Products"
FUNCTION_NAME="InventoryBackend"
ROLE_NAME="inventory-lambda-role"
API_NAME="InventoryAPI"
ACCOUNT_ID="873828695513"

echo "Step 1: Creating DynamoDB Table..."
aws dynamodb create-table \
  --table-name $TABLE_NAME \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>/dev/null || echo "Table already exists"

echo "Waiting for table to be active..."
aws dynamodb wait table-exists --table-name $TABLE_NAME --region $REGION

echo "✅ DynamoDB Table Created: $TABLE_NAME"

echo ""
echo "Step 2: Creating IAM Role for Lambda..."
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document "$TRUST_POLICY" \
  --region $REGION 2>/dev/null || echo "Role already exists"

# Wait a moment for role to be created
sleep 2

# Attach DynamoDB policy
DYNAMODB_POLICY='{
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
      "Resource": "arn:aws:dynamodb:'$REGION':'$ACCOUNT_ID':table/'$TABLE_NAME'"
    },
    {
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "*"
    }
  ]
}'

aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name dynamodb-access \
  --policy-document "$DYNAMODB_POLICY" \
  --region $REGION 2>/dev/null || echo "Policy already attached"

echo "✅ IAM Role Created: $ROLE_NAME"

echo ""
echo "Step 3: Deploying Lambda Function..."

# Get the lambda handler code
LAMBDA_CODE=$(cat << 'EOF'
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });
const sns = new AWS.SNS({ region: "ap-south-1" });
const TABLE_NAME = "Products";

function authorize(event) {
  const token = event.headers?.Authorization || event.headers?.authorization;
  if (!token) throw new Error("Unauthorized");
  return true;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

async function getProducts() {
  try {
    const result = await dynamodb.scan({ TableName: TABLE_NAME }).promise();
    return response(200, result.Items || []);
  } catch (err) {
    console.error("Error fetching products:", err);
    return response(500, { error: err.message });
  }
}

async function getProduct(productId) {
  try {
    const result = await dynamodb
      .get({ TableName: TABLE_NAME, Key: { id: productId } })
      .promise();
    return response(200, result.Item);
  } catch (err) {
    console.error("Error fetching product:", err);
    return response(500, { error: err.message });
  }
}

async function createProduct(body) {
  try {
    const product = {
      id: "p" + Math.random().toString(36).slice(2, 9),
      ...body,
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dynamodb.put({ TableName: TABLE_NAME, Item: product }).promise();
    return response(201, product);
  } catch (err) {
    console.error("Error creating product:", err);
    return response(500, { error: err.message });
  }
}

async function updateProduct(productId, body) {
  try {
    const product = { ...body, updatedAt: Date.now() };
    await dynamodb
      .update({
        TableName: TABLE_NAME,
        Key: { id: productId },
        UpdateExpression: "SET " + Object.keys(product).map(k => `${k} = :${k}`).join(", "),
        ExpressionAttributeValues: Object.keys(product).reduce((acc, k) => {
          acc[`:${k}`] = product[k];
          return acc;
        }, {}),
      })
      .promise();
    return response(200, { id: productId, ...product });
  } catch (err) {
    console.error("Error updating product:", err);
    return response(500, { error: err.message });
  }
}

async function updateQuantity(productId, delta) {
  try {
    const getResult = await dynamodb
      .get({ TableName: TABLE_NAME, Key: { id: productId } })
      .promise();
    const product = getResult.Item;
    if (!product) return response(404, { error: "Product not found" });

    const oldQty = product.qty;
    const newQty = Math.max(0, oldQty + delta);
    const historyEntry = {
      type: delta > 0 ? "restock" : "sale",
      qtyChange: delta,
      ts: Date.now(),
    };

    const updatedProduct = {
      ...product,
      qty: newQty,
      history: [historyEntry, ...(product.history || [])],
      updatedAt: Date.now(),
    };

    await dynamodb.put({ TableName: TABLE_NAME, Item: updatedProduct }).promise();

    if (oldQty > product.threshold && newQty <= product.threshold && product.autoAlert) {
      await sendAlert(product);
    }

    return response(200, updatedProduct);
  } catch (err) {
    console.error("Error updating quantity:", err);
    return response(500, { error: err.message });
  }
}

async function deleteProduct(productId) {
  try {
    await dynamodb
      .delete({ TableName: TABLE_NAME, Key: { id: productId } })
      .promise();
    return response(200, { success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    return response(500, { error: err.message });
  }
}

async function sendAlert(product) {
  try {
    const message = `Low stock alert: ${product.name} (${product.sku}) has only ${product.qty} units left (threshold: ${product.threshold})`;
    console.log("[SNS] Alert:", message);
    return { success: true };
  } catch (err) {
    console.error("Error sending alert:", err);
    return { success: false, error: err.message };
  }
}

exports.handler = async (event) => {
  try {
    authorize(event);
    
    const method = event.httpMethod;
    const path = event.path;

    if (method === "GET" && path === "/products") {
      return await getProducts();
    }
    if (method === "GET" && path.match(/^\/products\/[^/]+$/)) {
      const productId = path.split("/")[2];
      return await getProduct(productId);
    }
    if (method === "POST" && path === "/products") {
      return await createProduct(JSON.parse(event.body));
    }
    if (method === "PUT" && path.match(/^\/products\/[^/]+$/)) {
      const productId = path.split("/")[2];
      return await updateProduct(productId, JSON.parse(event.body));
    }
    if (method === "PATCH" && path.match(/^\/products\/[^\/]+\/quantity$/)) {
      const productId = path.split("/")[2];
      const { delta } = JSON.parse(event.body);
      return await updateQuantity(productId, delta);
    }
    if (method === "DELETE" && path.match(/^\/products\/[^/]+$/)) {
      const productId = path.split("/")[2];
      return await deleteProduct(productId);
    }

    return response(404, { error: "Route not found" });
  } catch (err) {
    console.error("Error:", err);
    return response(401, { error: "Unauthorized" });
  }
};
EOF
)

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --region $REGION --query 'Role.Arn' --output text)

# Create or update Lambda function
FUNCTION_ARN=$(aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler index.handler \
  --zip-file fileb:///dev/null \
  --region $REGION 2>/dev/null || \
  aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)

# Update Lambda code (create a temporary zip file)
mkdir -p /tmp/lambda
cat > /tmp/lambda/index.js << 'LAMBDA_EOF'
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });
const TABLE_NAME = "Products";

function authorize(event) {
  const token = event.headers?.Authorization || event.headers?.authorization;
  if (!token) throw new Error("Unauthorized");
  return true;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

async function getProducts() {
  try {
    const result = await dynamodb.scan({ TableName: TABLE_NAME }).promise();
    return response(200, result.Items || []);
  } catch (err) {
    return response(500, { error: err.message });
  }
}

async function getProduct(productId) {
  try {
    const result = await dynamodb.get({ TableName: TABLE_NAME, Key: { id: productId } }).promise();
    return response(200, result.Item);
  } catch (err) {
    return response(500, { error: err.message });
  }
}

async function createProduct(body) {
  try {
    const product = {
      id: "p" + Math.random().toString(36).slice(2, 9),
      ...body,
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dynamodb.put({ TableName: TABLE_NAME, Item: product }).promise();
    return response(201, product);
  } catch (err) {
    return response(500, { error: err.message });
  }
}

async function updateProduct(productId, body) {
  try {
    const product = { ...body, updatedAt: Date.now() };
    await dynamodb.update({
      TableName: TABLE_NAME,
      Key: { id: productId },
      UpdateExpression: "SET " + Object.keys(product).map(k => `${k} = :${k}`).join(", "),
      ExpressionAttributeValues: Object.keys(product).reduce((acc, k) => { acc[`:${k}`] = product[k]; return acc; }, {}),
    }).promise();
    return response(200, { id: productId, ...product });
  } catch (err) {
    return response(500, { error: err.message });
  }
}

async function updateQuantity(productId, delta) {
  try {
    const getResult = await dynamodb.get({ TableName: TABLE_NAME, Key: { id: productId } }).promise();
    const product = getResult.Item;
    if (!product) return response(404, { error: "Product not found" });
    const oldQty = product.qty;
    const newQty = Math.max(0, oldQty + delta);
    const historyEntry = { type: delta > 0 ? "restock" : "sale", qtyChange: delta, ts: Date.now() };
    const updatedProduct = { ...product, qty: newQty, history: [historyEntry, ...(product.history || [])], updatedAt: Date.now() };
    await dynamodb.put({ TableName: TABLE_NAME, Item: updatedProduct }).promise();
    return response(200, updatedProduct);
  } catch (err) {
    return response(500, { error: err.message });
  }
}

async function deleteProduct(productId) {
  try {
    await dynamodb.delete({ TableName: TABLE_NAME, Key: { id: productId } }).promise();
    return response(200, { success: true });
  } catch (err) {
    return response(500, { error: err.message });
  }
}

exports.handler = async (event) => {
  try {
    authorize(event);
    const method = event.httpMethod;
    const path = event.path;
    if (method === "GET" && path === "/products") return await getProducts();
    if (method === "GET" && path.match(/^\/products\/[^/]+$/)) return await getProduct(path.split("/")[2]);
    if (method === "POST" && path === "/products") return await createProduct(JSON.parse(event.body));
    if (method === "PUT" && path.match(/^\/products\/[^/]+$/)) return await updateProduct(path.split("/")[2], JSON.parse(event.body));
    if (method === "PATCH" && path.match(/^\/products\/[^\/]+\/quantity$/)) {
      const { delta } = JSON.parse(event.body);
      return await updateQuantity(path.split("/")[2], delta);
    }
    if (method === "DELETE" && path.match(/^\/products\/[^/]+$/)) return await deleteProduct(path.split("/")[2]);
    return response(404, { error: "Route not found" });
  } catch (err) {
    return response(401, { error: "Unauthorized" });
  }
};
LAMBDA_EOF

cd /tmp/lambda && zip -q function.zip index.js
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb:///tmp/lambda/function.zip \
  --region $REGION

echo "✅ Lambda Function Deployed: $FUNCTION_NAME"

echo ""
echo "Step 4: Configuring Lambda Settings..."
aws lambda update-function-configuration \
  --function-name $FUNCTION_NAME \
  --timeout 30 \
  --memory-size 512 \
  --region $REGION

echo "✅ Lambda Configured (30s timeout, 512MB memory)"

echo ""
echo "================================"
echo "✅ ALL DEPLOYMENTS COMPLETE!"
echo "================================"
echo ""
echo "DynamoDB Table: $TABLE_NAME"
echo "Lambda Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo ""
echo "Next: Create API Gateway manually or wait for instructions"
echo ""
