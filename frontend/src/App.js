import React, { useState, useEffect } from "react";
import { Auth } from "aws-amplify";
import Login from "./Login";
import { hybridAPI } from "./api";

const storageKey = "pi_inventory_v1";
function loadData() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
function saveData(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

const sample = {
  products: [
    {
      id: "p1",
      name: "Blue T-Shirt",
      sku: "TSH-BL-1",
      qty: 25,
      threshold: 5,
      contact: "+10000000000",
      autoAlert: true,
      history: [],
    },
    {
      id: "p2",
      name: "Red Mug",
      sku: "MUG-RD-1",
      qty: 8,
      threshold: 10,
      contact: "owner@example.com",
      autoAlert: true,
      history: [],
    },
    {
      id: "p3",
      name: "Notebook A5",
      sku: "NB-A5-1",
      qty: 50,
      threshold: 10,
      contact: "",
      autoAlert: false,
      history: [],
    },
  ],
  createdAt: Date.now(),
};

// Initial sample data (used as fallback)
const sampleProducts = [
  {
    id: "p1",
    name: "Blue T-Shirt",
    sku: "TSH-BL-1",
    qty: 25,
    threshold: 5,
    contact: "+10000000000",
    autoAlert: true,
    history: [],
  },
  {
    id: "p2",
    name: "Red Mug",
    sku: "MUG-RD-1",
    qty: 8,
    threshold: 10,
    contact: "owner@example.com",
    autoAlert: true,
    history: [],
  },
  {
    id: "p3",
    name: "Notebook A5",
    sku: "NB-A5-1",
    qty: 50,
    threshold: 10,
    contact: "",
    autoAlert: false,
    history: [],
  },
];

function mockSendAlert(product, method = "sms") {
  console.log(
    "[MOCK SNS] Sending",
    method,
    "for",
    product.name,
    "qty=",
    product.qty
  );
  return Promise.resolve({ success: true });
}

function Header({ counts, authUser, userEmail, onLogout }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <strong>Products:</strong> {counts.total} &nbsp;
          <strong>Low:</strong> {counts.low}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <small>Backend: AWS (DynamoDB via Lambda)</small>
          {authUser && (
            <div style={{ fontSize: "0.85em" }}>
              <span>
                Logged in as: <strong>{userEmail}</strong>
              </span>
              <button onClick={onLogout} style={{ marginLeft: 10 }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      <hr />
    </div>
  );
}

function ProductCard({ p, onAdjust, onEdit, onAlert, onShowHistory }) {
  const low = p.qty <= p.threshold;
  return (
    <div
      style={{
        padding: 12,
        marginBottom: 8,
        background: low ? "#fff4f4" : "#f4fff7",
        borderLeft: `4px solid ${low ? "#ff6b6b" : "#2ecc71"}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h4 style={{ margin: 0 }}>{p.name}</h4>
          <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 4 }}>
            ID: {p.sku}
          </div>
          <div style={{ fontSize: "0.85em" }}>
            Qty: <strong>{p.qty}</strong> &nbsp; Threshold: {p.threshold}{" "}
            {low && <span style={{ color: "#c0392b" }}>● Low</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <button onClick={() => onAdjust(p, +1)}>+ Add</button>
          <button style={{ marginLeft: 6 }} onClick={() => onAdjust(p, -1)}>
            - Remove
          </button>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => onEdit(p)} style={{ fontSize: "0.85em" }}>
              Edit
            </button>
            <button
              onClick={() => onAlert(p)}
              style={{ fontSize: "0.85em", marginLeft: 6 }}
            >
              Send Alert
            </button>
            <button
              onClick={() => onShowHistory && onShowHistory(p)}
              style={{ fontSize: "0.85em", marginLeft: 6 }}
            >
              History
            </button>
          </div>
        </div>
      </div>
      {p.history && p.history.length > 0 && (
        <div style={{ fontSize: "0.9em", color: "#333" }}>
          <strong>Last:</strong> {p.history[0].type} {p.history[0].qtyChange} @
          {new Date(p.history[0].ts).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function ProductForm({ onSave, product, onCancel }) {
  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [qty, setQty] = useState(product?.qty || 0);
  const [threshold, setThreshold] = useState(product?.threshold || 1);
  const [contact, setContact] = useState(product?.contact || "");
  const [autoAlert, setAutoAlert] = useState(product?.autoAlert || false);

  function submit(e) {
    e.preventDefault();
    const newId =
      product?.product_id || "p" + Math.random().toString(36).slice(2, 9);
    const obj = {
      ...product,
      product_id: newId,
      name,
      sku,
      qty: Number(qty),
      threshold: Number(threshold),
      contact,
      autoAlert,
    };
    onSave(obj);
  }

  return (
    <form
      onSubmit={submit}
      style={{
        marginBottom: 20,
        padding: 20,
        border: "2px solid #e0e0e0",
        borderRadius: 8,
        backgroundColor: "#f9f9f9",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 15, color: "#333" }}>
        {product ? "Edit Product" : "Add New Product"}
      </h3>
      <label>Name</label>
      <input required value={name} onChange={(e) => setName(e.target.value)} />
      <label>ID</label>
      <input required value={sku} onChange={(e) => setSku(e.target.value)} />
      <div style={{ display: "flex", gap: 10 }}>
        <div>
          <label>Qty</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div>
          <label>Threshold</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>
      </div>
      <label>Contact (phone or email)</label>
      <input value={contact} onChange={(e) => setContact(e.target.value)} />
      <label>
        <input
          type="checkbox"
          checked={autoAlert}
          onChange={(e) => setAutoAlert(e.target.checked)}
        />{" "}
        Send automatic alert when below threshold
      </label>
      <div style={{ marginTop: 10 }}>
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function HistoryModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "40px auto",
          background: "#fff",
          padding: 20,
        }}
      >
        <h3>History - {product.name}</h3>
        <div style={{ maxHeight: 400, overflow: "auto" }}>
          {product.history.length === 0 && <div>No history</div>}
          {product.history.map((h, i) => (
            <div key={i} style={{ fontSize: "0.85em" }}>
              {new Date(h.ts).toLocaleString()} - {h.type} {h.qtyChange}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function AlertsPanel({ lowItems, onSendAll }) {
  return (
    <div>
      <h3>Alerts</h3>
      <p style={{ fontSize: "0.85em" }}>Items below threshold</p>
      {lowItems.length === 0 && <div>No alerts</div>}
      {lowItems.map((p) => (
        <div
          key={p.product_id}
          style={{
            padding: 8,
            marginBottom: 6,
            background: "#fff4f4",
            borderLeft: "4px solid #ff6b6b",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{p.name}</strong>
              <div>
                Qty: {p.qty} (thr {p.threshold})
              </div>
            </div>
            <div>
              <button
                onClick={() =>
                  mockSendAlert(p).then(() =>
                    alert("Mock alert sent for " + p.name)
                  )
                }
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ))}
      {lowItems.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button onClick={onSendAll}>Send All Alerts</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    // check current authenticated user (Amplify) on mount
    let mounted = true;
    try {
      Auth.currentAuthenticatedUser()
        .then((u) => {
          if (mounted) {
            setAuthUser(u);
            // Extract email from user attributes
            const email = u.attributes?.email || u.email || u.username;
            setUserEmail(email);
          }
        })
        .catch((err) => {
          if (mounted) {
            setAuthUser(null);
            setUserEmail(null);
          }
        });
    } catch (err) {
      if (mounted) {
        setAuthUser(null);
        setUserEmail(null);
      }
    }
    return () => {
      mounted = false;
    };
  }, []);

  const [data, setData] = useState({ products: [] });
  const [query, setQuery] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load products from API after authentication
  useEffect(() => {
    async function loadProducts() {
      // Only load products if user is authenticated
      if (!authUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Start with empty products - clear any old localStorage data
        localStorage.removeItem(storageKey);
        const result = await hybridAPI.getAll();
        if (result.success && result.data && result.data.length > 0) {
          setData({ products: result.data });
        } else {
          // Start with empty products - user will add them via DynamoDB auto-save
          setData({ products: [] });
        }
      } catch (err) {
        console.error("Error loading products:", err);
        setData({ products: [] });
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [authUser]); // Re-run when authUser changes

  // Auto-save to API when data changes (debounced)
  useEffect(() => {
    if (data.products.length > 0) {
      const timer = setTimeout(() => {
        // Sync with backend if available
        console.log("Data updated, syncing with backend...");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  function counts() {
    const total = data.products.length;
    const low = data.products.filter((p) => p.qty <= p.threshold).length;
    return { total, low };
  }

  async function upsertProduct(p) {
    try {
      const exists = data.products.find((x) => x.product_id === p.product_id);
      let result;

      if (exists) {
        // Update existing product
        result = await hybridAPI.update(p.product_id, p);
      } else {
        // Create new product
        result = await hybridAPI.create({
          ...p,
          history: [],
        });
      }

      if (result.success) {
        // Extract the actual product from result.data
        const newProduct = result.data || p;
        setData((prev) => {
          let products;
          if (exists) {
            products = prev.products.map((x) =>
              x.product_id === newProduct.product_id
                ? { ...x, ...newProduct }
                : x
            );
          } else {
            products = [newProduct, ...prev.products];
          }
          return { ...prev, products };
        });
        setEditing(null);
      } else {
        console.error("Failed to upsert product:", result.error);
        alert("Failed to save product: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error in upsertProduct:", err);
      alert("Error saving product: " + err.message);
    }
  }

  async function adjust(p, delta) {
    // Call API to update quantity
    const result = await hybridAPI.updateQuantity(p.product_id, delta);
    if (result.success && result.data) {
      // Use the updated product from backend response
      const updatedProduct = result.data;
      setData((prev) => {
        const products = prev.products.map((x) =>
          x.product_id === updatedProduct.product_id ? updatedProduct : x
        );

        // Check if we should send an alert
        if (
          updatedProduct.qty <= updatedProduct.threshold &&
          updatedProduct.autoAlert
        ) {
          hybridAPI.sendAlert(updatedProduct.product_id).then(() => {
            alert("Auto alert sent for " + updatedProduct.name);
          });
        }

        return { ...prev, products };
      });
    } else {
      console.error(
        "Failed to update quantity:",
        result.error || "No data returned"
      );
      alert(
        "Failed to update product: " + (result.error || "No data returned")
      );
    }
  }

  async function manualSendAlert(p) {
    try {
      const result = await hybridAPI.sendAlert(p.product_id);
      if (result.success) {
        alert("Alert sent for " + p.name);
        setData((prev) => {
          const products = prev.products.map((x) =>
            x.product_id === p.product_id
              ? {
                  ...x,
                  history: [
                    { type: "alert", qtyChange: 0, ts: Date.now() },
                    ...x.history,
                  ],
                }
              : x
          );
          return { ...prev, products };
        });
      } else {
        console.error("Failed to send alert:", result.error);
        alert("Failed to send alert: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error in manualSendAlert:", err);
      alert("Error sending alert: " + err.message);
    }
  }

  function sendAllAlerts() {
    const low = data.products.filter((p) => p.qty <= p.threshold);
    Promise.all(low.map((p) => mockSendAlert(p))).then(() =>
      alert("Mock alerts sent for " + low.length + " items")
    );
  }

  async function handleLogout() {
    try {
      await Auth.signOut();
      setAuthUser(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }

  const filtered = data.products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );
  const visible = filterLow
    ? filtered.filter((p) => p.qty <= p.threshold)
    : filtered;

  // If user not authenticated show login screen
  if (!authUser) {
    return <Login onSignIn={(u) => setAuthUser(u)} />;
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Inventory Dashboard - Frontend Demo</h1>
      <Header
        counts={counts()}
        authUser={authUser}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 2 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              style={{ flex: 1 }}
              placeholder="Search by name or product ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <label style={{ flex: 0 }}>
              <input
                type="checkbox"
                checked={filterLow}
                onChange={(e) => setFilterLow(e.target.checked)}
              />{" "}
              Show low only
            </label>
            <button style={{ flex: 0 }} onClick={() => setEditing({})}>
              Add Product
            </button>
          </div>
          <div>
            {visible.map((p) => (
              <ProductCard
                key={p.product_id}
                p={p}
                onAdjust={adjust}
                onEdit={(prod) => setEditing(prod)}
                onAlert={manualSendAlert}
                onShowHistory={(prod) => setHistoryProduct(prod)}
              />
            ))}
            {visible.length === 0 && <div>No items found</div>}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <AlertsPanel
            lowItems={data.products.filter((p) => p.qty <= p.threshold)}
            onSendAll={sendAllAlerts}
          />
          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: "#f4fff7",
              borderLeft: "4px solid #2ecc71",
            }}
          >
            <h4>Quick Actions</h4>
            <p style={{ fontSize: "0.85em" }}>
              Demo SNS alert will only simulate sending.
            </p>
            <button
              onClick={() => {
                // Clear any locally cached data and reset view to empty.
                localStorage.removeItem(storageKey);
                setData({ products: [] });
              }}
            >
              Reset Sample Data
            </button>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: "#f4fff7",
              borderLeft: "4px solid #2ecc71",
            }}
          >
            <h4>History</h4>
            <div style={{ fontSize: "0.85em" }}>
              {data.products
                .flatMap((p) =>
                  (p.history || []).map((h) => ({ ...h, name: p.name }))
                )
                .slice(0, 10)
                .map((h, i) => (
                  <div key={i}>
                    {new Date(h.ts).toLocaleString()} - {h.name} - {h.type}{" "}
                    {h.qtyChange}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      {editing !== null && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              maxWidth: 600,
              margin: "40px auto",
              background: "#fff",
              padding: 20,
            }}
          >
            <h3>{editing.product_id ? "Edit" : "Add"} Product</h3>
            <ProductForm
              product={editing.product_id ? editing : null}
              onSave={upsertProduct}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
      {historyProduct && (
        <HistoryModal
          product={historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      )}
    </div>
  );
}
