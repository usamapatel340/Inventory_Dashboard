/**
 * Debug endpoint to trace API failures
 * Access at: /api/debug
 */

const admin = require("firebase-admin");

// Initialize Firebase
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase init error:", error.message);
  }
}

module.exports = async (req, res) => {
  try {
    console.log("DEBUG: Request received", {
      method: req.method,
      url: req.url,
    });

    const db = admin.firestore();
    const debug = {
      timestamp: new Date().toISOString(),
      message: "Debug info",
      checks: {},
      data: {},
    };

    // Check 1: Firebase connection
    try {
      const snapshot = await db.collection("products").limit(1).get();
      debug.checks.firestore_connection = "✅ Connected";
      debug.checks.firestore_readable =
        snapshot.docs.length >= 0 ? "✅ Yes" : "❌ No";
    } catch (err) {
      debug.checks.firestore_connection = "❌ " + err.message;
    }

    // Check 2: Product count
    try {
      const snapshot = await db.collection("products").get();
      debug.data.product_count = snapshot.size;
      debug.data.products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      debug.data.product_error = err.message;
    }

    // Check 3: Environment
    debug.environment = {
      FIREBASE_CONFIG: process.env.FIREBASE_CONFIG
        ? "✅ Set (" + process.env.FIREBASE_CONFIG.length + " bytes)"
        : "❌ Not set",
      ALERT_EMAIL: process.env.ALERT_EMAIL ? "✅ Set" : "❌ Not set",
      NODE_ENV: process.env.NODE_ENV,
    };

    res.status(200).json(debug);
  } catch (error) {
    console.error("DEBUG ERROR:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
};
