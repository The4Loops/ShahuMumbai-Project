// Save user events to your Node API (MSSQL), not Supabase
import api from "./supabase/axios"; // your axios instance (baseURL http://localhost:5000)

const ANON_KEY = "anon_id";

function getAnonId() {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

function getUTM() {
  const params = new URLSearchParams(window.location.search);
  const known = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
  const utm = {};
  for (const k of known) {
    const v = params.get(k);
    if (v) utm[k.replace("utm_","")] = v;
  }
  return utm;
}

// Primary transport: axios
async function sendViaAxios(payload) {
  return api.post("/api/analytics/track", payload);
}

// Fallback: Beacon (non-blocking, survives unload)
function sendViaBeacon(payload) {
  try {
    const url = (api.defaults.baseURL || "").replace(/\/$/, "") + "/api/analytics/track";
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    return navigator.sendBeacon(url, blob);
  } catch {
    return false;
  }
}

export async function trackDB(name, properties = {}, userId = null) {
  const payload = {
    name,
    anon_id: getAnonId(),
    user_id: userId || null,
    url: window.location.href,
    referrer: document.referrer || null,
    utm: getUTM(),
    properties
  };
  console.log("trackDB", payload);
  try {
    await sendViaAxios(payload);
  } catch(e) {
    console.warn("trackDB axios failed",e);
    sendViaBeacon(payload);
  }
}
