/**
 * File Purpose:
 * Completes password reset using a secure token from the email link.
 */
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { resetPassword } from "../services/api.js";

/**
 * Reset Password Component
 * Accepts and confirms a new password before submitting it with the reset token.
 */
function ResetPassword({ token, onResetSuccess, onBackToLogin }) {
  /**
   * Form State
   * Tracks the new password, confirmation field, visibility toggles, loading, and feedback.
   */
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /**
   * Submits the new password.
   * Validation keeps empty or mismatched passwords from reaching the API.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(token, { password });
      setMessage(response.message || "Password reset successfully.");
      onResetSuccess(response.message || "Password reset successfully. Please login.");
    } catch (apiError) {
      setError(apiError.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <div className="auth-card-header">
        <p className="eyebrow">Secure Reset</p>
        <h2>Create a new password</h2>
        <p className="auth-copy">Use a password you have not used for Chat Buddy before.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          New Password
          <div className="password-field">
            <input
              className="password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
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

        <label>
          Confirm Password
          <div className="password-field">
            <input
              className="password-input"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </label>

        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={loading || !password || !confirmPassword}>
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>

      <p className="auth-footer">
        Already reset it?{" "}
        <button className="text-button" type="button" onClick={onBackToLogin}>
          Back to login
        </button>
      </p>
    </section>
  );
}

export default ResetPassword;
