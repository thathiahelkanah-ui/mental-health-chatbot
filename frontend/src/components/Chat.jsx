import { useEffect, useMemo, useRef, useState } from "react";
import Message from "./Message.jsx";
import Sidebar from "./Sidebar.jsx";
import { getChats, sendChatMessage } from "../services/api.js";

const createLoadingMessage = () => ({
  role: "bot",
  text: "Typing...",
  loading: true,
});

const buildTitle = (message) => {
  const trimmed = message.trim();
  return trimmed.length <= 30 ? trimmed : `${trimmed.slice(0, 30)}...`;
};

function Chat({ token, user, onLogout, darkMode, sidebarOpen, onSidebarOpenChange }) {
  const storageKey = useMemo(() => `chatbot-history-${user?.id || user?.username || "guest"}`, [user]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
        setChats(nextChats);

        if (nextChats.length > 0) {
          setActiveChatId(nextChats[0].id);
          setMessages(nextChats[0].messages || []);
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      } catch (apiError) {
        const savedChats = localStorage.getItem(storageKey);

        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
          if (Array.isArray(parsedChats) && parsedChats.length > 0) {
            setChats(parsedChats);
            setActiveChatId(parsedChats[0].id);
            setMessages(parsedChats[0].messages || []);
            return;
          }
        }

        setError(apiError.message || "Failed to load chats.");

        if (apiError.status === 401) {
          onLogout();
          return;
        }

        setChats([]);
        setActiveChatId(null);
        setMessages([]);
      }
    };

    loadChats();
  }, [onLogout, storageKey, token, user]);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(chats));
    }
  }, [chats, storageKey]);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setError("");
    onSidebarOpenChange(false);
  };

  const syncChatInList = (chatId, nextMessages, fallbackTitle) => {
    setChats((currentChats) => {
      const existingChat = currentChats.find((chat) => chat.id === chatId);
      const nextTitle =
        nextMessages.find((message) => message.role === "user")?.text
          ? buildTitle(nextMessages.find((message) => message.role === "user").text)
          : fallbackTitle;

      if (!existingChat) {
        return [
          {
            id: chatId,
            title: nextTitle || "New chat",
            messages: nextMessages,
          },
          ...currentChats,
        ];
      }

      const updatedChats = currentChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title: nextTitle || chat.title,
              messages: nextMessages,
            }
          : chat
      );

      const updatedActiveChat = updatedChats.find((chat) => chat.id === chatId);
      const remainingChats = updatedChats.filter((chat) => chat.id !== chatId);
      return updatedActiveChat ? [updatedActiveChat, ...remainingChats] : updatedChats;
    });
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || loading) {
      return;
    }

    const nextUserMessage = { role: "user", text: trimmedInput };
    const optimisticMessages = [
      ...messages,
      nextUserMessage,
      createLoadingMessage(),
    ];

    setMessages(optimisticMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await sendChatMessage(token, trimmedInput, activeChatId);
      const nextChatId = response.data?.chatId || activeChatId;
      const nextMessages = Array.isArray(response.data?.messages) ? response.data.messages : optimisticMessages;

      setActiveChatId(nextChatId);
      setMessages(nextMessages);
      syncChatInList(nextChatId, nextMessages, buildTitle(trimmedInput));
    } catch (apiError) {
      setMessages((currentMessages) => currentMessages.filter((message) => !message.loading));
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
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={(chatId) => {
          setActiveChatId(chatId);
          const selectedChat = chats.find((chat) => chat.id === chatId);
          setMessages(selectedChat?.messages || []);
          onSidebarOpenChange(false);
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

      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => onSidebarOpenChange(false)}
        aria-hidden={!sidebarOpen}
      />

      <div className="chat-panel">
        <div className="chat-body">
          <div className="chat-window">
            <div className="chat-status-row">
              <span className="chat-thread-title">{activeChat?.title || "New chat"}</span>
              <span className={`chat-status ${loading ? "busy" : ""}`}>
                {loading ? "Assistant is typing..." : "Ready"}
              </span>
            </div>
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
