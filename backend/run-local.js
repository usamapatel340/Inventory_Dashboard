const express = require("express");
const { handler } = require("./lambda-handler-v3.js");

const app = express();
const PORT = 3001;

app.use(express.json());

const toEvent = (req) => ({
  httpMethod: req.method,
  path: req.path,
  body: req.body ? JSON.stringify(req.body) : null,
  queryStringParameters: req.query || {},
  headers: req.headers,
});

app.use(async (req, res) => {
  try {
    const event = toEvent(req);
    console.log("\n📨 Request:", event.httpMethod, event.path);
    const result = await handler(event);
    const headers = result.headers || {};
    Object.keys(headers).forEach((key) => res.setHeader(key, headers[key]));
    res
      .status(result.statusCode)
      .send(
        typeof result.body === "string" ? JSON.parse(result.body) : result.body
      );
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}\n`);
});
