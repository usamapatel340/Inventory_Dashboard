/**
 * Vercel API Route - Wraps Firestore Backend Handler
 */

const { handler } = require("../../backend/lambda-handler.js");

module.exports = async (req, res) => {
  try {
    console.log("=== HANDLER INCOMING REQUEST ===");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("Body type:", typeof req.body);
    console.log("Body:", req.body);

    // Convert Vercel request to Lambda format
    const event = {
      httpMethod: req.method,
      path: req.url,
      rawPath: req.url,
      headers: req.headers,
      body: req.body
        ? typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body)
        : null,
      requestContext: {
        http: {
          method: req.method,
        },
      },
    };

    console.log("Event sent to handler:", {
      method: event.httpMethod,
      path: event.path,
      bodyLength: event.body ? event.body.length : 0,
    });

    // Call the handler
    const response = await handler(event, {});

    console.log("Handler response:", {
      statusCode: response.statusCode,
      bodyLength: response.body ? response.body.length : 0,
    });

    // Send response
    res.status(response.statusCode);
    Object.entries(response.headers || {}).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    const body = response.body ? JSON.parse(response.body) : response.body;
    console.log("Sending to client:", body);
    res.send(body);
  } catch (error) {
    console.error("=== HANDLER ERROR ===", error.message);
    console.error("Stack:", error.stack);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
