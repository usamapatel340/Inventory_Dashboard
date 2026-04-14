const admin = require("firebase-admin");
require("dotenv").config({ path: ".env.local" });

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Sample products data
const sampleProducts = [
  {
    name: "Laptop",
    sku: "TECH-001",
    qty: 15,
    threshold: 10,
    autoAlert: true,
    contact: "manager@company.com",
    price: 999.99,
    category: "Electronics",
    history: [
      {
        type: "restock",
        qtyChange: 50,
        ts: new Date().toISOString(),
      },
    ],
  },
  {
    name: "Mouse",
    sku: "TECH-002",
    qty: 3,
    threshold: 5,
    autoAlert: true,
    contact: "manager@company.com",
    price: 29.99,
    category: "Electronics",
    history: [],
  },
  {
    name: "Keyboard",
    sku: "TECH-003",
    qty: 25,
    threshold: 10,
    autoAlert: false,
    contact: "manager@company.com",
    price: 79.99,
    category: "Electronics",
    history: [],
  },
  {
    name: "Monitor",
    sku: "TECH-004",
    qty: 8,
    threshold: 5,
    autoAlert: true,
    contact: "manager@company.com",
    price: 299.99,
    category: "Electronics",
    history: [],
  },
  {
    name: "Desk Chair",
    sku: "FURN-001",
    qty: 100,
    threshold: 20,
    autoAlert: false,
    contact: "manager@company.com",
    price: 199.99,
    category: "Furniture",
    history: [],
  },
];

async function addSampleProducts() {
  console.log("🔄 Adding sample products to Firestore...\n");

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const product of sampleProducts) {
      try {
        const docRef = await db.collection("products").add({
          ...product,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });

        console.log(`✅ Added: ${product.name} (ID: ${docRef.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error adding ${product.name}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully added: ${successCount} products`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} products`);
    }
    console.log(`📦 Total: ${successCount + errorCount} products`);
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

addSampleProducts();

// Test 1: Firebase connection
fetch("/api/firebase-status")
  .then((r) => r.json())
  .then((d) => console.log("Firebase Status:", JSON.stringify(d, null, 2)));

// Test 2: Check what's actually in Firestore
fetch("/api/products-in-firestore")
  .then((r) => r.json())
  .then((d) => console.log("Firestore Products:", JSON.stringify(d, null, 2)));

// Test 3: Try creating a product directly via API
fetch("/api/products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test Direct",
    sku: "DIRECT-001",
    qty: 5,
    threshold: 2,
    category: "Test",
    contact: "test@test.com",
    autoAlert: false,
  }),
}).then((r) =>
  r
    .json()
    .then((d) => console.log("Create Response:", JSON.stringify(d, null, 2))),
);
