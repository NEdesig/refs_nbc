
const SUPABASE_URL = "https://ckfwxtirevtzgrzwypio.supabase.co";
const SUPABASE_KEY = "sb_publishable_N55S09HuLN-2XlnYCjE61w_AKX12EuB";

const AUTH_STORAGE = "ref_hockey_session";

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE) || "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    if (session) {
      localStorage.setItem(AUTH_STORAGE, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_STORAGE);
    }
  } catch (error) {
    console.error("Ошибка сохранения сессии:", error);
  }
}

async function readResponse(response) {
  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error_description ||
      data?.msg ||
      data?.hint ||
      text ||
      `Ошибка HTTP ${response.status}`
    );
  }

  return data;
}

async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await readResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Не удалось подключиться к Supabase. Проверь интернет, URL проекта и доступность сервера."
      );
    }

    throw error;
  }
}

async function login(email, password) {
  const data = await request(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  saveSession(data);
  return data;
}

async function logout() {
  const session = getSession();

  if (session?.access_token) {
    try {
      await request(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${session.access_token}`
        }
      });
    } catch (error) {
      console.error("Ошибка завершения сессии:", error);
    }
  }

  saveSession(null);
}

async function api(path, options = {}) {
  const session = getSession();

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  return await request(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers
    }
  );
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function formatDate(date) {
  if (!date) return "";

  const [y, m, d] = date.split("-");
  return `${d}.${m}.${y}`;
}

function getWeekday(date) {
  if (!date) return "";

  const [y, m, d] = date.split("-").map(Number);

  const days = [
    "воскресенье",
    "понедельник",
    "вторник",
    "среда",
    "четверг",
    "пятница",
    "суббота"
  ];

  return days[new Date(y, m - 1, d).getDay()];
}

function formatDateWithWeekday(date) {
  if (!date) return "";

  return `${formatDate(date)}, ${getWeekday(date)}`;
}

function getMatchStart(match) {
  if (!match.match_date) return null;

  const time = match.match_time || "00:00";

  const [year, month, day] =
    match.match_date.split("-").map(Number);

  const [hour, minute] =
    time.split(":").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour || 0,
    minute || 0,
    0
  );
}

function isArchived(match) {
  const start = getMatchStart(match);

  if (!start) return false;

  return new Date() >= start;
}
