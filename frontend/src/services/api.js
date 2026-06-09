/**
 * File Purpose:
 * Provides shared helpers for communicating with the backend API.
 */
const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Sends an HTTP request to the backend API
 * Adds JSON headers, parses responses, and throws formatted API errors
 * @param {string} path - API path relative to the configured backend base URL
 * @param {object} options - Fetch options such as method, headers, and body
 * @returns {Promise<object>} Parsed JSON response body
 */
async function request(path, options = {}) {
  console.log("[API] Request:", {
    url: `${BASE_URL}${path}`,
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body || null,
  });

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  console.log("[API] Response:", {
    url: `${BASE_URL}${path}`,
    status: response.status,
    ok: response.ok,
    data,
  });

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    console.error("[API] Error:", {
      url: `${BASE_URL}${path}`,
      status: response.status,
      data,
    });
    throw error;
  }

  return data;
}

/**
 * Registers a new user account
 * @param {object} payload - Username, email, and password submitted by the user
 * @returns {Promise<object>} Registration response from the backend
 */
export async function registerUser(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Logs in an existing user
 * @param {object} payload - Username and password submitted by the user
 * @returns {Promise<object>} Auth token and user profile from the backend
 */
export async function loginUser(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Requests a password reset link for a username.
 * @param {object} payload - Username submitted for account recovery
 * @returns {Promise<object>} Generic reset request response
 */
export async function forgotPassword(payload) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Resets a user's password with a token from the email link.
 * @param {string} token - Single-use reset token from the URL
 * @param {object} payload - New password submitted by the user
 * @returns {Promise<object>} Password reset response
 */
export async function resetPassword(token, payload) {
  return request(`/api/auth/reset-password/${token}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Sends a chat message to the backend
 * @param {string} token - JWT used to authenticate the request
 * @param {string} message - User message text
 * @param {string} chatId - Existing chat id when continuing a conversation
 * @returns {Promise<object>} Updated chat data from the backend
 */
export async function sendChatMessage(token, message, chatId) {
  console.log("[API] Sending chat message:", {
    message,
    chatId: chatId || null,
    hasToken: !!token,
  });

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

/**
 * Fetches all chats for the authenticated user
 * @param {string} token - JWT used to authenticate the request
 * @returns {Promise<Array>} Saved chat list
 */
export async function getChats(token) {
  return request("/api/chat", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Fetches a single chat by id
 * @param {string} token - JWT used to authenticate the request
 * @param {string} chatId - Chat identifier to load
 * @returns {Promise<object>} Chat details and message history
 */
export async function getChatById(token, chatId) {
  return request(`/api/chat/${chatId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
