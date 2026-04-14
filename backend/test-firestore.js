const admin = require("firebase-admin");
require("dotenv").config({ path: ".env.local" });

console.log("🔍 Initializing Firebase...");

try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();
  console.log("✅ Firebase initialized successfully!");

  // Test: Get all products
  db.collection("products")
    .get()
    .then((snapshot) => {
      console.log(`✅ Connected to Firestore!`);
      console.log(`📊 Products found: ${snapshot.size}`);

      snapshot.forEach((doc) => {
        console.log(`   - ${doc.id}: ${doc.data().name || "Unknown"}`);
      });

      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Error reading products:", err.message);
      process.exit(1);
    });
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
