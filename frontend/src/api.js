import { Auth } from "aws-amplify";
import awsConfig from "./awsConfig";

// API Service for backend calls
const API_BASE_URL = awsConfig.lambdaEndpoint;

// Helper to get auth token
async function getAuthToken() {
  try {
    const session = await Auth.currentSession();
    return session.getIdToken().getJwtToken();
  } catch (err) {
    console.error("Error getting auth token:", err);
    return null;
  }
}

// Helper for API calls
async function apiCall(endpoint, method = "GET", body = null) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`API Call: ${method} ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `API Error: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log("API Success - Full response data:", data);
    console.log(
      "API Success - Data type:",
      typeof data,
      "Is null?",
      data === null
    );
    return { success: true, data };
  } catch (err) {
    // Log error for debugging
    console.error("API call failed:", endpoint, err.message, err);
    return { success: false, error: err.message };
  }
}

// Products API
export const productsAPI = {
  // Get all products
  async getAll() {
    return apiCall("/products", "GET");
  },

  // Get single product
  async getById(id) {
    return apiCall(`/products/${id}`, "GET");
  },

  // Create product
  async create(product) {
    return apiCall("/products", "POST", product);
  },

  // Update product
  async update(id, product) {
    return apiCall(`/products/${id}`, "PUT", product);
  },

  // Delete product
  async delete(id) {
    return apiCall(`/products/${id}`, "DELETE");
  },

  // Search products
  async search(query) {
    return apiCall(`/products/search?q=${encodeURIComponent(query)}`, "GET");
  },

  // Get low stock items
  async getLowStock() {
    return apiCall("/products/low-stock", "GET");
  },

  // Update product quantity
  async updateQuantity(id, delta) {
    return apiCall(`/products/${id}/quantity`, "PATCH", { delta });
  },

  // Send alert (SNS)
  async sendAlert(id, method = "sms") {
    return apiCall(`/products/${id}/alert`, "POST", { method });
  },
};

// Fallback: Local storage API (when backend is not available)
export const localStorageAPI = {
  async getAll() {
    const raw = localStorage.getItem("pi_inventory_v1");
    if (!raw) return { success: true, data: [] }; // Return success with empty data
    try {
      const data = JSON.parse(raw);
      return { success: true, data: data.products || [] };
    } catch (e) {
      console.error("Error parsing localStorage data:", e);
      return { success: true, data: [] }; // Return success with empty data on error
    }
  },

  async create(product) {
    const raw = localStorage.getItem("pi_inventory_v1");
    let data = { products: [] };
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (e) {}
    }
    const newProduct = {
      ...product,
      product_id: "p" + Math.random().toString(36).slice(2, 9),
      history: [],
    };
    data.products = [newProduct, ...data.products];
    localStorage.setItem("pi_inventory_v1", JSON.stringify(data));
    return { success: true, data: newProduct };
  },

  async update(id, product) {
    const raw = localStorage.getItem("pi_inventory_v1");
    let data = { products: [] };
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (e) {}
    }
    data.products = data.products.map((p) =>
      p.product_id === id ? { ...p, ...product } : p
    );
    localStorage.setItem("pi_inventory_v1", JSON.stringify(data));
    return { success: true, data: product };
  },

  async updateQuantity(id, delta) {
    const raw = localStorage.getItem("pi_inventory_v1");
    let data = { products: [] };
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (e) {}
    }
    let updated = null;
    data.products = data.products.map((p) => {
      if (p.product_id === id) {
        const newQty = Math.max(0, p.qty + delta);
        const hist = [
          {
            type: delta > 0 ? "restock" : "sale",
            qtyChange: delta,
            ts: Date.now(),
          },
          ...(p.history || []),
        ];
        updated = { ...p, qty: newQty, history: hist };
        return updated;
      }
      return p;
    });
    localStorage.setItem("pi_inventory_v1", JSON.stringify(data));
    return { success: true, data: updated };
  },

  async delete(id) {
    const raw = localStorage.getItem("pi_inventory_v1");
    let data = { products: [] };
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (e) {}
    }
    data.products = data.products.filter((p) => p.product_id !== id);
    localStorage.setItem("pi_inventory_v1", JSON.stringify(data));
    return { success: true };
  },

  async getLowStock() {
    const result = await this.getAll();
    if (!result.success) return result;
    return {
      success: true,
      data: result.data.filter((p) => p.qty <= p.threshold),
    };
  },

  async sendAlert(id) {
    console.log("[Mock SNS] Alert sent for product", id);
    return { success: true, data: { sent: true } };
  },
};

// Hybrid API: Try backend first, fallback to localStorage
export const hybridAPI = {
  useBackend: true, // Enabled - Auto-save to DynamoDB

  async getAll() {
    if (this.useBackend) {
      const result = await productsAPI.getAll();
      if (result.success) return result;
    }
    return localStorageAPI.getAll();
  },

  async create(product) {
    if (this.useBackend) {
      const result = await productsAPI.create(product);
      if (result.success) return result;
    }
    return localStorageAPI.create(product);
  },

  async update(id, product) {
    if (this.useBackend) {
      const result = await productsAPI.update(id, product);
      if (result.success) return result;
    }
    return localStorageAPI.update(id, product);
  },

  async updateQuantity(id, delta) {
    if (this.useBackend) {
      const result = await productsAPI.updateQuantity(id, delta);
      if (result.success) return result;
    }
    return localStorageAPI.updateQuantity(id, delta);
  },

  async delete(id) {
    if (this.useBackend) {
      const result = await productsAPI.delete(id);
      if (result.success) return result;
    }
    return localStorageAPI.delete(id);
  },

  async getLowStock() {
    if (this.useBackend) {
      const result = await productsAPI.getLowStock();
      if (result.success) return result;
    }
    return localStorageAPI.getLowStock();
  },

  async sendAlert(id, method = "sms") {
    if (this.useBackend) {
      const result = await productsAPI.sendAlert(id, method);
      if (result.success) return result;
    }
    return localStorageAPI.sendAlert(id);
  },
};
