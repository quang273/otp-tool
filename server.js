require("dotenv").config();

const fetch = require("node-fetch"); // 🔥 fix lỗi Render
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GRIZZLY_API_KEY;

const VALID_TOKENS = new Set(
  (process.env.APP_TOKENS || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean)
);

const GRIZZLY_URL = "https://api.grizzlysms.com/stubs/handler_api.php";

const countries = [
  { name: "United Kingdom", code: "16", dial: "+44" },
  { name: "Indonesia", code: "6", dial: "+62" },
  { name: "Thailand", code: "52", dial: "+66" },
  { name: "Canada", code: "36", dial: "+1" }
];

function requireToken(req, res, next) {
  const token = req.query.token;
  if (!token || !VALID_TOKENS.has(token)) {
    return res.status(403).json({ ok: false, error: "TOKEN_INVALID" });
  }
  next();
}

async function callGrizzly(params) {
  const url = new URL(GRIZZLY_URL);
  url.searchParams.set("api_key", API_KEY);

  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });

  const response = await fetch(url);
  const text = await response.text();
  return text.trim();
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/countries", requireToken, (req, res) => {
  res.json({ ok: true, countries });
});

app.post("/api/rent", requireToken, async (req, res) => {
  try {
    const { country = "16", service = "tt" } = req.body;

    const result = await callGrizzly({
      action: "getNumber",
      service,
      country
    });

    if (result.startsWith("ACCESS_NUMBER:")) {
      const [, id, phone] = result.split(":");
      return res.json({ ok: true, id, phone });
    }

    res.json({ ok: false, error: result });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.get("/api/status", requireToken, async (req, res) => {
  try {
    const { id } = req.query;

    const result = await callGrizzly({
      action: "getStatus",
      id
    });

    if (result.startsWith("STATUS_OK:")) {
      return res.json({
        ok: true,
        code: result.split(":")[1]
      });
    }

    res.json({ ok: true, status: "waiting" });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
