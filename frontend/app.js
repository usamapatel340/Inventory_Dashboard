const { useState, useEffect, useRef } = React;

// Utilities
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

function ensureData() {
  let d = loadData();
  if (!d) {
    d = sample;
    saveData(d);
  }
  return d;
}

// Mock SNS: just print to console and mark as sent in history
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

// Components
function Header({ counts }) {
  return (
    <div>
      <div className="row">
        <div className="col-sm-8">
          <strong>Products:</strong> {counts.total} &nbsp;
          <strong>Low:</strong> {counts.low}
        </div>
        <div className="col-sm-4" style={{ textAlign: "right" }}>
          <small className="small">Demo: data saved locally</small>
        </div>
      </div>
      <hr />
    </div>
  );
}

function ProductCard({ p, onAdjust, onEdit, onAlert, onShowHistory }) {
  const low = p.qty <= p.threshold;
  return (
    <div className={`card ${low ? "low" : "ok"}`}>
      <div className="row">
        <div className="col-sm-8">
          <h4 style={{ margin: 0 }}>
            {p.name} <small>({p.sku})</small>
          </h4>
          <div className="small">
            Qty: <strong>{p.qty}</strong> &nbsp; Threshold: {p.threshold}{" "}
            {low && <span style={{ color: "#c0392b" }}>● Low</span>}
          </div>
        </div>
        <div className="col-sm-4" style={{ textAlign: "right" }}>
          <button className="primary" onClick={() => onAdjust(p, +1)}>
            + Add
          </button>
          <button
            className="secondary"
            style={{ marginLeft: 6 }}
            onClick={() => onAdjust(p, -1)}
          >
            - Remove
          </button>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => onEdit(p)} className="small">
              Edit
            </button>
            <button
              onClick={() => onAlert(p)}
              className="small"
              style={{ marginLeft: 6 }}
            >
              Send Alert
            </button>
            <button
              onClick={() => onShowHistory && onShowHistory(p)}
              className="small"
              style={{ marginLeft: 6 }}
            >
              History
            </button>
          </div>
        </div>
      </div>
      {p.history && p.history.length > 0 && (
        <div className="history">
          <strong>Last:</strong> {p.history[0].type} {p.history[0].qtyChange} @
          {new Date(p.history[0].ts).toLocaleString()}
        </div>
      )}
    </div>
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
            <div key={i} className="small">
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

function ProductForm({ onSave, product, onCancel }) {
  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [qty, setQty] = useState(product?.qty || 0);
  const [threshold, setThreshold] = useState(product?.threshold || 1);
  const [contact, setContact] = useState(product?.contact || "");
  const [autoAlert, setAutoAlert] = useState(product?.autoAlert || false);

  function submit(e) {
    e.preventDefault();
    const obj = {
      ...product,
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
    <form onSubmit={submit}>
      <label>Name</label>
      <input required value={name} onChange={(e) => setName(e.target.value)} />
      <label>SKU</label>
      <input required value={sku} onChange={(e) => setSku(e.target.value)} />
      <div className="row">
        <div className="col-sm-6">
          <label>Qty</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div className="col-sm-6">
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
        <button type="submit" className="primary">
          Save
        </button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function AlertsPanel({ lowItems, onSendAll }) {
  return (
    <div>
      <h3>Alerts</h3>
      <p className="small">Items below threshold</p>
      {lowItems.length === 0 && <div>No alerts</div>}
      {lowItems.map((p) => (
        <div key={p.id} className="card small">
          <div className="row">
            <div className="col-sm-8">
              <strong>{p.name}</strong>
              <div>
                Qty: {p.qty} (thr {p.threshold})
              </div>
            </div>
            <div className="col-sm-4" style={{ textAlign: "right" }}>
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
          <button className="primary" onClick={() => onSendAll()}>
            Send All Alerts
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [data, setData] = useState(ensureData());
  const [query, setQuery] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  function counts() {
    const total = data.products.length;
    const low = data.products.filter((p) => p.qty <= p.threshold).length;
    return { total, low };
  }

  function upsertProduct(p) {
    setData((prev) => {
      const exists = prev.products.find((x) => x.id === p.id);
      let products;
      if (exists) {
        products = prev.products.map((x) =>
          x.id === p.id ? { ...x, ...p } : x
        );
      } else {
        products = [
          {
            ...p,
            id: "p" + Math.random().toString(36).slice(2, 9),
            history: [],
          },
          ...prev.products,
        ];
      }
      const next = { ...prev, products };
      saveData(next);
      return next;
    });
    setEditing(null);
  }

  function adjust(p, delta) {
    setData((prev) => {
      let alertToSend = null;
      const products = prev.products.map((x) => {
        if (x.id !== p.id) return x;
        const oldQty = x.qty;
        const newQty = Math.max(0, x.qty + delta);
        const hist = [
          {
            type: delta > 0 ? "restock" : "sale",
            qtyChange: delta,
            ts: Date.now(),
          },
          ...x.history,
        ];
        // detect crossing below or equal to threshold
        if (oldQty > x.threshold && newQty <= x.threshold && x.autoAlert) {
          alertToSend = { ...x, qty: newQty };
          // also record alert event in history
          hist.unshift({ type: "alert", qtyChange: 0, ts: Date.now() });
        }
        return { ...x, qty: newQty, history: hist };
      });
      const next = { ...prev, products };
      saveData(next);
      // trigger mock alert outside of state mutation
      if (alertToSend) {
        mockSendAlert(alertToSend).then(() => {
          alert("Auto alert (mock) sent for " + alertToSend.name);
        });
      }
      return next;
    });
  }

  function manualSendAlert(p) {
    mockSendAlert(p).then((res) => {
      alert("Mock alert sent for " + p.name);
      // record event
      setData((prev) => {
        const products = prev.products.map((x) =>
          x.id === p.id
            ? {
                ...x,
                history: [
                  { type: "alert", qtyChange: 0, ts: Date.now() },
                  ...x.history,
                ],
              }
            : x
        );
        const next = { ...prev, products };
        saveData(next);
        return next;
      });
    });
  }

  function sendAllAlerts() {
    const low = data.products.filter((p) => p.qty <= p.threshold);
    Promise.all(low.map((p) => mockSendAlert(p))).then(() =>
      alert("Mock alerts sent for " + low.length + " items")
    );
  }

  const filtered = data.products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );
  const visible = filterLow
    ? filtered.filter((p) => p.qty <= p.threshold)
    : filtered;

  return (
    <div>
      <Header counts={counts()} />

      <div className="row">
        <div className="col-sm-8">
          <div className="row">
            <div className="col-sm-6">
              <input
                placeholder="Search by name or sku"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="col-sm-3">
              <label>
                <input
                  type="checkbox"
                  checked={filterLow}
                  onChange={(e) => setFilterLow(e.target.checked)}
                />{" "}
                Show low only
              </label>
            </div>
            <div className="col-sm-3" style={{ textAlign: "right" }}>
              <button onClick={() => setEditing({})} className="primary">
                Add Product
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {visible.map((p) => (
              <ProductCard
                key={p.id}
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

        <div className="col-sm-4">
          <div className="card">
            <h4>Quick Actions</h4>
            <p className="small">Demo SNS alert will only simulate sending.</p>
            <button
              onClick={() => {
                localStorage.removeItem(storageKey);
                setData(ensureData());
              }}
            >
              Reset Sample Data
            </button>
            <div style={{ marginTop: 10 }}>
              <button onClick={sendAllAlerts} className="primary">
                Send Alerts for All Low
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="card">
              <h4>History</h4>
              <div className="small">
                {data.products
                  .flatMap((p) =>
                    p.history.map((h) => ({ ...h, name: p.name }))
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
            <h3>{editing.id ? "Edit" : "Add"} Product</h3>
            <ProductForm
              product={editing.id ? editing : null}
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

ReactDOM.createRoot(document.getElementById("app")).render(<App />);

// Render alerts panel separately
function AlertsWrapper() {
  const [data, setData] = useState(ensureData());
  useEffect(() => {
    const id = setInterval(() => setData(ensureData()), 1000);
    return () => clearInterval(id);
  }, []);
  const low = data.products.filter((p) => p.qty <= p.threshold);
  return (
    <AlertsPanel
      lowItems={low}
      onSendAll={() => {
        Promise.all(low.map((p) => mockSendAlert(p))).then(() =>
          alert("Mock alerts sent")
        );
      }}
    />
  );
}
ReactDOM.createRoot(document.getElementById("alerts")).render(
  <AlertsWrapper />
);
