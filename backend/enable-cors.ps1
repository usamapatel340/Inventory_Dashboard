# Enable CORS for API Gateway
$apiId = "0loi71mh9k"
$resourceId = "ojwjgt"
$region = "ap-south-1"

Write-Host "Step 1: Creating OPTIONS method..."
aws apigateway put-method `
  --rest-api-id $apiId `
  --resource-id $resourceId `
  --http-method OPTIONS `
  --authorization-type NONE `
  --region $region

Write-Host "Step 2: Creating MOCK integration..."
aws apigateway put-integration `
  --rest-api-id $apiId `
  --resource-id $resourceId `
  --http-method OPTIONS `
  --type MOCK `
  --request-templates "application/json={statusCode:200}" `
  --region $region

Write-Host "Step 3: Creating method response..."
aws apigateway put-method-response `
  --rest-api-id $apiId `
  --resource-id $resourceId `
  --http-method OPTIONS `
  --status-code 200 `
  --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" `
  --region $region

Write-Host "Step 4: Creating integration response..."
aws apigateway put-integration-response `
  --rest-api-id $apiId `
  --resource-id $resourceId `
  --http-method OPTIONS `
  --status-code 200 `
  --response-parameters "method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,PATCH,DELETE,OPTIONS',method.response.header.Access-Control-Allow-Origin='*'" `
  --region $region

Write-Host "Step 5: Deploying API..."
aws apigateway create-deployment `
  --rest-api-id $apiId `
  --stage-name prod `
  --region $region

Write-Host "CORS enabled successfully!"
