/**
 * Lambda Function - Backend for Inventory Dashboard
 * AWS SDK v3 compatible
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamodbClient = new DynamoDBClient({ region: "ap-south-1" });
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);
const sns = new SNSClient({ region: "ap-south-1" });

const TABLE_NAME = "Products";

// Response helper
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

// Get all products
async function getProducts() {
  const result = await dynamodb.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  return response(200, result.Items || []);
}

// Get single product
async function getProduct(productId) {
  const result = await dynamodb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { product_id: productId } })
  );
  return response(200, result.Item || null);
}

// Create product
async function createProduct(body) {
  const product = {
    product_id: "p" + Math.random().toString(36).slice(2, 9),
    ...body,
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await dynamodb.send(new PutCommand({ TableName: TABLE_NAME, Item: product }));
  return response(201, product);
}

// Update product
async function updateProduct(productId, body) {
  const getResult = await dynamodb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { product_id: productId } })
  );
  const existingProduct = getResult.Item;
  if (!existingProduct) return response(404, { error: "Product not found" });

  const updatedProduct = {
    ...existingProduct,
    ...body,
    product_id: productId, // Ensure product_id doesn't change
    updatedAt: Date.now(),
  };
  await dynamodb.send(
    new PutCommand({ TableName: TABLE_NAME, Item: updatedProduct })
  );
  return response(200, updatedProduct);
}

// Update quantity
async function updateQuantity(productId, delta) {
  const getResult = await dynamodb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { product_id: productId } })
  );
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

  await dynamodb.send(
    new PutCommand({ TableName: TABLE_NAME, Item: updatedProduct })
  );

  // Auto-trigger alert if below threshold and autoAlert is enabled
  if (newQty <= product.threshold && product.autoAlert && product.contact) {
    try {
      const message = `⚠️ Low Stock Alert\n\nProduct: ${product.name}\nID: ${product.sku}\nCurrent Qty: ${newQty}\nThreshold: ${product.threshold}\n\nPlease restock this item.`;

      await sns.send(
        new PublishCommand({
          TopicArn: "arn:aws:sns:ap-south-1:873828695513:ExpenseSNS",
          Subject: `Low Stock: ${product.name}`,
          Message: message,
        })
      );

      console.log(`✅ Auto-alert sent for ${product.name}`);
    } catch (err) {
      console.error("⚠️ Failed to auto-send alert:", err.message);
    }
  }

  return response(200, updatedProduct);
}

// Delete product
async function deleteProduct(productId) {
  await dynamodb.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { product_id: productId } })
  );
  return response(200, { success: true });
}

// Get low stock
async function getLowStock() {
  const result = await dynamodb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "#qty <= #thr",
      ExpressionAttributeNames: { "#qty": "qty", "#thr": "threshold" },
    })
  );
  return response(200, result.Items || []);
}

// Search products
async function searchProducts(query) {
  if (!query || query.trim().length === 0) return response(200, []);
  const q = query.toLowerCase();
  const result = await dynamodb.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  const items = (result.Items || []).filter((p) => {
    const name = (p.name || "").toLowerCase();
    const sku = (p.sku || "").toLowerCase();
    return name.includes(q) || sku.includes(q);
  });
  return response(200, items);
}

// Send alert via SNS
async function sendAlertById(productId) {
  const res = await dynamodb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { product_id: productId } })
  );
  if (!res.Item) return response(404, { error: "Product not found" });

  const product = res.Item;
  if (!product.contact) {
    return response(400, { error: "Product has no contact information" });
  }

  try {
    const message = `⚠️ Low Stock Alert\n\nProduct: ${product.name}\nID: ${product.sku}\nCurrent Qty: ${product.qty}\nThreshold: ${product.threshold}\n\nPlease restock this item.`;

    await sns.send(
      new PublishCommand({
        TopicArn: "arn:aws:sns:ap-south-1:873828695513:ExpenseSNS",
        Subject: `Low Stock: ${product.name}`,
        Message: message,
      })
    );

    console.log(
      `✅ Alert sent for product: ${product.name} to ${product.contact}`
    );
    return response(200, { success: true, message: "Alert sent successfully" });
  } catch (err) {
    console.error("❌ Failed to send alert:", err);
    return response(500, {
      error: "Failed to send alert",
      details: err.message,
    });
  }
}

// Main handler
exports.handler = async (event) => {
  try {
    console.log("Event:", JSON.stringify(event));

    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return response(200, { message: "OK" });
    }

    const method = event.httpMethod;
    let path = event.path;

    // Remove /prod prefix if present
    if (path.startsWith("/prod/")) {
      path = path.substring(5);
    }

    console.log("Method:", method, "Path:", path);

    // Route requests
    if (method === "GET" && path === "/products") {
      return await getProducts();
    }
    if (method === "GET" && path === "/products/low-stock") {
      return await getLowStock();
    }
    if (method === "GET" && path.startsWith("/products/search")) {
      const q = event.queryStringParameters?.q || "";
      return await searchProducts(q);
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
    if (method === "PATCH" && path.match(/^\/products\/[^/]+\/quantity$/)) {
      const productId = path.split("/")[2];
      const { delta } = JSON.parse(event.body);
      return await updateQuantity(productId, delta);
    }
    if (method === "DELETE" && path.match(/^\/products\/[^/]+$/)) {
      const productId = path.split("/")[2];
      return await deleteProduct(productId);
    }
    if (method === "POST" && path.match(/^\/products\/[^/]+\/alert$/)) {
      const productId = path.split("/")[2];
      return await sendAlertById(productId);
    }

    return response(404, { error: "Route not found", path, method });
  } catch (err) {
    console.error("Error:", err);
    return response(500, { error: err.message, stack: err.stack });
  }
};
