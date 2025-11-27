const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const dynamodbClient = new DynamoDBClient({ region: "ap-south-1" });
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

async function getProducts() {
  try {
    console.log("📦 Fetching all products...\n");
    const result = await dynamodb.send(
      new ScanCommand({ TableName: "Products" })
    );

    if (result.Items.length === 0) {
      console.log("❌ No products found in database.");
      return;
    }

    console.log(`✅ Found ${result.Items.length} product(s):\n`);
    result.Items.forEach((item, i) => {
      console.log(`${i + 1}. ${item.name}`);
      console.log(`   ID: ${item.product_id}`);
      console.log(`   Qty: ${item.qty}, Threshold: ${item.threshold}`);
      console.log(`   Contact: ${item.contact || "NOT SET"}`);
      console.log("");
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

getProducts();
