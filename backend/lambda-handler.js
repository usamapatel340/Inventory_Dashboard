/**
 * Firestore Backend - Inventory Dashboard
 * Firebase Admin SDK for Vercel serverless
 */

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin SDK (uses FIREBASE_CONFIG from environment)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase initialized successfully");
    } catch (error) {
        console.error("❌ Firebase initialization error:", error.message);
        throw error;
    }
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
        console.log(`✅ Retrieved ${items.length} products`);
        return response(200, items);
    } catch (error) {
        console.error("❌ Error fetching products:", error);
        return response(500, { error: "Failed to fetch products", details: error.message });
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
        console.error("❌ Error fetching product:", error);
        return response(500, { error: "Failed to fetch product", details: error.message });
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
        console.log(`✅ Created product: ${docRef.id}`);
        return response(201, { product_id: docRef.id, ...product });
    } catch (error) {
        console.error("❌ Error creating product:", error);
        return response(500, { error: "Failed to create product", details: error.message });
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
        console.log(`✅ Updated product: ${productId}`);
        return response(200, { product_id: productId, ...updatedProduct });
    } catch (error) {
        console.error("❌ Error updating product:", error);
        return response(500, { error: "Failed to update product", details: error.message });
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
        console.log(`✅ Updated quantity for ${productId}: ${oldQty} → ${newQty}`);

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
        console.error("❌ Error updating quantity:", error);
        return response(500, { error: "Failed to update quantity", details: error.message });
    }
}

// Delete product
async function deleteProduct(productId) {
    try {
        await db.collection(COLLECTION_NAME).doc(productId).delete();
        console.log(`✅ Deleted product: ${productId}`);
        return response(200, { success: true });
    } catch (error) {
        console.error("❌ Error deleting product:", error);
        return response(500, { error: "Failed to delete product", details: error.message });
    }
}

// Get low stock products
async function getLowStock() {
    try {
        const snapshot = await db.collection(COLLECTION_NAME).get();
        const items = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            if ((data.qty || 0) <= (data.threshold || 0)) {
                items.push({ product_id: doc.id, ...data });
            }
        });

        console.log(`✅ Found ${items.length} low stock items`);
        return response(200, items);
    } catch (error) {
        console.error("❌ Error fetching low stock:", error);
        return response(500, { error: "Failed to fetch low stock products", details: error.message });
    }
}

// Search products
async function searchProducts(query) {
    try {
        if (!query || query.trim().length === 0) {
            return response(200, []);
        }

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

        console.log(`✅ Search found ${items.length} products for: ${query}`);
        return response(200, items);
    } catch (error) {
        console.error("❌ Error searching products:", error);
        return response(500, { error: "Failed to search products", details: error.message });
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

        console.log(`✅ Alert sent for product: ${product.name} to ${product.contact}`);
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
    try {
        // Extract HTTP method and path
        const method = event.httpMethod || event.requestContext?.http?.method;
        const path = event.path || event.rawPath || "";
        
        // Parse body
        let body = {};
        if (event.body) {
            try {
                body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
            } catch (e) {
                console.error("⚠️ Failed to parse body:", e.message);
            }
        }

        console.log(`📝 ${method} ${path}`);

        // Route requests
        
        // GET /products or /products/search
        if (method === "GET" && path === "/products") {
            return await getProducts();
        }
        
        if (method === "GET" && path === "/products/low-stock") {
            return await getLowStock();
        }
        
        if (method === "GET" && path.includes("/products/search")) {
            const url = new URL(`http://localhost${path}${event.queryStringParameters ? "?" + new URLSearchParams(event.queryStringParameters).toString() : ""}`);
            const query = url.searchParams.get("q") || "";
            return await searchProducts(query);
        }
        
        if (method === "GET" && /^\/products\/[^/]+$/.test(path)) {
            const productId = path.split("/")[2];
            return await getProduct(productId);
        }

        // POST /products
        if (method === "POST" && path === "/products") {
            return await createProduct(body);
        }

        // PUT /products/:id
        if (method === "PUT" && /^\/products\/[^/]+$/.test(path)) {
            const productId = path.split("/")[2];
            return await updateProduct(productId, body);
        }

        // PATCH /products/:id/quantity
        if (method === "PATCH" && /^\/products\/[^/]+\/quantity$/.test(path)) {
            const productId = path.split("/")[2];
            const delta = body.delta || 0;
            return await updateQuantity(productId, delta);
        }

        // DELETE /products/:id
        if (method === "DELETE" && /^\/products\/[^/]+$/.test(path)) {
            const productId = path.split("/")[2];
            return await deleteProduct(productId);
        }

        // POST /products/:id/alert
        if (method === "POST" && /^\/products\/[^/]+\/alert$/.test(path)) {
            const productId = path.split("/")[2];
            return await sendAlertById(productId);
        }

        // Handle OPTIONS (CORS preflight)
        if (method === "OPTIONS") {
            return response(200, { message: "OK" });
        }

        return response(404, { error: "Route not found", path, method });
    } catch (err) {
        console.error("❌ Handler error:", err);
        return response(500, { error: "Internal server error", details: err.message });
    }
}

module.exports = { handler };
