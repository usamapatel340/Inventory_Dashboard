# AWS Deployment PowerShell Script - Windows
# Deploy DynamoDB, Lambda, and API Gateway to ap-south-1

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Green
Write-Host "Inventory Dashboard AWS Deployment" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Region: ap-south-1"
Write-Host "Account: 873828695513"
Write-Host ""

$REGION = "ap-south-1"
$TABLE_NAME = "Products"
$FUNCTION_NAME = "InventoryBackend"
$ROLE_NAME = "inventory-lambda-role"
$API_NAME = "InventoryAPI"
$ACCOUNT_ID = "873828695513"

# Step 1: Create DynamoDB Table
Write-Host "Step 1: Creating DynamoDB Table..." -ForegroundColor Yellow
try {
    aws dynamodb create-table `
      --table-name $TABLE_NAME `
      --attribute-definitions AttributeName=id,AttributeType=S `
      --key-schema AttributeName=id,KeyType=HASH `
      --billing-mode PAY_PER_REQUEST `
      --region $REGION 2>$null
    Write-Host "Table creation initiated..." -ForegroundColor Gray
} catch {
    Write-Host "Table already exists or error occurred" -ForegroundColor Gray
}

Write-Host "Waiting for table to be active..."
aws dynamodb wait table-exists --table-name $TABLE_NAME --region $REGION
Write-Host "✅ DynamoDB Table Created: $TABLE_NAME" -ForegroundColor Green

# Step 2: Create IAM Role
Write-Host ""
Write-Host "Step 2: Creating IAM Role for Lambda..." -ForegroundColor Yellow

$TRUST_POLICY = @{
    "Version" = "2012-10-17"
    "Statement" = @(
        @{
            "Effect" = "Allow"
            "Principal" = @{ "Service" = "lambda.amazonaws.com" }
            "Action" = "sts:AssumeRole"
        }
    )
} | ConvertTo-Json

try {
    aws iam create-role `
      --role-name $ROLE_NAME `
      --assume-role-policy-document $TRUST_POLICY `
      --region $REGION 2>$null
    Write-Host "Role creation initiated..." -ForegroundColor Gray
} catch {
    Write-Host "Role already exists" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Attach DynamoDB policy
$DYNAMODB_POLICY = @{
    "Version" = "2012-10-17"
    "Statement" = @(
        @{
            "Effect" = "Allow"
            "Action" = @(
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem"
            )
            "Resource" = "arn:aws:dynamodb:$($REGION):$($ACCOUNT_ID):table/$($TABLE_NAME)"
        },
        @{
            "Effect" = "Allow"
            "Action" = @("sns:Publish")
            "Resource" = "*"
        }
    )
} | ConvertTo-Json

aws iam put-role-policy `
  --role-name $ROLE_NAME `
  --policy-name dynamodb-access `
  --policy-document $DYNAMODB_POLICY `
  --region $REGION

Write-Host "✅ IAM Role Created: $ROLE_NAME" -ForegroundColor Green

# Step 3: Deploy Lambda
Write-Host ""
Write-Host "Step 3: Deploying Lambda Function..." -ForegroundColor Yellow

$ROLE_ARN = aws iam get-role --role-name $ROLE_NAME --region $REGION --query 'Role.Arn' --output text

# Lambda handler code
$LAMBDA_CODE = @'
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
'@

# Create temp directory and zip file
$TempDir = "$env:TEMP\lambda_$([System.Guid]::NewGuid().ToString())"
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
$LAMBDA_CODE | Out-File -FilePath "$TempDir\index.js" -Encoding UTF8

# Create ZIP file
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($TempDir, "$TempDir.zip", "Optimal", $false)

# Create or update Lambda function
try {
    aws lambda create-function `
      --function-name $FUNCTION_NAME `
      --runtime nodejs18.x `
      --role $ROLE_ARN `
      --handler index.handler `
      --zip-file fileb://$TempDir.zip `
      --region $REGION 2>$null
    Write-Host "Lambda function created" -ForegroundColor Gray
} catch {
    Write-Host "Updating existing Lambda function..." -ForegroundColor Gray
    aws lambda update-function-code `
      --function-name $FUNCTION_NAME `
      --zip-file fileb://$TempDir.zip `
      --region $REGION | Out-Null
}

Write-Host "✅ Lambda Function Deployed: $FUNCTION_NAME" -ForegroundColor Green

# Step 4: Configure Lambda
Write-Host ""
Write-Host "Step 4: Configuring Lambda Settings..." -ForegroundColor Yellow

aws lambda update-function-configuration `
  --function-name $FUNCTION_NAME `
  --timeout 30 `
  --memory-size 512 `
  --region $REGION | Out-Null

Write-Host "✅ Lambda Configured (30s timeout, 512MB memory)" -ForegroundColor Green

# Cleanup
Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$TempDir.zip" -Force -ErrorAction SilentlyContinue

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ ALL DEPLOYMENTS COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "DynamoDB Table: $TABLE_NAME" -ForegroundColor Cyan
Write-Host "Lambda Function: $FUNCTION_NAME" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Create API Gateway" -ForegroundColor Yellow
Write-Host ""
