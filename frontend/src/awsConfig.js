// AWS Configuration for DynamoDB Integration
export const awsConfig = {
  region: "ap-south-1", // âœ… Asia Pacific (Mumbai)
  dynamodb: {
    tableArn: "arn:aws:dynamodb:ap-south-1:873828695513:table/Products",
    tableName: "Products", // âœ… Your table name
  },
  // Lambda endpoint - API Gateway URL
  // Format: https://<api-id>.execute-api.ap-south-1.amazonaws.com/<stage>
  lambdaEndpoint:
    process.env.REACT_APP_LAMBDA_ENDPOINT ||
    "https://0loi71mh9k.execute-api.ap-south-1.amazonaws.com/prod",
  accountId: "873828695513", // âœ… Your AWS Account ID
};

export default awsConfig;
