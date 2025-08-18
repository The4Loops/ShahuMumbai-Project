import api from "./supabase/axios";

const ANON_KEY = 'anon_id';

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
  const known = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
  const utm = {};
  known.forEach(k => { if (params.get(k)) utm[k.replace('utm_','')] = params.get(k); });
  return utm;
}

export async function trackDB(name, properties = {}, userId = null) {
  try {
    await api.post('/api/track', {
      name,
      anon_id: getAnonId(),
      user_id: userId || null,
      url: window.location.href,
      referrer: document.referrer || null,
      utm: getUTM(),
      properties
    });
  } catch (_) {
    // silent fail; analytics must not break UX
  }
}
