require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const WS = require("ws");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment");
}

// Accept either project URL or REST URL and normalize to project base URL.
const normalizedUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(
  /\/+$/,
  "",
);

// Node < 22 needs an explicit WebSocket implementation for realtime client init.
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WS;
}

const supabase = createClient(normalizedUrl, SUPABASE_ANON_KEY, {
  // default options
});

module.exports = supabase;
