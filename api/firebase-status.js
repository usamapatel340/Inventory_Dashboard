/**
 * Simple Firebase connection check
 * Test: fetch('/api/firebase-status').then(r => r.json()).then(console.log)
 */

const admin = require("firebase-admin");

module.exports = async (req, res) => {
  try {
    console.log("=== FIREBASE STATUS CHECK ===");
    console.log("Admin apps count:", admin.apps.length);
    console.log(
      "FIREBASE_CONFIG env set:",
      process.env.FIREBASE_CONFIG ? "YES" : "NO",
    );

    if (!admin.apps.length) {
      console.log("No Firebase apps initialized - trying to init...");
      try {
        const config = JSON.parse(process.env.FIREBASE_CONFIG);
        console.log("Config parsed - project_id:", config.project_id);
        admin.initializeApp({
          credential: admin.credential.cert(config),
        });
        console.log("✅ Firebase initialized");
      } catch (err) {
        console.error("❌ Failed to init Firebase:", err.message);
        return res.status(500).json({
          firebase: "NOT_INITIALIZED",
          error: err.message,
          configSet: process.env.FIREBASE_CONFIG ? "YES" : "NO",
        });
      }
    }

    // Test Firestore connection
    console.log("Testing Firestore connection...");
    const db = admin.firestore();
    const test = await db.collection("products").limit(1).get();

    console.log("✅ Firestore connection successful");
    console.log("Sample product docs:", test.size);

    res.status(200).json({
      firebase: "CONNECTED",
      firestore: {
        readable: true,
        productCount: test.size,
      },
      environment: {
        FIREBASE_CONFIG_SET: process.env.FIREBASE_CONFIG ? true : false,
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("Status check error:", error.message);
    res.status(500).json({
      firebase: "ERROR",
      error: error.message,
      stack: error.stack,
    });
  }
};
