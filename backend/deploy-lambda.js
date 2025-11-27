const fs = require("fs");
const {
  LambdaClient,
  UpdateFunctionCodeCommand,
} = require("@aws-sdk/client-lambda");

const lambda = new LambdaClient({ region: "ap-south-1" });

async function deployLambda() {
  try {
    const zipBuffer = fs.readFileSync("./lambda-handler-updated.zip");

    console.log("📦 Deploying updated Lambda function...");
    const result = await lambda.send(
      new UpdateFunctionCodeCommand({
        FunctionName: "inventory-handler",
        ZipFile: zipBuffer,
      })
    );

    console.log("✅ Lambda deployment successful!");
    console.log("Function ARN:", result.FunctionArn);
    console.log("Last Modified:", result.LastModified);
    console.log("\n🎉 Updated Lambda is now live with ExpenseSNS topic ARN");
  } catch (err) {
    console.error("❌ Deployment failed:", err.message);
    console.error("Details:", err);
  }
}

deployLambda();
