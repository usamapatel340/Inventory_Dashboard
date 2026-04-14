/**
 * Check products in Firestore
 * Test: fetch('/api/products-in-firestore').then(r => r.json()).then(console.log)
 */

const admin = require("firebase-admin");

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

module.exports = async(req, res) => {
    try {
        console.log("=== CHECKING FIRESTORE PRODUCTS ===");

        const db = admin.firestore();
        const snapshot = await db.collection("products").get();

        console.log("Total products in Firestore:", snapshot.size);

        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json({
            total: snapshot.size,
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                qty: p.qty,
                threshold: p.threshold,
                createdAt: p.createdAt ? p.createdAt.toDate ? .() : p.createdAt
            }))
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({
            error: error.message
        });
    }
};