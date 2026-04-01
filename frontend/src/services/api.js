const BASE_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function registerUser(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendChatMessage(token, message, chatId) {
  return request("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      ...(chatId ? { chatId } : {}),
    }),
  });
}

export async function getChats(token) {
  return request("/api/chat", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getChatById(token, chatId) {
  return request(`/api/chat/${chatId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
