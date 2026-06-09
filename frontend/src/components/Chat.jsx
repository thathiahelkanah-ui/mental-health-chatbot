/**
 * File Purpose:
 * Displays chat messages and handles user interactions.
 */
import { useEffect, useRef, useState } from "react";
import Message from "./Message.jsx";
import Sidebar from "./Sidebar.jsx";

const BASE_URL = import.meta.env.VITE_API_URL;
const getCreatedAt = () => new Date().toISOString();

/**
 * Formats a message timestamp for date separators
 * @param {string} createdAt - ISO date or timestamp value from a message
 * @returns {string|null} Human-readable date label or null for invalid dates
 */
const formatDateLabel = (createdAt) => {
  if (!createdAt) return null;

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Chat workspace
 * Coordinates message state, chat history, API calls, and sidebar actions
 */
function Chat({ token, user, onLogout, darkMode, sidebarOpen, onSidebarOpenChange }) {
  /**
   * Chat State
   * Tracks saved conversations, the active thread, input text, loading states, and delete confirmation
   */
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const messagesEndRef = useRef(null);

  /**
   * Normalizes a message object with a display timestamp
   * @param {object} message - Message returned by the API or created locally
   * @returns {object} Message with a createdAt value for rendering
   */
  const buildMessage = (message) => {
    const createdAt = message.createdAt || message.date || getCreatedAt();

    return {
      ...message,
      createdAt,
    };
  };

  /**
   * Normalizes a list of messages for display
   * @param {Array} nextMessages - Message list from the API
   * @returns {Array} Messages with consistent timestamp fields
   */
  const normalizeMessages = (nextMessages = []) => nextMessages.map(buildMessage);

  /**
   * Detects mobile viewport width
   * @returns {boolean} Whether the current viewport should use mobile sidebar behavior
   */
  const isMobileViewport = () => window.innerWidth < 768;

  /**
   * Closes the sidebar on mobile after navigation actions
   * Keeps desktop sidebar behavior unchanged
   */
  const closeSidebarMobile = () => {
    if (isMobileViewport()) {
      onSidebarOpenChange(false);
    }
  };

  /**
   * Loads saved chats for the authenticated user
   * @returns {Promise<Array>} Filtered list of chats containing at least one message
   */
  const loadChats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log("Loaded chats:", data);

      if (!res.ok) {
        const apiError = new Error(data.message || "Failed to load chats.");
        apiError.status = res.status;
        throw apiError;
      }

      const nextChats = (Array.isArray(data) ? data : []).filter(
        (chat) => Array.isArray(chat.messages) && chat.messages.length > 0
      );
      setChats(nextChats);
      return nextChats;
    } catch (apiError) {
      console.error("Failed to load chats:", apiError);
      setError(apiError.message || "Failed to load chats.");

      if (apiError.status === 401) {
        onLogout();
      }

      return [];
    }
  };

  /**
   * Fetches chats for initial setup
   * @returns {Promise<Array>} Loaded chats or an empty array
   */
  const fetchChats = async () => {
    const loadedChats = await loadChats();

    if (Array.isArray(loadedChats) && loadedChats.length > 0) {
      return loadedChats;
    }

    return [];
  };

  /**
   * Loads a selected chat thread
   * @param {string} id - Chat id selected from the sidebar
   */
  const loadChat = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/chat/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log("Loaded chat:", data);

      if (!res.ok) {
        const apiError = new Error(data.message || "Failed to load chat.");
        apiError.status = res.status;
        throw apiError;
      }

      setMessages(normalizeMessages(Array.isArray(data.messages) ? data.messages : []));
      setActiveChatId(data.chatId || id);
      closeSidebarMobile();
    } catch (apiError) {
      console.error("Failed to load chat:", apiError);
      setError(apiError.message || "Failed to load chat.");

      if (apiError.status === 401) {
        onLogout();
      }
    }
  };

  /**
   * Fetches an AI-generated greeting
   * Provides a local fallback greeting when the API request fails
   */
  const fetchGreeting = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/chat/greeting`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setMessages([
        buildMessage({
          role: "bot",
          text: data.greeting,
        }),
      ]);
    } catch (error) {
      console.error("Greeting fetch error:", error);

      setMessages([
        buildMessage({
          role: "bot",
          text: "Hi! I'm here for you. What's on your mind today?",
        }),
      ]);
    }
  };

  const activeChat = chats.find((chat) => chat._id === activeChatId) || null;

  /**
   * Initial Chat Load
   * Loads existing chats and shows a greeting when the user has no saved history
   */
  useEffect(() => {
    if (!token) return;
    const initChat = async () => {
      const existingChats = await fetchChats();

      if (existingChats.length === 0) {
        await fetchGreeting();
      }
    };

    initChat();
  }, [token]);

  /**
   * Message Scroll Effect
   * Keeps the newest message or typing indicator visible
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /**
   * Starts a new chat thread
   * Resets active chat state and seeds the conversation with a supportive prompt
   */
  const handleNewChat = () => {
    console.log("New chat started");
    setMessages([
      buildMessage({
        role: "bot",
        text: "Hi! I'm here for you. What's on your mind today?",
      }),
    ]);
    setActiveChatId(null);
    setInput("");
    setError("");
    closeSidebarMobile();
  };

  /**
   * Confirms deletion of the selected chat
   * Removes the chat from local state after the backend delete succeeds
   */
  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    try {
      const res = await fetch(`${BASE_URL}/api/chat/${chatToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const apiError = new Error(data.message || "Failed to delete chat.");
        apiError.status = res.status;
        throw apiError;
      }

      setChats((prev) => prev.filter((chat) => chat._id !== chatToDelete));

      if (chatToDelete === activeChatId) {
        handleNewChat();
      }

      setShowDeleteModal(false);
      setChatToDelete(null);
    } catch (apiError) {
      console.error("Delete chat error:", apiError);
      setError(apiError.message || "Failed to delete chat.");
    }
  };

  /**
   * Cancels pending chat deletion
   * Clears modal state without calling the API
   */
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setChatToDelete(null);
  };

  /**
   * Sends the user's message to the chat API
   * Optimistically renders the user message and appends the assistant response
   */
  const sendMessage = async (event) => {
    event.preventDefault();

    if (!input.trim() || loading) return;

    const currentInput = input;
    const userMessage = buildMessage({ role: "user", text: currentInput });

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);
    setInput("");
    setLoading(true);
    setIsTyping(true);
    setError("");

    try {
      /**
       * Chat API Request
       * Sends the current message and optional chat id so the backend can create or continue a thread
       */
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentInput,
          chatId: activeChatId,
        }),
      });

      const data = await res.json();
      const botReply = data.messages?.[data.messages.length - 1]?.text || "No response";

      setMessages((prev) => [
        ...prev,
        buildMessage({ role: "bot", text: botReply }),
      ]);
      setActiveChatId(data.chatId || null);
      await fetchChats();

      console.log("Response:", data);
    } catch (apiError) {
      console.error("Error:", apiError);
      setMessages((prev) => [...prev, buildMessage({ role: "bot", text: "Something went wrong." })]);
      setError(apiError.message || "Failed to send message.");

      if (apiError.status === 401) {
        onLogout();
      }
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  return (
    <section className={`chat-workspace ${darkMode ? "theme-dark" : "theme-light"}`}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={loadChat}
        onDeleteChat={(id) => {
          setChatToDelete(id);
          setShowDeleteModal(true);
        }}
        user={user}
        onLogout={() => {
          onSidebarOpenChange(false);
          onLogout();
        }}
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => onSidebarOpenChange(false)}
      />

      {sidebarOpen ? (
        <div
          className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
          onClick={() => onSidebarOpenChange(false)}
          aria-hidden={!sidebarOpen}
        />
      ) : null}

      <div className="chat-panel">
        {showDeleteModal ? (
          <div className="modal-overlay" onClick={cancelDelete}>
            <div
              className="modal-box"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-chat-title"
            >
              <h3 id="delete-chat-title">Delete chat?</h3>
              <p>This action cannot be undone.</p>
              <div className="modal-actions">
                <button type="button" onClick={cancelDelete} className="cancel-btn">
                  Cancel
                </button>
                <button type="button" onClick={confirmDeleteChat} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="chat-body">
          <div className="messages-container">
            <div className="chat-status-row">
              <span className="chat-thread-title">{activeChat?.title || "New chat"}</span>
            </div>
            <div className="chat-thread">
              {messages.map((message, index) => {
                const currentDate = formatDateLabel(message.createdAt);
                const prevDate = index > 0 ? formatDateLabel(messages[index - 1].createdAt) : null;
                // Date separators are shown only when the message date changes.
                const showDate = index === 0 ? !!currentDate : currentDate !== prevDate;

                return (
                  <div key={`${activeChatId || "new"}-${message.role}-${message.createdAt || "no-time"}-${index}`}>
                    {showDate ? <div className="date-separator">{currentDate}</div> : null}
                    <Message message={message} />
                  </div>
                );
              })}
              {isTyping ? (
                <div className="typing-row">
                  <Message message={{ role: "bot", text: "Typing...", typing: true, createdAt: getCreatedAt() }} />
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="input-container">
            {error ? <p className="status-message error">{error}</p> : null}

            <form className="chat-input-row" onSubmit={sendMessage}>
              <input
                type="text"
                placeholder={loading ? "Waiting for response..." : "Message the assistant..."}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={loading}
              />
              <button className="primary-button send-button" type="submit" disabled={loading || !input.trim()}>
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Chat;
