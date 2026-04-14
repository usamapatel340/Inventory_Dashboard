/**
 * Vercel API Route - Wraps Firestore Backend Handler
 */

const { handler } = require("../../backend/lambda-handler.js");

module.exports = async (req, res) => {
  try {
    // Convert Vercel request to Lambda format
    const event = {
      httpMethod: req.method,
      path: req.url,
      rawPath: req.url,
      headers: req.headers,
      body: req.body ? JSON.stringify(req.body) : null,
      requestContext: {
        http: {
          method: req.method,
        },
      },
    };

    // Call the handler
    const response = await handler(event, {});

    // Send response
    res.status(response.statusCode);
    Object.entries(response.headers || {}).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.send(response.body ? JSON.parse(response.body) : response.body);
  } catch (error) {
    console.error("API Error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
