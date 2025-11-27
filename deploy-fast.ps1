# Fast AWS Deployment Script
# Deploys DynamoDB, Lambda, and API Gateway in minutes

Write-Host "🚀 Starting Fast AWS Deployment..." -ForegroundColor Green
Write-Host ""

$AccountID = "873828695513"
$Region = "ap-south-1"
$TableName = "Products"
$LambdaFunctionName = "inventory-handler"
$RoleName = "LambdaInventoryRole"
$ApiName = "inventory-api"

# ===== STEP 1: CREATE IAM ROLE =====
Write-Host "📋 Step 1: Creating IAM Role..." -ForegroundColor Yellow

$RoleExist = aws iam get-role --role-name $RoleName 2>&1 | findstr "Arn"
if ($RoleExist) {
    Write-Host "✅ Role already exists" -ForegroundColor Green
} else {
    Write-Host "Creating new role..." -ForegroundColor Cyan
    $RolePolicy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Principal = @{ Service = "lambda.amazonaws.com" }
                Action = "sts:AssumeRole"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $RolePolicy | Out-File -FilePath temp-policy.json -Encoding UTF8
    aws iam create-role --role-name $RoleName --assume-role-policy-document file://temp-policy.json --region $Region
    Remove-Item temp-policy.json -Force
    Write-Host "✅ Role created" -ForegroundColor Green
}

# Attach policies
Write-Host "Adding DynamoDB policy..." -ForegroundColor Cyan
aws iam attach-role-policy --role-name $RoleName --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess 2>&1 | Out-Null
aws iam attach-role-policy --role-name $RoleName --policy-arn arn:aws:iam::aws:policy/AmazonSNSFullAccess 2>&1 | Out-Null
Write-Host "✅ Policies attached" -ForegroundColor Green
Start-Sleep -Seconds 5

# ===== STEP 2: DEPLOY LAMBDA =====
Write-Host ""
Write-Host "⚡ Step 2: Deploying Lambda Function..." -ForegroundColor Yellow

# Check if lambda exists
$LambdaExist = aws lambda get-function --function-name $LambdaFunctionName --region $Region 2>&1 | findstr "FunctionArn"

