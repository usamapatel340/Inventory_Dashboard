/**
 * Complete diagnostic endpoint
 * Shows everything about the current Firestore connection
 * Test: fetch('/api/full-diagnostic').then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))
 */

const admin = require("firebase-admin");

module.exports = async (req, res) => {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // Check 1: Node environment
    diagnostic.checks.nodeEnv = process.env.NODE_ENV || "unknown";
    diagnostic.checks.hasFirebaseConfig = process.env.FIREBASE_CONFIG
      ? "✅ YES"
      : "❌ NO";
    diagnostic.checks.hasAlertEmail = process.env.ALERT_EMAIL
      ? "✅ YES"
      : "❌ NO";

    // Check 2: Firebase apps
    diagnostic.checks.existingApps = admin.apps.length;

    if (!admin.apps.length) {
      try {
        console.log("Attempting Firebase initialization...");
        const config = JSON.parse(process.env.FIREBASE_CONFIG);
        console.log("Config parsed, project:", config.project_id);

        admin.initializeApp({
          credential: admin.credential.cert(config),
        });
        diagnostic.checks.firebaseInit = "✅ INITIALIZED";
      } catch (err) {
        diagnostic.checks.firebaseInit = "❌ FAILED: " + err.message;
        return res.status(500).json(diagnostic);
      }
    } else {
      diagnostic.checks.firebaseInit = "✅ ALREADY_INITIALIZED";
    }

    // Check 3: Firestore collection
    try {
      const db = admin.firestore();
      const snapshot = await db.collection("products").limit(1).get();
      diagnostic.checks.firestoreAccess = "✅ READABLE";
      diagnostic.checks.productCount =
        snapshot.parent.path +
        " has " +
        (await db.collection("products").count().get()).data().count +
        " products";
    } catch (err) {
      diagnostic.checks.firestoreAccess = "❌ ERROR: " + err.message;
    }

    // Check 4: Try to list products
    try {
      const db = admin.firestore();
      const snapshot = await db.collection("products").get();
      const products = [];
      snapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          name: doc.data().name,
          sku: doc.data().sku,
          qty: doc.data().qty,
        });
      });
      diagnostic.products = products;
      diagnostic.totalProducts = products.length;
    } catch (err) {
      diagnostic.productsError = err.message;
    }

    res.status(200).json(diagnostic);
  } catch (error) {
    diagnostic.error = error.message;
    diagnostic.stack = error.stack;
    res.status(500).json(diagnostic);
  }
};
