import { useEffect, useState } from "react";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Chat from "./components/Chat.jsx";

const STORAGE_KEY = "chatbot-auth";

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authFeedback, setAuthFeedback] = useState("");
  const [auth, setAuth] = useState(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    return savedAuth ? JSON.parse(savedAuth) : { token: "", user: null };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  const handleAuthSuccess = ({ token, user }) => {
    setAuth({ token, user });
    setAuthFeedback("");
  };

  const handleLogout = () => {
    setAuth({ token: "", user: null });
    localStorage.removeItem(STORAGE_KEY);
    setAuthMode("login");
  };

  const handleRegisterSuccess = (message) => {
    setAuthMode("login");
    setAuthFeedback(message);
  };

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <main className={`app-card ${auth.token ? "chat-mode" : "auth-mode"}`}>
        <header className="app-header">
          <div>
            <p className="eyebrow">Mental Wellness Support</p>
            <h1>Chat with a calm, supportive assistant</h1>
          </div>
        </header>

        {auth.token ? (
          <Chat token={auth.token} user={auth.user} onLogout={handleLogout} />
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
