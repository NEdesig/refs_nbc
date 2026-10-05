const SUPABASE_URL = "https://ckfwxtirevtzgrzwypio.supabase.co";
const SUPABASE_KEY = "sb_publishable_N55S09HuLN-2XlnYCjE61w_AKX12EuB";

async function api(path, options = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error_description ||
      text ||
      `HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[c]));
}

function formatDate(date) {
  if (!date) return "";

  const [y, m, d] = date.split("-");

  return `${d}.${m}.${y}`;
}
