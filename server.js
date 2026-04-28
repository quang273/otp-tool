require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GRIZZLY_API_KEY;
const VALID_TOKENS = new Set(
  (process.env.APP_TOKENS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
);

const DEFAULT_SERVICE = process.env.DEFAULT_SERVICE || "tt";
const GRIZZLY_URL = "https://api.grizzlysms.com/stubs/handler_api.php";

const countries = [
  { name: "United Kingdom", code: "16", dial: "+44", flag: "🇬🇧" },
  { name: "Indonesia", code: "6", dial: "+62", flag: "🇮🇩" },
  { name: "Thailand", code: "52", dial: "+66", flag: "🇹🇭" },
  { name: "Canada", code: "36", dial: "+1", flag: "🇨🇦" }
];

function requireToken(req, res, next) {
  const token = String(req.query.token || req.headers["x-app-token"] || "");
  if (!token || !VALID_TOKENS.has(token)) {
    return res.status(403).json({ ok: false, error: "TOKEN_INVALID" });
  }
  next();
}

async function callGrizzly(params) {
  if (!API_KEY) throw new Error("Missing GRIZZLY_API_KEY in .env");

  const url = new URL(GRIZZLY_URL);
  url.searchParams.set("api_key", API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
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
    const country = String(req.body.country || "16");
    const service = String(req.body.service || DEFAULT_SERVICE);

    const result = await callGrizzly({
      action: "getNumber",
      service,
      country
    });

    // Expected: ACCESS_NUMBER:activationId:phoneNumber
    if (result.startsWith("ACCESS_NUMBER:")) {
      const [, id, phone] = result.split(":");
      return res.json({ ok: true, id, phone, raw: result });
    }

    return res.status(400).json({ ok: false, error: result, raw: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/status", requireToken, async (req, res) => {
  try {
    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ ok: false, error: "MISSING_ID" });

    const result = await callGrizzly({
      action: "getStatus",
      id
    });

    // Expected pending: STATUS_WAIT_CODE
    // Expected success: STATUS_OK:123456
    if (result.startsWith("STATUS_OK:")) {
      const code = result.split(":").slice(1).join(":");
      return res.json({ ok: true, status: "ok", code, raw: result });
    }

    return res.json({ ok: true, status: "waiting", raw: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/cancel", requireToken, async (req, res) => {
  try {
    const id = String(req.body.id || "");
    if (!id) return res.status(400).json({ ok: false, error: "MISSING_ID" });

    const result = await callGrizzly({
      action: "setStatus",
      status: "8",
      id
    });

    res.json({ ok: true, raw: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`OTP rental tool running on http://localhost:${PORT}`);
});