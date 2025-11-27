const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamodbClient = new DynamoDBClient({ region: "ap-south-1" });
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);
const sns = new SNSClient({ region: "ap-south-1" });

async function testAlert() {
  try {
    console.log("🧪 Testing SNS alert...\n");

    // Get a product from DynamoDB
    const products = await dynamodb.send(
      new GetCommand({
        TableName: "Products",
        Key: { product_id: "pav45bh5" }, // Watch product with low stock
      })
    );

    if (!products.Item) {
      console.log("❌ No product found with ID 1. Create a product first.");
      return;
    }

    const product = products.Item;
    console.log("Product found:", product.name);
    console.log("Current qty:", product.qty);
    console.log("Threshold:", product.threshold);
    console.log("Contact:", product.contact);

    if (!product.contact) {
      console.log("❌ Product has no contact email. Update the product first.");
      return;
    }

    // Send test alert
    console.log("\n📧 Sending test email...");
    const message = `⚠️ Low Stock Alert\n\nProduct: ${product.name}\nID: ${
      product.sku || product.product_id
    }\nCurrent Qty: ${product.qty}\nThreshold: ${
      product.threshold
    }\n\nPlease restock this item.`;

    const result = await sns.send(
      new PublishCommand({
        TopicArn: "arn:aws:sns:ap-south-1:873828695513:ExpenseSNS",
        Subject: `Low Stock: ${product.name}`,
        Message: message,
      })
    );

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", result.MessageId);
    console.log(
      "\n📬 Check your email (1jb23cs163@gmail.com) in a few seconds..."
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

testAlert();
