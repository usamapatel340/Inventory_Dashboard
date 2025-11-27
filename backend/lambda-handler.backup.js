/**
 * Lambda Function - Backend for Inventory Dashboard
 * Handles DynamoDB operations for Products table
 *
 * Deployment:
 * 1. Create a new Lambda function in ap-south-1 region
 * 2. Set up API Gateway to expose endpoints
 * 3. Update frontend awsConfig.js with Lambda endpoint
 *
 * Required environment variables:
 * - DYNAMODB_TABLE: Products
 * - AWS_REGION: ap-south-1
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamodbClient = new DynamoDBClient({ region: "ap-south-1" });
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);
const sns = new SNSClient({ region: "ap-south-1" });

const TABLE_NAME = "Products";

// Authorize function - check if user is authenticated
function authorize(event) {
  const token = event.headers?.Authorization || event.headers?.authorization;
  console.log("Authorization header:", token ? "Present" : "Missing");
  // For now, allow requests without strict validation
  // TODO: Add proper Cognito token validation
  return true;
}

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
  try {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: TABLE_NAME })
    );
    return response(200, result.Items || []);
  } catch (err) {
    console.error("Error fetching products:", err);
    return response(500, { error: err.message });
  }
}

// Get low stock items (qty <= threshold)
async function getLowStock() {
  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#qty <= #thr",
        ExpressionAttributeNames: { "#qty": "qty", "#thr": "threshold" },
      })
    );
    return response(200, result.Items || []);
  } catch (err) {
    console.error("Error fetching low stock:", err);
    return response(500, { error: err.message });
  }
}

// Search products by name or sku (contains, case-insensitive)
async function searchProducts(query) {
  try {
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
  } catch (err) {
    console.error("Error searching products:", err);
    return response(500, { error: err.message });
  }
}

// Get single product
async function getProduct(productId) {
  try {
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { product_id: productId },
    });
    return response(200, result.Item);
  } catch (err) {
    console.error("Error fetching product:", err);
    return response(500, { error: err.message });
  }
}

// Create product
async function createProduct(body) {
  try {
    const product = {
      product_id: "p" + Math.random().toString(36).slice(2, 9),
      ...body,
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dynamodb.send(
      new PutCommand({ TableName: TABLE_NAME, Item: product })
    );
    return response(201, product);
  } catch (err) {
    console.error("Error creating product:", err);
    return response(500, { error: err.message });
  }
}

// Update product
async function updateProduct(productId, body) {
  try {
    const product = { ...body, updatedAt: Date.now() };
    await dynamodb.update({
      TableName: TABLE_NAME,
      Key: { product_id: productId },
      UpdateExpression:
        "SET " +
        Object.keys(product)
          .map((k) => `${k} = :${k}`)
          .join(", "),
      ExpressionAttributeValues: Object.keys(product).reduce((acc, k) => {
        acc[`:${k}`] = product[k];
        return acc;
      }, {}),
    });
    return response(200, { product_id: productId, ...product });
  } catch (err) {
    console.error("Error updating product:", err);
    return response(500, { error: err.message });
  }
}

// Update product quantity
async function updateQuantity(productId, delta) {
  try {
    const getResult = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { product_id: productId },
    });
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

    await dynamodb.put({ TableName: TABLE_NAME, Item: updatedProduct });

    // Check if alert should be triggered
    if (
      oldQty > product.threshold &&
      newQty <= product.threshold &&
      product.autoAlert
    ) {
      await sendAlert(product);
    }

    return response(200, updatedProduct);
  } catch (err) {
    console.error("Error updating quantity:", err);
    return response(500, { error: err.message });
  }
}

// Delete product
async function deleteProduct(productId) {
  try {
    await dynamodb.delete({
      TableName: TABLE_NAME,
      Key: { product_id: productId },
    });
    return response(200, { success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    return response(500, { error: err.message });
  }
}

// Send SNS alert
async function sendAlert(product) {
  try {
    const message = `Low stock alert: ${product.name} (${product.sku}) has only ${product.qty} units left (threshold: ${product.threshold})`;

    if (product.contact) {
      // Send SMS if contact is a phone number, Email if it's an email
      const params = {
        Message: message,
        Subject: `Low Stock Alert: ${product.name}`,
      };

      if (product.contact.includes("@")) {
        // Email
        params.TopicArn =
          "arn:aws:sns:ap-south-1:873828695513:inventory-alerts"; // Replace with your topic
      } else {
        // SMS
        params.PhoneNumber = product.contact;
      }

      await sns.send(new PublishCommand(params));
      console.log("Alert sent:", message);
    }
    return { success: true };
  } catch (err) {
    console.error("Error sending alert:", err);
    return { success: false, error: err.message };
  }
}

// Send alert for a specific product id
async function sendAlertById(productId) {
  try {
    const res = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { product_id: productId },
    });
    if (!res.Item) return response(404, { error: "Product not found" });
    const result = await sendAlert(res.Item);
    if (result.success) return response(200, { success: true });
    return response(500, { error: result.error || "Failed to send alert" });
  } catch (err) {
    console.error("Error sending alert by id:", err);
    return response(500, { error: err.message });
  }
}

// Main Lambda handler
exports.handler = async (event) => {
  try {
    console.log("Event:", JSON.stringify(event));

    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return response(200, { message: "OK" });
    }

    authorize(event);

    const method = event.httpMethod;
    let path = event.path;

    // Remove /prod prefix if present (API Gateway stage)
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
    return response(500, { error: err.message });
  }
};