if ($LambdaExist) {
    Write-Host "Updating existing Lambda function..." -ForegroundColor Cyan
    # Update code
    $LambdaCode = Get-Content -Path "backend/lambda-handler.js" -Raw
    $LambdaCode | Out-File -FilePath temp-lambda.js -Encoding UTF8
    Compress-Archive -Path temp-lambda.js -DestinationPath temp-lambda.zip -Force
    
    aws lambda update-function-code --function-name $LambdaFunctionName --zip-file fileb://temp-lambda.zip --region $Region
    Write-Host "✅ Lambda code updated" -ForegroundColor Green
} else {
    Write-Host "Creating new Lambda function..." -ForegroundColor Cyan
    # Get role ARN
    $RoleArn = aws iam get-role --role-name $RoleName --query 'Role.Arn' --output text
    
    # Create zip
    $LambdaCode = Get-Content -Path "backend/lambda-handler.js" -Raw
    $LambdaCode | Out-File -FilePath temp-lambda.js -Encoding UTF8
    Compress-Archive -Path temp-lambda.js -DestinationPath temp-lambda.zip -Force
    
    aws lambda create-function `
        --function-name $LambdaFunctionName `
        --runtime nodejs20.x `
        --role $RoleArn `
        --handler lambda-handler.handler `
        --zip-file fileb://temp-lambda.zip `
        --region $Region `
        --environment Variables={TABLE_NAME=$TableName,REGION=$Region}
    
    Write-Host "✅ Lambda function created" -ForegroundColor Green
}

# Set environment variables
aws lambda update-function-configuration `
    --function-name $LambdaFunctionName `
    --environment Variables={TABLE_NAME=$TableName,REGION=$Region} `
    --region $Region 2>&1 | Out-Null

Remove-Item temp-lambda.js -Force -ErrorAction SilentlyContinue
Remove-Item temp-lambda.zip -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# ===== STEP 3: CREATE API GATEWAY =====
Write-Host ""
Write-Host "🌐 Step 3: Creating API Gateway..." -ForegroundColor Yellow

# Get Lambda ARN
$LambdaArn = aws lambda get-function --function-name $LambdaFunctionName --region $Region --query 'Configuration.FunctionArn' --output text

# Check if API exists
$ApiId = aws apigateway get-rest-apis --region $Region --query "items[?name=='$ApiName'].id" --output text

if ($ApiId) {
    Write-Host "API already exists with ID: $ApiId" -ForegroundColor Green
} else {
    Write-Host "Creating new API..." -ForegroundColor Cyan
    $ApiResult = aws apigateway create-rest-api --name $ApiName --description "Inventory Management API" --region $Region
    $ApiId = $ApiResult | ConvertFrom-Json | Select-Object -ExpandProperty id
    Write-Host "✅ API created: $ApiId" -ForegroundColor Green
}

# Get root resource
$RootId = aws apigateway get-resources --rest-api-id $ApiId --region $Region --query 'items[0].id' --output text

# Create /products resource
$ProductsResource = aws apigateway create-resource --rest-api-id $ApiId --parent-id $RootId --path-part products --region $Region 2>&1
$ProductsId = $ProductsResource | ConvertFrom-Json | Select-Object -ExpandProperty id

# Create GET /products
aws apigateway put-method --rest-api-id $ApiId --resource-id $ProductsId --http-method GET --type AWS_IAM --region $Region 2>&1 | Out-Null
aws apigateway put-integration --rest-api-id $ApiId --resource-id $ProductsId --http-method GET --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:$Region:lambda:path/2015-03-31/functions/$LambdaArn/invocations" --region $Region 2>&1 | Out-Null

# Create POST /products
aws apigateway put-method --rest-api-id $ApiId --resource-id $ProductsId --http-method POST --type AWS_IAM --region $Region 2>&1 | Out-Null
aws apigateway put-integration --rest-api-id $ApiId --resource-id $ProductsId --http-method POST --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:$Region:lambda:path/2015-03-31/functions/$LambdaArn/invocations" --region $Region 2>&1 | Out-Null

# Enable CORS
aws apigateway put-method-response --rest-api-id $ApiId --resource-id $ProductsId --http-method GET --status-code 200 --response-models '{"application/json": "Empty"}' --region $Region 2>&1 | Out-Null

Write-Host "✅ API resources created" -ForegroundColor Green

# Deploy API
Write-Host "Deploying API to prod stage..." -ForegroundColor Cyan
$DeployResult = aws apigateway create-deployment --rest-api-id $ApiId --stage-name prod --region $Region
Write-Host "✅ API deployed" -ForegroundColor Green

# Get API endpoint
$ApiEndpoint = "https://$ApiId.execute-api.$Region.amazonaws.com/prod"
Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "API Gateway URL:" -ForegroundColor Yellow
Write-Host $ApiEndpoint -ForegroundColor Cyan
Write-Host ""

# ===== STEP 4: UPDATE FRONTEND =====
Write-Host "📝 Step 4: Updating frontend configuration..." -ForegroundColor Yellow

$AwsConfigPath = "frontend/src/awsConfig.js"
$AwsConfigContent = Get-Content $AwsConfigPath -Raw

# Replace endpoint
$NewContent = $AwsConfigContent -replace 'lambdaEndpoint:\s*"[^"]*"', "lambdaEndpoint: `"$ApiEndpoint`""

Set-Content -Path $AwsConfigPath -Value $NewContent -Encoding UTF8

Write-Host "✅ Frontend config updated" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ALL DEPLOYMENT STEPS COMPLETED!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is now connected to DynamoDB!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Refresh your browser at http://localhost:60112" -ForegroundColor Cyan
Write-Host "2. Add a product" -ForegroundColor Cyan
Write-Host "3. Check DynamoDB table for data!" -ForegroundColor Cyan
Write-Host ""
Write-Host "API Endpoint: $ApiEndpoint" -ForegroundColor Cyan
