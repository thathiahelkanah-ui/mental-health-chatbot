/**
 * File Purpose:
 * Manages authentication, theme preference, and the main chat/auth layout.
 */
import { useEffect, useState } from "react";
import { FiMenu, FiMoon, FiSun } from "react-icons/fi";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import Chat from "./components/Chat.jsx";

const STORAGE_KEY = "chatbot-auth";
const THEME_KEY = "chatbot-theme";
const SIDEBAR_KEY = "sidebarOpen";

/**
 * Reads the auth screen from the current URL path.
 * Reset links use /reset-password/:token while other auth screens use simple paths.
 */
const getInitialAuthMode = () => {
  if (window.location.pathname === "/forgot-password") {
    return "forgot-password";
  }

  if (window.location.pathname.startsWith("/reset-password/")) {
    return "reset-password";
  }

  return "login";
};

/**
 * Extracts the reset token from /reset-password/:token.
 * @returns {string} Reset token from the URL or an empty string
 */
const getResetTokenFromPath = (path = window.location.pathname) => {
  if (!path.startsWith("/reset-password/")) {
    return "";
  }

  return decodeURIComponent(path.replace("/reset-password/", ""));
};

/**
 * Root application shell
 * Persists auth, theme, and sidebar state across browser sessions
 */
function App() {
  /**
   * Application State
   * Tracks the current auth view, persisted user session, theme, and sidebar visibility
   */
  const [authMode, setAuthMode] = useState(getInitialAuthMode);
  const [resetToken, setResetToken] = useState(getResetTokenFromPath);
  const [authFeedback, setAuthFeedback] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [auth, setAuth] = useState(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    return savedAuth ? JSON.parse(savedAuth) : { token: "", user: null };
  });

  /**
   * Persistence Effects
   * Keep browser storage synchronized with the user's current app preferences
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  /**
   * Handles browser back/forward navigation for password reset screens.
   */
  useEffect(() => {
    const handlePopState = () => {
      setAuthMode(getInitialAuthMode());
      setResetToken(getResetTokenFromPath());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  /**
   * Changes the active auth screen and keeps the browser URL in sync.
   */
  const navigateAuth = (mode, path = "/") => {
    setAuthMode(mode);
    setResetToken(getResetTokenFromPath(path));
    window.history.pushState({}, "", path);
  };

  /**
   * Handles a successful login
   * Stores the token and user profile returned by the API
   */
  const handleAuthSuccess = ({ token, user }) => {
    setAuth({ token, user });
    setAuthFeedback("");
  };

  /**
   * Logs out the current user
   * Clears the persisted session and returns the app to the login view
   */
  const handleLogout = () => {
    setAuth({ token: "", user: null });
    localStorage.removeItem(STORAGE_KEY);
    navigateAuth("login", "/");
    setSidebarOpen(false);
  };

  /**
   * Handles successful registration
   * Shows a login prompt with the registration success message
   */
  const handleRegisterSuccess = (message) => {
    navigateAuth("login", "/");
    setAuthFeedback(message);
  };

  /**
   * Handles a successful password reset.
   * Returns the user to login with a confirmation message.
   */
  const handleResetSuccess = (message) => {
    navigateAuth("login", "/");
    setAuthFeedback(message);
  };

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <header className="app-topbar">
        <button
          className={`topbar-icon-button hamburger ${auth.token ? "" : "hidden-button"}`}
          type="button"
          onClick={() => setSidebarOpen((current) => !current)}
          aria-label="Toggle chat list"
          disabled={!auth.token}
        >
          <FiMenu />
        </button>

        <div className="header-title">
          <span className="logo" aria-hidden="true">
            🤖
          </span>
          <h1 className="title-text">Chat Buddy</h1>
        </div>

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
        ) : authMode === "forgot-password" ? (
          <ForgotPassword
            onBackToLogin={() => {
              navigateAuth("login", "/");
              setAuthFeedback("");
            }}
          />
        ) : authMode === "reset-password" ? (
          <ResetPassword
            token={resetToken}
            onResetSuccess={handleResetSuccess}
            onBackToLogin={() => {
              navigateAuth("login", "/");
              setAuthFeedback("");
            }}
          />
        ) : authMode === "login" ? (
          <Login
            onAuthSuccess={handleAuthSuccess}
            onSwitchToRegister={() => {
              navigateAuth("register", "/");
              setAuthFeedback("");
            }}
            onForgotPassword={() => {
              navigateAuth("forgot-password", "/forgot-password");
              setAuthFeedback("");
            }}
            successMessage={authFeedback}
          />
        ) : (
          <Register
            onSwitchToLogin={() => {
              navigateAuth("login", "/");
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
