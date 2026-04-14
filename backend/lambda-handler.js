/**
 * Firestore Backend - Inventory Dashboard
 * Firebase Admin SDK for Vercel serverless
 */

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin SDK (uses FIREBASE_CONFIG from environment)
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();
const COLLECTION_NAME = "products";

// Email configuration for alerts
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.ALERT_EMAIL,
        pass: process.env.ALERT_EMAIL_PASSWORD,
    },
});

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
        const snapshot = await db.collection(COLLECTION_NAME).get();
        const items = snapshot.docs.map((doc) => ({
            product_id: doc.id,
            ...doc.data(),
        }));
        return response(200, items);
    } catch (error) {
        console.error("Error fetching products:", error);
        return response(500, { error: "Failed to fetch products" });
    }
}

// Get single product
async function getProduct(productId) {
    try {
        const doc = await db.collection(COLLECTION_NAME).doc(productId).get();
        if (!doc.exists) {
            return response(404, { error: "Product not found" });
        }
        return response(200, { product_id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error fetching product:", error);
        return response(500, { error: "Failed to fetch product" });
    }
}

// Create product
async function createProduct(body) {
    try {
        const product = {
            ...body,
            history: [],
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        };
        const docRef = await db.collection(COLLECTION_NAME).add(product);
        return response(201, { product_id: docRef.id, ...product });
    } catch (error) {
        console.error("Error creating product:", error);
        return response(500, { error: "Failed to create product" });
    }
}

// Update product
async function updateProduct(productId, body) {
    try {
        const docRef = db.collection(COLLECTION_NAME).doc(productId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return response(404, { error: "Product not found" });
        }

        const updatedProduct = {
            ...doc.data(),
            ...body,
            product_id: productId,
            updatedAt: admin.firestore.Timestamp.now(),
        };

        await docRef.set(updatedProduct);
        return response(200, { product_id: docRef.id, ...updatedProduct });
    } catch (error) {
        console.error("Error updating product:", error);
        return response(500, { error: "Failed to update product" });
    }
}

// Update quantity
async function updateQuantity(productId, delta) {
    try {
        const docRef = db.collection(COLLECTION_NAME).doc(productId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return response(404, { error: "Product not found" });
        }

        const product = doc.data();
        const oldQty = product.qty || 0;
        const newQty = Math.max(0, oldQty + delta);
        const historyEntry = {
            type: delta > 0 ? "restock" : "sale",
            qtyChange: delta,
            ts: admin.firestore.Timestamp.now(),
        };

        const updatedProduct = {
            ...product,
            qty: newQty,
            history: [historyEntry, ...(product.history || [])],
            updatedAt: admin.firestore.Timestamp.now(),
        };

        await docRef.set(updatedProduct);

        // Auto-trigger alert if below threshold and autoAlert is enabled
        if (newQty <= product.threshold && product.autoAlert && product.contact) {
            try {
                const message = `⚠️ Low Stock Alert\n\nProduct: ${product.name}\nID: ${product.sku}\nCurrent Qty: ${newQty}\nThreshold: ${product.threshold}\n\nPlease restock this item.`;

                await transporter.sendMail({
                    from: process.env.ALERT_EMAIL,
                    to: product.contact,
                    subject: `Low Stock: ${product.name}`,
                    text: message,
                });

                console.log(`✅ Auto-alert sent for ${product.name}`);
            } catch (err) {
                console.error("⚠️ Failed to auto-send alert:", err.message);
            }
        }

        return response(200, { product_id: productId, ...updatedProduct });
    } catch (error) {
        console.error("Error updating quantity:", error);
        return response(500, { error: "Failed to update quantity" });
    }
}

// Delete product
async function deleteProduct(productId) {
    try {
        await db.collection(COLLECTION_NAME).doc(productId).delete();
        return response(200, { success: true });
    } catch (error) {
        console.error("Error deleting product:", error);
        return response(500, { error: "Failed to delete product" });
    }
}

// Get low stock products
async function getLowStock() {
    try {
        const snapshot = await db
            .collection(COLLECTION_NAME)
            .where("qty", "<=", admin.firestore.FieldValue.serverTimestamp ? 0 : 999)
            .get();

        const items = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if ((data.qty || 0) <= (data.threshold || 0)) {
                items.push({ product_id: doc.id, ...data });
            }
        });

        return response(200, items);
    } catch (error) {
        console.error("Error fetching low stock:", error);
        return response(500, { error: "Failed to fetch low stock products" });
    }
}

// Search products
async function searchProducts(query) {
    try {
        if (!query || query.trim().length === 0) return response(200, []);

        const q = query.toLowerCase();
        const snapshot = await db.collection(COLLECTION_NAME).get();
        const items = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const name = (data.name || "").toLowerCase();
            const sku = (data.sku || "").toLowerCase();

            if (name.includes(q) || sku.includes(q)) {
                items.push({ product_id: doc.id, ...data });
            }
        });

        return response(200, items);
    } catch (error) {
        console.error("Error searching products:", error);
        return response(500, { error: "Failed to search products" });
    }
}

// Send alert via email
async function sendAlertById(productId) {
    try {
        const doc = await db.collection(COLLECTION_NAME).doc(productId).get();

        if (!doc.exists) {
            return response(404, { error: "Product not found" });
        }

        const product = doc.data();
        if (!product.contact) {
            return response(400, { error: "Product has no contact information" });
        }

        const message = `⚠️ Low Stock Alert\n\nProduct: ${product.name}\nID: ${product.sku}\nCurrent Qty: ${product.qty}\nThreshold: ${product.threshold}\n\nPlease restock this item.`;

        await transporter.sendMail({
            from: process.env.ALERT_EMAIL,
            to: product.contact,
            subject: `Low Stock: ${product.name}`,
            text: message,
        });

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
async function handler(event, context) {
    const method = event.requestContext ? .http ? .method || event.httpMethod;
    const path = event.rawPath || event.path || "";
    const body = event.body ? JSON.parse(event.body) : {};

    console.log(`📝 ${method} ${path}`);

    try {
        // Products endpoints
        if (path.includes("/products") && method === "GET") {
            const productId = path.split("/").pop();
            if (productId && productId !== "products") {
                return await getProduct(productId);
            }
            return await getProducts();
        }

        if (path.includes("/products") && method === "POST") {
            return await createProduct(body);
        }

        if (path.includes("/products") && method === "PUT") {
            const productId = path.split("/").pop();
            return await updateProduct(productId, body);
        }

        if (path.includes("/products") && method === "DELETE") {
            const productId = path.split("/").pop();
            return await deleteProduct(productId);
        }

        // Quantity endpoint
        if (path.includes("/quantity") && method === "PATCH") {
            const productId = body.product_id;
            const delta = body.delta || 0;
            return await updateQuantity(productId, delta);
        }

        // Low stock endpoint
        if (path.includes("/low-stock") && method === "GET") {
            return await getLowStock();
        }

        // Search endpoint
        if (path.includes("/search") && method === "GET") {
            const query = new URL(event.rawPath, "http://localhost").searchParams.get("q") || "";
            return await searchProducts(query);
        }

        // Alert endpoint
        if (path.includes("/alert") && method === "POST") {
            const productId = body.product_id;
            return await sendAlertById(productId);
        }

        return response(404, { error: "Endpoint not found" });
    } catch (error) {
        console.error("❌ Error:", error);
        return response(500, { error: "Internal server error" });
    }
}

module.exports = { handler };

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
exports.handler = async(event) => {
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
            const q = event.queryStringParameters ? .q || "";
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