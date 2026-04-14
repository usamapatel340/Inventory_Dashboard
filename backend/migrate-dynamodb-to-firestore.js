#!/usr/bin/env node

/**
 * Migration Script: DynamoDB to Firestore
 * Exports data from your existing DynamoDB table and imports to Firestore
 *
 * Usage:
 *   node migrate-dynamodb-to-firestore.js
 *
 * Prerequisites:
 *   - AWS credentials configured (AWS CLI or environment variables)
 *   - Firebase Admin SDK initialized
 *   - Both databases accessible
 */

const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const admin = require("firebase-admin");
require("dotenv").config();

// Initialize connections
const dynamodbClient = new DynamoDBClient({ region: "ap-south-1" });
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const DYNAMODB_TABLE = "Products";
const FIRESTORE_COLLECTION = "products";

async function migrateData() {
  console.log("🚀 Starting DynamoDB → Firestore migration...\n");

  try {
    // Step 1: Export from DynamoDB
    console.log(`📊 Scanning DynamoDB table "${DYNAMODB_TABLE}"...`);
    const dynamoResult = await dynamodb.send(
      new ScanCommand({ TableName: DYNAMODB_TABLE }),
    );
    const products = dynamoResult.Items || [];
    console.log(`✅ Found ${products.length} products in DynamoDB\n`);

    if (products.length === 0) {
      console.log("⚠️  No products found in DynamoDB. Nothing to migrate.");
      return;
    }

    // Step 2: Import to Firestore
    console.log(
      `📝 Importing ${products.length} products to Firestore collection "${FIRESTORE_COLLECTION}"...\n`,
    );

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productId = product.product_id;

      try {
        // Convert timestamps if needed
        const firestoreProduct = {
          ...product,
          // Firestore Timestamp
          createdAt: product.createdAt
            ? admin.firestore.Timestamp.fromMillis(product.createdAt)
            : admin.firestore.Timestamp.now(),
          updatedAt: product.updatedAt
            ? admin.firestore.Timestamp.fromMillis(product.updatedAt)
            : admin.firestore.Timestamp.now(),
        };

        // Handle history timestamps
        if (product.history && Array.isArray(product.history)) {
          firestoreProduct.history = product.history.map((entry) => ({
            ...entry,
            ts: entry.ts
              ? admin.firestore.Timestamp.fromMillis(entry.ts)
              : admin.firestore.Timestamp.now(),
          }));
        }

        // Upload to Firestore
        await db
          .collection(FIRESTORE_COLLECTION)
          .doc(productId)
          .set(firestoreProduct);

        successCount++;
        console.log(
          `  ✅ [${i + 1}/${products.length}] Migrated: ${product.name}`,
        );
      } catch (error) {
        errorCount++;
        console.error(
          `  ❌ [${i + 1}/${products.length}] Error migrating ${productId}: ${error.message}`,
        );
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully migrated: ${successCount} products`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} products`);
    }
    console.log(`📦 Total processed: ${products.length} products`);
    console.log("=".repeat(50) + "\n");

    if (successCount === products.length) {
      console.log("🎉 Migration completed successfully!");
      console.log("\nNext steps:");
      console.log("1. Verify data in Firebase Console");
      console.log("2. Test API endpoints locally");
      console.log("3. Deploy to Vercel");
      console.log("4. Monitor Firestore in production");
    } else {
      console.log(
        `⚠️  Migration partially completed. ${errorCount} documents failed to migrate.`,
      );
      console.log("Please check the errors above and retry migration.");
    }
  } catch (error) {
    console.error("❌ Fatal error during migration:", error);
    process.exit(1);
  }
}

// Run migration
migrateData().catch(console.error);
