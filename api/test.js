/**
 * API Request Logger
 * Access at: /api/test to verify requests are reaching Vercel
 */

module.exports = async (req, res) => {
  console.log("=== TEST ENDPOINT ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", req.body);
  console.log("Body type:", typeof req.body);

  res.status(200).json({
    success: true,
    message: "Test endpoint works - requests are reaching Vercel",
    received: {
      method: req.method,
      url: req.url,
      bodyReceived: req.body ? "Yes" : "No",
      bodyType: typeof req.body,
    },
  });
};
