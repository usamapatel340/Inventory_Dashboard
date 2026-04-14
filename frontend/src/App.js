import React, { useState, useEffect } from "react";
import { hybridAPI } from "./api";

function Header({ counts }) {
    return ( <
        div >
        <
        div style = {
            { display: "flex", justifyContent: "space-between", alignItems: "center" } } >
        <
        div >
        <
        strong > Products: < /strong> {counts.total} &nbsp; <
        strong > Low Stock: < /strong> {counts.low} <
        /div> <
        div style = {
            { display: "flex", gap: 16, alignItems: "center" } } >
        <
        small > Firebase Firestore via Vercel < /small> <
        /div> <
        /div> <
        hr / >
        <
        /div>
    );
}

function ProductCard({ p, onAdjust, onEdit, onAlert, onShowHistory }) {
    const low = p.qty <= p.threshold;
    return ( <
        div style = {
            {
                padding: 12,
                marginBottom: 8,
                background: low ? "#fff4f4" : "#f4fff7",
                borderLeft: `4px solid ${low ? "#ff6b6b" : "#2ecc71"}`,
            }
        } >
        <
        div style = {
            { display: "flex", justifyContent: "space-between" } } >
        <
        div >
        <
        h4 style = {
            { margin: 0 } } > { p.name } < /h4> <
        div style = {
            { fontSize: "0.85em", color: "#666", marginBottom: 4 } } >
        SKU: { p.sku } <
        /div> <
        div style = {
            { fontSize: "0.85em" } } >
        Qty: < strong > { p.qty } < /strong> /
        Threshold: { p.threshold } {
            low && < span style = {
                    { color: "#c0392b" } } > ●LOW < /span>} <
                /div> <
                /div> <
                div style = {
                    { textAlign: "right" } } >
                <
                button onClick = {
                    () => onAdjust(p, +1) } > +Add < /button> <
                button style = {
                    { marginLeft: 6 } }
            onClick = {
                    () => onAdjust(p, -1) } > -Remove < /button> <
                div style = {
                    { marginTop: 8 } } >
                <
                button onClick = {
                    () => onEdit(p) }
            style = {
                    { fontSize: "0.85em" } } > Edit < /button> <
                button onClick = {
                    () => onAlert(p) }
            style = {
                    { fontSize: "0.85em", marginLeft: 6 } } > Alert < /button> <
                button onClick = {
                    () => onShowHistory(p) }
            style = {
                    { fontSize: "0.85em", marginLeft: 6 } } > History < /button> <
                /div> <
                /div> <
                /div> <
                /div>
        );
    }

    function ProductForm({ onSave, product, onCancel }) {
        const [name, setName] = useState(product ? .name || "");
        const [sku, setSku] = useState(product ? .sku || "");
        const [qty, setQty] = useState(product ? .qty || 0);
        const [threshold, setThreshold] = useState(product ? .threshold || 1);
        const [contact, setContact] = useState(product ? .contact || "");
        const [autoAlert, setAutoAlert] = useState(product ? .autoAlert || false);

        function submit(e) {
            e.preventDefault();
            const obj = {
                product_id: product ? .product_id || "p" + Math.random().toString(36).slice(2, 9),
                name,
                sku,
                qty: Number(qty),
                threshold: Number(threshold),
                contact,
                autoAlert,
            };
            onSave(obj);
        }

        return ( <
            form onSubmit = { submit }
            style = {
                { marginBottom: 20, padding: 20, border: "2px solid #e0e0e0", borderRadius: 8, backgroundColor: "#f9f9f9" } } >
            <
            h3 style = {
                { marginTop: 0, marginBottom: 15 } } > { product ? "Edit Product" : "Add New Product" } < /h3> <
            label > Name < /label> <
            input required value = { name }
            onChange = {
                (e) => setName(e.target.value) }
            /> <
            label > SKU < /label> <
            input required value = { sku }
            onChange = {
                (e) => setSku(e.target.value) }
            /> <
            div style = {
                { display: "flex", gap: 10 } } >
            <
            div > < label > Qty < /label><input type="number" value={qty} onChange={(e) => setQty(e.target.value)} / > < /div> <
            div > < label > Threshold < /label><input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} / > < /div> <
            /div> <
            label > Contact < /label> <
            input value = { contact }
            onChange = {
                (e) => setContact(e.target.value) }
            placeholder = "email@example.com" / >
            <
            label > < input type = "checkbox"
            checked = { autoAlert }
            onChange = {
                (e) => setAutoAlert(e.target.checked) }
            /> Auto-alert on low stock</label >
            <
            div style = {
                { marginTop: 10 } } >
            <
            button type = "submit" > Save < /button> <
            button type = "button"
            onClick = { onCancel }
            style = {
                { marginLeft: 8 } } > Cancel < /button> <
            /div> <
            /form>
        );
    }

    function HistoryModal({ product, onClose }) {
        if (!product) return null;
        return ( <
            div style = {
                { position: "fixed", left: 0, top: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" } } >
            <
            div style = {
                { maxWidth: 700, background: "#fff", padding: 20, borderRadius: 8 } } >
            <
            h3 > History - { product.name } < /h3> <
            div style = {
                { maxHeight: 400, overflow: "auto" } } > {
                product.history ? .length === 0 ? < div > No history < /div> : (product.history || []).map((h, i) => ( <
                div key = { i }
                style = {
                    { fontSize: "0.85em", padding: "4px 0" } } > { new Date(h.ts).toLocaleString() } - { h.type } { h.qtyChange } <
                /div>
            ))
    } <
    /div> <
    div style = {
            { marginTop: 10 } } >
        <
        button onClick = { onClose } > Close < /button> <
        /div> <
        /div> <
        /div>
);
}

export default function App() {
    const [data, setData] = useState({ products: [] });
    const [query, setQuery] = useState("");
    const [filterLow, setFilterLow] = useState(false);
    const [editing, setEditing] = useState(null);
    const [historyProduct, setHistoryProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    // LOAD PRODUCTS FROM FIRESTORE ON COMPONENT MOUNT
    useEffect(() => {
        async function loadProducts() {
            try {
                console.log("=== APP MOUNT: Loading from Firestore ===");
                setLoading(true);
                setErrorMsg(null);

                const result = await hybridAPI.getAll();
                console.log("📥 API Response:", result);

                if (!result) {
                    console.error("❌ No response from API");
                    setErrorMsg("No response from server");
                    setData({ products: [] });
                    return;
                }

                if (result.success === false) {
                    console.error("❌ API Error:", result.error);
                    setErrorMsg("API Error: " + result.error);
                    setData({ products: [] });
                    return;
                }

                if (!result.data) {
                    console.warn("⚠️ API returned no data (null or undefined)");
                    setData({ products: [] });
                    return;
                }

                if (!Array.isArray(result.data)) {
                    console.error("❌ API data is not an array:", typeof result.data, result.data);
                    setErrorMsg("Invalid response format");
                    setData({ products: [] });
                    return;
                }

                console.log(`✅ Loaded ${result.data.length} products`);
                setData({ products: result.data });
            } catch (err) {
                console.error("❌ Exception in loadProducts:", err);
                setErrorMsg("Error: " + err.message);
                setData({ products: [] });
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, []);

    function counts() {
        const total = data.products.length;
        const low = data.products.filter((p) => p.qty <= p.threshold).length;
        return { total, low };
    }

    async function upsertProduct(p) {
        try {
            const exists = data.products.find((x) => x.product_id === p.product_id);
            console.log(exists ? "Updating product" : "Creating product", p);

            const result = exists ?
                await hybridAPI.update(p.product_id, p) :
                await hybridAPI.create(p);

            if (result.success) {
                console.log("✅ Saved:", result.data);
                const newProduct = result.data || p;
                setData((prev) => ({
                    ...prev,
                    products: exists ?
                        prev.products.map((x) => x.product_id === newProduct.product_id ? {...x, ...newProduct } : x) :
                        [newProduct, ...prev.products],
                }));
                setEditing(null);
            } else {
                console.error("❌ Save failed:", result.error);
                alert("Failed to save: " + result.error);
            }
        } catch (err) {
            console.error("❌ Error in upsertProduct:", err);
            alert("Error: " + err.message);
        }
    }

    async function adjust(p, delta) {
        try {
            console.log(`Updating qty: ${p.name} ${delta > 0 ? '+' : ''}${delta}`);
            const result = await hybridAPI.updateQuantity(p.product_id, delta);

            if (result.success && result.data) {
                console.log("✅ Updated:", result.data);
                const updatedProduct = result.data;
                setData((prev) => ({
                    ...prev,
                    products: prev.products.map((x) => x.product_id === updatedProduct.product_id ? updatedProduct : x),
                }));
            } else {
                console.error("❌ Update failed:", result.error);
                alert("Failed: " + result.error);
            }
        } catch (err) {
            console.error("❌ Error in adjust:", err);
            alert("Error: " + err.message);
        }
    }

    async function manualSendAlert(p) {
        try {
            console.log("Sending alert for:", p.name);
            const result = await hybridAPI.sendAlert(p.product_id);
            if (result.success) {
                console.log("✅ Alert sent");
                alert("Alert sent for " + p.name);
            } else {
                console.error("❌ Alert failed:", result.error);
                alert("Failed: " + result.error);
            }
        } catch (err) {
            console.error("❌ Error:", err);
            alert("Error: " + err.message);
        }
    }

    const filtered = data.products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
    );
    const visible = filterLow ? filtered.filter((p) => p.qty <= p.threshold) : filtered;

    if (loading) {
        return ( <
            div style = {
                { padding: 16, textAlign: "center" } } >
            <
            h1 > Inventory Dashboard < /h1> <
            p > ⏳Loading from Firestore... < /p> <
            /div>
        );
    }

    return ( <
            div style = {
                { padding: 16 } } >
            <
            h1 > Inventory Dashboard < /h1> <
            Header counts = { counts() }
            /> {
                errorMsg && ( <
                    div style = {
                        { padding: 12, marginBottom: 12, background: "#ffebee", border: "1px solid #c62828", borderRadius: 4, color: "#c62828" } } > ⚠️{ errorMsg } <
                    /div>
                )
            } <
            div style = {
                { display: "flex", gap: 24 } } >
            <
            div style = {
                { flex: 2 } } >
            <
            div style = {
                { display: "flex", gap: 10, marginBottom: 10 } } >
            <
            input style = {
                { flex: 1 } }
            placeholder = "Search..."
            value = { query }
            onChange = {
                (e) => setQuery(e.target.value) }
            /> <
            label style = {
                { flex: 0 } } > < input type = "checkbox"
            checked = { filterLow }
            onChange = {
                (e) => setFilterLow(e.target.checked) }
            /> Low only</label >
            <
            button style = {
                { flex: 0 } }
            onClick = {
                () => setEditing({}) } > Add Product < /button> <
            /div> <
            div > {
                visible.map((p) => ( <
                    ProductCard key = { p.product_id }
                    p = { p }
                    onAdjust = { adjust }
                    onEdit = {
                        (prod) => setEditing(prod) }
                    onAlert = { manualSendAlert }
                    onShowHistory = {
                        (prod) => setHistoryProduct(prod) }
                    />
                ))
            } {
                visible.length === 0 && < div style = {
                        { padding: 20, textAlign: "center", color: "#999" } } > No products { data.products.length === 0 ? "(database empty)" : "(no matches)" } < /div>} <
                    /div> <
                    /div> <
                    div style = {
                        { flex: 1 } } >
                    <
                    div style = {
                        { padding: 12, background: "#e3f2fd", borderLeft: "4px solid #1976d2", borderRadius: 4 } } >
                    <
                    h4 > Info < /h4> <
                    p style = {
                        { fontSize: "0.85em", margin: 0 } } >
                    Total: < strong > { data.products.length } < /strong><br / >
                    Low Stock: < strong > { counts().low } < /strong> <
                    /p> <
                    button onClick = {
                        () => window.location.reload() }
                style = {
                        { marginTop: 8, width: "100%" } } > 🔄Refresh < /button> <
                    /div> <
                    /div> <
                    /div>

                {
                    editing !== null && ( <
                        div style = {
                            { position: "fixed", left: 0, top: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" } } >
                        <
                        div style = {
                            { maxWidth: 600, background: "#fff", padding: 20, borderRadius: 8 } } >
                        <
                        ProductForm product = { editing.product_id ? editing : null }
                        onSave = { upsertProduct }
                        onCancel = {
                            () => setEditing(null) }
                        /> <
                        /div> <
                        /div>
                    )
                }

                {
                    historyProduct && < HistoryModal product = { historyProduct }
                    onClose = {
                        () => setHistoryProduct(null) }
                    />} <
                    /div>
                );
            }