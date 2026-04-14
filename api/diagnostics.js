/**
 * Diagnostic Endpoint - Check Firestore Connection and Data
 */

const admin = require("firebase-admin");

// Initialize Firebase if not already done
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase initialized for diagnostics");
  } catch (error) {
    console.error("❌ Firebase initialization error:", error.message);
  }
}

const db = admin.firestore();

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

module.exports = async (req, res) => {
  try {
    console.log("🔍 Running diagnostics...");

    // Check Firebase Connection
    const firestoreReadable = await db.collection("products").limit(1).get();
    const firestoreStatus = firestoreReadable ? "connected" : "failed";

    // Get count of products
    const allProducts = await db.collection("products").get();
    const productCount = allProducts.size;
    const products = allProducts.docs.map((doc) => ({
      product_id: doc.id,
      ...doc.data(),
    }));

    // Check environment variables
    const envVars = {
      FIREBASE_CONFIG: process.env.FIREBASE_CONFIG ? "✅ Set" : "❌ Not set",
      ALERT_EMAIL: process.env.ALERT_EMAIL ? "✅ Set" : "❌ Not set",
      ALERT_EMAIL_PASSWORD: process.env.ALERT_EMAIL_PASSWORD
        ? "✅ Set"
        : "❌ Not set",
    };

    const diagnosticResult = {
      status: "ok",
      timestamp: new Date().toISOString(),
      firestore: {
        status: firestoreStatus,
        productCount,
        products: products,
        sampleProduct: products[0] || null,
      },
      environment: envVars,
      nodeVersion: process.version,
      message: "Diagnostics completed successfully",
    };

    res.status(200).json(diagnosticResult);
  } catch (error) {
    console.error("❌ Diagnostic error:", error);
    res.status(500).json({
      status: "error",
      error: error.message,
      stack: error.stack,
    });
  }
};
