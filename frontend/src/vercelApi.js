/**
 * Vercel API Configuration
 * Update this file with your Vercel deployment URL
 */

// Get API base URL from environment or use local
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://your-project.vercel.app"
    : "http://localhost:3000");

// API Service for backend calls
async function apiCall(endpoint, method = "GET", body = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`🔗 API Call: ${method} ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, options);
    console.log(`✅ Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ API Error: ${response.status}`, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ API Call Failed:", error);
    throw error;
  }
}

// Product API endpoints
export const productApi = {
  // Get all products
  getAll: () => apiCall("/products"),

  // Get single product
  getById: (productId) => apiCall(`/products/${productId}`),

  // Create new product
  create: (productData) => apiCall("/products", "POST", productData),

  // Update product
  update: (productId, productData) =>
    apiCall(`/products/${productId}`, "PUT", productData),

  // Delete product
  delete: (productId) => apiCall(`/products/${productId}`, "DELETE"),

  // Update product quantity
  updateQuantity: (productId, delta) =>
    apiCall("/quantity", "PATCH", { product_id: productId, delta }),

  // Get low stock products
  getLowStock: () => apiCall("/low-stock"),

  // Search products
  search: (query) => apiCall(`/search?q=${encodeURIComponent(query)}`),

  // Send alert for product
  sendAlert: (productId) =>
    apiCall("/alert", "POST", { product_id: productId }),
};

export default productApi;
