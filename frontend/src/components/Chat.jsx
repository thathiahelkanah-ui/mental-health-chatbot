import { useEffect, useMemo, useRef, useState } from "react";
import Message from "./Message.jsx";
import Sidebar from "./Sidebar.jsx";
import { getChats, sendChatMessage } from "../services/api.js";

const createChatId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createWelcomeMessage = (username) => ({
  role: "bot",
  text: `Hi${username ? ` ${username}` : ""}, I am here to listen. What is on your mind today?`,
});

const createLoadingMessage = () => ({
  role: "bot",
  text: "Typing...",
  loading: true,
});

const createNewChat = (username) => ({
  id: createChatId(),
  title: "New chat",
  messages: [createWelcomeMessage(username)],
  isDraft: true,
});

const buildTitle = (message) => {
  const trimmed = message.trim();
  return trimmed.length <= 30 ? trimmed : `${trimmed.slice(0, 30)}...`;
};

function Chat({ token, user, onLogout, darkMode }) {
  const storageKey = useMemo(() => `chatbot-history-${user?.id || user?.username || "guest"}`, [user]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const normalizeChat = (chat) => ({
    id: chat._id || chat.id,
    title: chat.title || "New chat",
    messages: Array.isArray(chat.messages) ? chat.messages : [],
  });

  useEffect(() => {
    const loadChats = async () => {
      setError("");

      try {
        const response = await getChats(token);
        const nextChats = Array.isArray(response.data) ? response.data.map(normalizeChat) : [];

        if (nextChats.length > 0) {
          setChats(nextChats);
          setActiveChatId(nextChats[0].id);
          localStorage.setItem(storageKey, JSON.stringify(nextChats));
          return;
        }

        const firstChat = createNewChat(user?.username);
        setChats([firstChat]);
        setActiveChatId(firstChat.id);
      } catch (apiError) {
        const savedChats = localStorage.getItem(storageKey);

        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
          if (Array.isArray(parsedChats) && parsedChats.length > 0) {
            setChats(parsedChats);
            setActiveChatId(parsedChats[0].id);
            return;
          }
        }

        setError(apiError.message || "Failed to load chats.");

        if (apiError.status === 401) {
          onLogout();
          return;
        }

        const firstChat = createNewChat(user?.username);
        setChats([firstChat]);
        setActiveChatId(firstChat.id);
      }
    };

    loadChats();
  }, [onLogout, storageKey, token, user]);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(chats));
    }
  }, [chats, storageKey]);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    const nextChat = createNewChat(user?.username);
    setChats((currentChats) => [nextChat, ...currentChats]);
    setActiveChatId(nextChat.id);
    setInput("");
    setError("");
    setSidebarOpen(false);
  };

  const updateActiveChatMessages = (updater) => {
    setChats((currentChats) =>
      currentChats.map((chat) => {
        if (chat.id !== activeChatId) {
          return chat;
        }

        const nextMessages = updater(chat.messages);
        const firstUserMessage = nextMessages.find((message) => message.role === "user");

        return {
          ...chat,
          title: firstUserMessage ? buildTitle(firstUserMessage.text) : chat.title,
          messages: nextMessages,
        };
      })
    );
  };

  const replaceActiveChat = (updater) => {
    setChats((currentChats) => {
      const currentChat = currentChats.find((chat) => chat.id === activeChatId);

      if (!currentChat) {
        return currentChats;
      }

      const nextChat = updater(currentChat);
      const otherChats = currentChats.filter((chat) => chat.id !== activeChatId);
      return [nextChat, ...otherChats];
    });
  };

  const persistActiveChat = (chatId, title, replyText) => {
    replaceActiveChat((currentChat) => ({
      id: chatId || currentChat.id,
      title: title || currentChat.title,
      isDraft: false,
      messages: currentChat.messages.map((message) =>
        message.loading ? { role: "bot", text: replyText } : message
      ),
    }));
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || loading || !activeChatId) {
      return;
    }

    const nextUserMessage = { role: "user", text: trimmedInput };
    updateActiveChatMessages((currentMessages) => [
      ...currentMessages,
      nextUserMessage,
      createLoadingMessage(),
    ]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await sendChatMessage(
        token,
        trimmedInput,
        activeChat?.isDraft ? undefined : activeChat?.id
      );
      const nextChatId = response.data?.chatId || activeChat?.id;
      const nextTitle = response.data?.title || buildTitle(trimmedInput);
      const replyText = response.data?.reply || "I am here with you.";

      persistActiveChat(nextChatId, nextTitle, replyText);
      setActiveChatId(nextChatId);
    } catch (apiError) {
      updateActiveChatMessages((currentMessages) =>
        currentMessages.filter((message) => !message.loading)
      );
      setError(apiError.message || "Failed to send message.");

      if (apiError.status === 401) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`chat-workspace ${darkMode ? "theme-dark" : "theme-light"}`}>
      <Sidebar
        chats={chats}
        activeChatId={activeChat?.id}
        onNewChat={handleNewChat}
        onSelectChat={(chatId) => {
          setActiveChatId(chatId);
          setSidebarOpen(false);
        }}
        user={user}
        onLogout={() => {
          setSidebarOpen(false);
          onLogout();
        }}
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <div className="chat-panel">
        <div className="chat-panel-header">
          <div className="chat-header-main">
            <button
              className="sidebar-menu-button"
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
            >
              &#9776;
            </button>
            <p className="eyebrow">Supportive Space</p>
            <h2>{activeChat?.title || "New chat"}</h2>
          </div>
          <span className={`chat-status ${loading ? "busy" : ""}`}>
            {loading ? "Assistant is typing..." : "Ready"}
          </span>
        </div>

        <div className="chat-body">
          <div className="chat-window">
            <div className="chat-thread">
              {messages.map((message, index) => (
                <Message
                  key={`${activeChat?.id}-${message.role}-${index}`}
                  role={message.role}
                  text={message.text}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="chat-composer">
            {error ? <p className="status-message error">{error}</p> : null}

            <form className="chat-input-row" onSubmit={handleSend}>
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
