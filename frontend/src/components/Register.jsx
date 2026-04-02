import { useMemo, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { registerUser } from "../services/api.js";

const PASSWORD_REGEX = /^(?=.*\d).{8,}$/;
const PASSWORD_HINT = "Password must be at least 8 characters and include a number";

function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPasswordStrong = useMemo(() => PASSWORD_REGEX.test(password), [password]);
  const doPasswordsMatch = useMemo(
    () => confirmPassword === "" || password === confirmPassword,
    [confirmPassword, password]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isPasswordStrong) {
      setError(PASSWORD_HINT);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({ username, password, phone: `+${phone}` });
      onRegisterSuccess("Account created successfully. Please login.");
    } catch (apiError) {
      setError(apiError.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <div className="auth-card-header">
        <p className="eyebrow">Get Started</p>
        <h2>Create your account</h2>
        <p className="auth-copy">Set up a secure login so your chat sessions stay connected to you.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label>
          Phone Number
          <PhoneInput
            country="mu"
            value={phone}
            onChange={setPhone}
            inputStyle={{ width: "100%" }}
            containerClass="phone-field"
            inputClass="phone-input"
            buttonClass="phone-dropdown"
          />
        </label>

        <label>
          Password
          <div className="password-field">
            <input
              className="password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
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

        <p className={`hint-text ${password && !isPasswordStrong ? "error-text" : ""}`}>
          {PASSWORD_HINT}
        </p>

        <label>
          Confirm Password
          <div className="password-field">
            <input
              className="password-input"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
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

        {password && !isPasswordStrong ? (
          <p className="status-message error">{PASSWORD_HINT}</p>
        ) : null}

        {confirmPassword && !doPasswordsMatch ? (
          <p className="status-message error">Passwords do not match.</p>
        ) : null}

        {error ? <p className="status-message error">{error}</p> : null}

        <button
          className="primary-button"
          type="submit"
          disabled={loading || !phone || !isPasswordStrong || !confirmPassword || !doPasswordsMatch}
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account?{" "}
        <button className="text-button" type="button" onClick={onSwitchToLogin}>
          Login here
        </button>
      </p>
    </section>
  );
}

export default Register;
