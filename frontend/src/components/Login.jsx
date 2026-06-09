/**
 * File Purpose:
 * Collects user credentials and starts an authenticated session.
 */
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { loginUser } from "../services/api.js";

/**
 * Login form
 * Handles password visibility, loading state, and API error feedback
 */
function Login({ onAuthSuccess, onSwitchToRegister, onForgotPassword, successMessage }) {
  /**
   * Form State
   * Stores credential inputs and submission feedback for the login form
   */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Submits login credentials to the API
   * Passes the returned token and user profile to the parent app on success
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loginResponse = await loginUser({ username, password });
      onAuthSuccess({
        token: loginResponse.token,
        user: loginResponse.user,
      });
    } catch (apiError) {
      setError(apiError.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <div className="auth-card-header">
        <p className="eyebrow">Welcome Back</p>
        <h2>Log in to continue your conversation</h2>
        <p className="auth-copy">Your messages stay tied to your account on this device.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <div className="password-field">
            <input
              className="password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </label>

        {successMessage ? <p className="status-message success">{successMessage}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="auth-footer">
        <button className="text-button" type="button" onClick={onForgotPassword}>
          Forgot Password?
        </button>
      </p>

      <p className="auth-footer">
        Need an account?{" "}
        <button className="text-button" type="button" onClick={onSwitchToRegister}>
          Create one
        </button>
      </p>
    </section>
  );
}

export default Login;
