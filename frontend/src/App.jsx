import { useEffect, useState } from "react";
import { FiMenu, FiMoon, FiSun } from "react-icons/fi";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Chat from "./components/Chat.jsx";

const STORAGE_KEY = "chatbot-auth";
const THEME_KEY = "chatbot-theme";

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authFeedback, setAuthFeedback] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [auth, setAuth] = useState(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    return savedAuth ? JSON.parse(savedAuth) : { token: "", user: null };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const handleAuthSuccess = ({ token, user }) => {
    setAuth({ token, user });
    setAuthFeedback("");
  };

  const handleLogout = () => {
    setAuth({ token: "", user: null });
    localStorage.removeItem(STORAGE_KEY);
    setAuthMode("login");
    setSidebarOpen(false);
  };

  const handleRegisterSuccess = (message) => {
    setAuthMode("login");
    setAuthFeedback(message);
  };

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <header className="app-topbar">
        <button
          className={`topbar-icon-button ${auth.token ? "" : "hidden-button"}`}
          type="button"
          onClick={() => setSidebarOpen((current) => !current)}
          aria-label="Toggle chat list"
          disabled={!auth.token}
        >
          <FiMenu />
        </button>

        <h1 className="app-topbar-title">Mental Chat</h1>

        <button
          className="topbar-icon-button"
          type="button"
          onClick={() => setDarkMode((current) => !current)}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
      </header>

      <main className={`app-card ${auth.token ? "chat-mode" : "auth-mode"}`}>
        {!auth.token ? (
          <header className="app-header">
            <div>
              <p className="eyebrow">Mental Wellness Support</p>
              <h1>Chat with a calm, supportive assistant</h1>
            </div>
          </header>
        ) : null}

        {auth.token ? (
          <Chat
            token={auth.token}
            user={auth.user}
            onLogout={handleLogout}
            darkMode={darkMode}
            sidebarOpen={sidebarOpen}
            onSidebarOpenChange={setSidebarOpen}
          />
        ) : authMode === "login" ? (
          <Login
            onAuthSuccess={handleAuthSuccess}
            onSwitchToRegister={() => {
              setAuthMode("register");
              setAuthFeedback("");
            }}
            successMessage={authFeedback}
          />
        ) : (
          <Register
            onSwitchToLogin={() => {
              setAuthMode("login");
              setAuthFeedback("");
            }}
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}
      </main>
    </div>
  );
}

export default App;
