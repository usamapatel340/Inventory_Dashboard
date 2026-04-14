import React, { useState, useEffect } from "react";
import { hybridAPI, productsAPI } from "./api";

function Header({ counts }) {
    return ( <
        div >
        <
        div style = {
            { display: "flex", justifyContent: "space-between", alignItems: "center" } } >
        <
        div >
        <
        strong > Products: < /strong> {counts.total} | <strong>Low Stock:</strong > { counts.low } <
        /div> <
        small > Firebase Firestore via Vercel < /small> <
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
                borderLeft: `4px solid ${low ? "#ff6b6b" : "#2ecc71"}`,
                background: low ? "#fff4f4" : "#f4fff7"
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
            { fontSize: "0.85em", color: "#666" } } > SKU: { p.sku } < /div> <
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
                    () => onAdjust(p, 1) } > +Add < /button> <
                button onClick = {
                    () => onAdjust(p, -1) }
            style = {
                    { marginLeft: 6 } } > -Remove < /button> <
                div style = {
                    { marginTop: 8, fontSize: "0.75em" } } >
                <
                button onClick = {
                    () => onEdit(p) } > Edit < /button> <
                button onClick = {
                    () => onAlert(p) }
            style = {
                    { marginLeft: 4 } } > Alert < /button> <
                button onClick = {
                    () => onShowHistory(p) }
            style = {
                    { marginLeft: 4 } } > History < /button> <
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
        const [category, setCategory] = useState(product ? .category || "");
        const [price, setPrice] = useState(product ? .price || 0);
        const [autoAlert, setAutoAlert] = useState(product ? .autoAlert || false);

        function submit(e) {
            e.preventDefault();
            onSave({
                product_id: product ? .product_id || "p" + Math.random().toString(36).slice(2, 9),
                name,
                sku,
                qty: Number(qty),
                threshold: Number(threshold),
                contact,
                category,
                price: Number(price),
                autoAlert
            });
        }

        return ( <
            form onSubmit = { submit }
            style = {
                { padding: 20, border: "2px solid #e0e0e0", borderRadius: 8 } } >
            <
            h3 > { product ? "Edit Product" : "Add New Product" } < /h3> <
            label > < strong > Name * < /strong></label >
            <
            input required value = { name }
            onChange = {
                (e) => setName(e.target.value) }
            style = {
                { width: "100%", marginBottom: 10 } }
            />

            <
            label > < strong > SKU * < /strong></label >
            <
            input required value = { sku }
            onChange = {
                (e) => setSku(e.target.value) }
            style = {
                { width: "100%", marginBottom: 10 } }
            />

            <
            label > < strong > Category < /strong></label >
            <
            input value = { category }
            onChange = {
                (e) => setCategory(e.target.value) }
            style = {
                { width: "100%", marginBottom: 10 } }
            />

            <
            label > < strong > Price < /strong></label >
            <
            input type = "number"
            step = "0.01"
            value = { price }
            onChange = {
                (e) => setPrice(e.target.value) }
            style = {
                { width: "100%", marginBottom: 10 } }
            />

            <
            div style = {
                { display: "flex", gap: 10 } } >
            <
            div style = {
                { flex: 1 } } >
            <
            label > < strong > Qty < /strong></label >
            <
            input type = "number"
            value = { qty }
            onChange = {
                (e) => setQty(e.target.value) }
            style = {
                { width: "100%" } }
            /> <
            /div> <
            div style = {
                { flex: 1 } } >
            <
            label > < strong > Threshold < /strong></label >
            <
            input type = "number"
            value = { threshold }
            onChange = {
                (e) => setThreshold(e.target.value) }
            style = {
                { width: "100%" } }
            /> <
            /div> <
            /div>

            <
            label > < strong > Contact Email < /strong></label >
            <
            input type = "email"
            value = { contact }
            onChange = {
                (e) => setContact(e.target.value) }
            placeholder = "manager@company.com"
            style = {
                { width: "100%", marginBottom: 10 } }
            />

            <
            label style = {
                { display: "flex", alignItems: "center", gap: 8 } } >
            <
            input type = "checkbox"
            checked = { autoAlert }
            onChange = {
                (e) => setAutoAlert(e.target.checked) }
            /> <
            strong > Auto - alert on low stock < /strong> <
            /label>

            <
            div style = {
                { marginTop: 16, display: "flex", gap: 8 } } >
            <
            button type = "submit"
            style = {
                { flex: 1, padding: "8px 16px" } } > Save < /button> <
            button type = "button"
            onClick = { onCancel }
            style = {
                { flex: 1, padding: "8px 16px" } } > Cancel < /button> <
            /div> <
            /form>
        );
    }

    function HistoryModal({ product, onClose }) {
        if (!product) return null;
        return ( <
            div style = {
                {
                    position: "fixed",
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }
            } >
            <
            div style = {
                {
                    maxWidth: 700,
                    background: "#fff",
                    padding: 20,
                    borderRadius: 8,
                    maxHeight: "80vh",
                    overflow: "auto"
                }
            } >
            <
            h3 > History - { product.name } < /h3> <
            div style = {
                { maxHeight: 400, overflow: "auto" } } > {!product.history || product.history.length === 0 ? ( <
                    div style = {
                        { color: "#999" } } > No history recorded < /div>
                ) : (
                    product.history.map((h, i) => ( <
                        div key = { i }
                        style = {
                            { fontSize: "0.85em", padding: "6px 0", borderBottom: "1px solid #eee" } } > { new Date(h.ts).toLocaleString() } - < strong > { h.type } < /strong> ({h.qtyChange}) <
                        /div>
                    ))
                )
            } <
            /div> <
            div style = {
                { marginTop: 16 } } >
            <
            button onClick = { onClose }
            style = {
                { width: "100%", padding: "8px 16px" } } > Close < /button> <
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
        const [usingFallback, setUsingFallback] = useState(false);

        useEffect(() => {
            async function loadProducts() {
                try {
                    console.log("=== APP MOUNT: Loading products ===");
                    setLoading(true);
                    setErrorMsg(null);

                    const result = await hybridAPI.getAll();
                    console.log("Load result:", result);

                    if (result.success === false) {
                        console.error("Failed:", result.error);
                        setErrorMsg("Failed: " + result.error);
                        setData({ products: [] });
                        return;
                    }

                    if (!Array.isArray(result.data)) {
                        console.error("Invalid data format:", result.data);
                        setErrorMsg("Invalid response format");
                        setData({ products: [] });
                        return;
                    }

                    console.log("✅ Loaded " + result.data.length + " products");
                    setData({ products: result.data });
                    setUsingFallback(false);
                } catch (err) {
                    console.error("Load error:", err);
                    setErrorMsg("Error: " + err.message);
                    setData({ products: [] });
                } finally {
                    setLoading(false);
                }
            }

            loadProducts();
        }, []);

        function counts() {
            return {
                total: data.products.length,
                low: data.products.filter((p) => p.qty <= p.threshold).length
            };
        }

        async function saveProduct(p) {
            try {
                console.log("Saving product:", p);
                const exists = data.products.find((x) => x.product_id === p.product_id);
                const result = exists ?
                    await hybridAPI.update(p.product_id, p) :
                    await hybridAPI.create(p);

                console.log("Save result:", result);

                if (result.success) {
                    const newProduct = result.data || p;
                    setData((prev) => ({
                        ...prev,
                        products: exists ?
                            prev.products.map((x) => x.product_id === newProduct.product_id ? newProduct : x) :
                            [newProduct, ...prev.products]
                    }));
                    setEditing(null);
                    alert(exists ? "Updated" : "Created");
                } else {
                    alert("Error: " + result.error);
                }
            } catch (err) {
                console.error("Save error:", err);
                alert("Error: " + err.message);
            }
        }

        async function adjustQty(p, delta) {
            try {
                console.log("Adjusting " + p.name + ": " + (delta > 0 ? "+" : "") + delta);
                const result = await hybridAPI.updateQuantity(p.product_id, delta);
                console.log("Adjust result:", result);

                if (result.success && result.data) {
                    setData((prev) => ({
                        ...prev,
                        products: prev.products.map((x) => x.product_id === result.data.product_id ? result.data : x)
                    }));
                } else {
                    alert("Error: " + (result.error || "Unknown"));
                }
            } catch (err) {
                console.error("Adjust error:", err);
                alert("Error: " + err.message);
            }
        }

        async function sendAlert(p) {
            try {
                console.log("Sending alert for:", p.name);
                const result = await hybridAPI.sendAlert(p.product_id);
                if (result.success) {
                    alert("Alert sent");
                } else {
                    alert("Error: " + (result.error || "Unknown"));
                }
            } catch (err) {
                alert("Error: " + err.message);
            }
        }

        const filtered = data.products.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.sku.toLowerCase().includes(query.toLowerCase())
        );
        const visible = filterLow ? filtered.filter((p) => p.qty <= p.threshold) : filtered;
        const c = counts();

        if (loading) {
            return ( <
                div style = {
                    { padding: 16, textAlign: "center" } } >
                <
                h1 > Inventory Dashboard < /h1> <
                p > Loading from Firestore... < /p> <
                /div>
            );
        }

        return ( <
            div style = {
                { padding: 16, fontFamily: "system-ui, sans-serif" } } >
            <
            h1 > Inventory Dashboard < /h1> <
            Header counts = { c }
            />

            {
                errorMsg && ( <
                    div style = {
                        {
                            padding: 12,
                            marginBottom: 12,
                            background: "#ffebee",
                            border: "1px solid #c62828",
                            borderRadius: 4,
                            color: "#c62828"
                        }
                    } > ⚠️{ errorMsg } <
                    /div>
                )
            }

            {
                usingFallback && ( <
                    div style = {
                        {
                            padding: 12,
                            marginBottom: 12,
                            background: "#fff3e0",
                            border: "1px solid #e65100",
                            borderRadius: 4,
                            color: "#e65100"
                        }
                    } > ⚠️Using local storage(API not responding) - Check browser console <
                    /div>
                )
            }

            <
            div style = {
                { display: "flex", gap: 20 } } >
            <
            div style = {
                { flex: 3 } } >
            <
            div style = {
                { display: "flex", gap: 8, marginBottom: 12 } } >
            <
            input placeholder = "Search by name or SKU..."
            value = { query }
            onChange = {
                (e) => setQuery(e.target.value) }
            style = {
                { flex: 1, padding: "8px 12px" } }
            /> <
            label >
            <
            input type = "checkbox"
            checked = { filterLow }
            onChange = {
                (e) => setFilterLow(e.target.checked) }
            />
            Low Stock Only <
            /label> <
            button onClick = {
                () => setEditing({}) } > Add Product < /button> <
            /div>

            <
            div > {
                visible.length === 0 ? ( <
                    div style = {
                        { padding: 20, textAlign: "center", color: "#999" } } > { data.products.length === 0 ? "No products (empty database)" : "No matching products" } <
                    /div>
                ) : (
                    visible.map((p) => ( <
                        ProductCard key = { p.product_id }
                        p = { p }
                        onAdjust = { adjustQty }
                        onEdit = {
                            (prod) => setEditing(prod) }
                        onAlert = { sendAlert }
                        onShowHistory = {
                            (prod) => setHistoryProduct(prod) }
                        />
                    ))
                )
            } <
            /div> <
            /div>

            <
            div style = {
                { flex: 1 } } >
            <
            div style = {
                {
                    padding: 12,
                    background: "#e3f2fd",
                    borderLeft: "4px solid #1976d2",
                    borderRadius: 4,
                    position: "sticky",
                    top: 16
                }
            } >
            <
            h4 > Summary < /h4> <
            p style = {
                { fontSize: "0.9em", margin: "8px 0" } } >
            <
            strong > Total: < /strong> {c.total} <
            /p> <
            p style = {
                { fontSize: "0.9em", margin: "8px 0" } } >
            <
            strong > Low Stock: < /strong> {c.low} <
            /p> <
            button onClick = {
                () => window.location.reload() }
            style = {
                { width: "100%", marginTop: 12 } } >
            Refresh <
            /button> <
            /div> <
            /div> <
            /div>

            {
                editing !== null && ( <
                    div style = {
                        {
                            position: "fixed",
                            left: 0,
                            top: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0,0,0,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 999
                        }
                    } >
                    <
                    div style = {
                        {
                            background: "#fff",
                            padding: 20,
                            borderRadius: 8,
                            maxWidth: 500,
                            maxHeight: "80vh",
                            overflow: "auto"
                        }
                    } >
                    <
                    ProductForm product = { editing.product_id ? editing : null }
                    onSave = { saveProduct }
                    onCancel = {
                        () => setEditing(null) }
                    /> <
                    /div> <
                    /div>
                )
            }

            {
                historyProduct && ( <
                    HistoryModal product = { historyProduct }
                    onClose = {
                        () => setHistoryProduct(null) }
                    />
                )
            } <
            /div>
        );
    }