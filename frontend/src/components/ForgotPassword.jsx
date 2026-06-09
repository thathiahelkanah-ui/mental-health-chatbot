/**
 * File Purpose:
 * Requests a secure password reset link for a username.
 */
import { useState } from "react";
import { forgotPassword } from "../services/api.js";

/**
 * Forgot Password Component
 * Collects a username and shows a generic success message after submission.
 */
function ForgotPassword({ onBackToLogin }) {
  /**
   * Form State
   * Tracks the username, loading state, and reset request feedback.
   */
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /**
   * Submits the forgot password request.
   * The backend always responds generically so usernames cannot be enumerated.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await forgotPassword({ username });
      setMessage(response.message || "If the account exists, a reset email has been sent.");
    } catch (apiError) {
      setError(apiError.message || "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <div className="auth-card-header">
        <p className="eyebrow">Account Recovery</p>
        <h2>Reset your password</h2>
        <p className="auth-copy">Enter your username and we will email a secure reset link.</p>
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

        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="auth-footer">
        Remembered your password?{" "}
        <button className="text-button" type="button" onClick={onBackToLogin}>
          Back to login
        </button>
      </p>
    </section>
  );
}

export default ForgotPassword;
