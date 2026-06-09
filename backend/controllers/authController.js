/**
 * File Purpose:
 * Handles registration, login, JWT creation, and auth response formatting.
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RESET_MESSAGE = "If the account exists, a reset email has been sent.";
const PASSWORD_RESET_EXPIRATION_MS = 15 * 60 * 1000;

/**
 * Generates a JWT for an authenticated user
 * @param {string} userId - MongoDB user identifier to encode in the token
 * @returns {string} Signed JWT that expires in one day
 */
const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: "1d" });
};

/**
 * Sends a successful API response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code for the response
 * @param {string} message - Human-readable success message
 * @param {object} data - Additional response payload fields
 * @returns {object} Express JSON response
 */
const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

/**
 * Sends a standardized error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code for the error
 * @param {string} message - Human-readable error message
 * @returns {object} Express JSON response
 */
const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Hashes a password reset token before storing it.
 * @param {string} token - Raw reset token sent to the user's email
 * @returns {string} SHA-256 hash used for database lookup
 */
const hashResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Registers a new user account
 * Validates input, stores account recovery email, and keeps username as the login identifier
 */
export const registerUser = async (req, res, next) => {
  console.log("[AUTH] Register endpoint hit");

  try {
    const { username, email, password } = req.body;
    console.log("Incoming username:", username);

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters long.");
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();
    console.log("Trimmed username:", trimmedUsername);

    if (!trimmedUsername || !trimmedEmail) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    /**
     * Registration Uniqueness Check
     * Email is collected for account recovery, while username remains the primary login identifier.
     */
    const existingUser = await User.findOne({
      $or: [
        { username: trimmedUsername },
        { email: trimmedEmail },
      ],
    });
    console.log("Existing user found:", existingUser);

    if (existingUser) {
      if (existingUser.email === trimmedEmail) {
        return sendError(res, 409, "Email already exists.");
      }

      return sendError(res, 409, "Username already exists.");
    }

    const user = await User.create({ username: trimmedUsername, email: trimmedEmail, password });

    return sendSuccess(res, 201, "User registered successfully.", {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[AUTH] Register error:", error.message);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return sendError(res, 409, duplicateField === "email" ? "Email already exists." : "Username already exists.");
    }

    return next(error);
  }
};

/**
 * Authenticates an existing user
 * Verifies username/password credentials and returns a signed token with the user profile
 */
export const loginUser = async (req, res, next) => {
  console.log("[AUTH] Login endpoint hit");

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 400, "Username and password are required.");
    }

    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      return sendError(res, 400, "Username and password are required.");
    }

    // Login intentionally uses username only; email is reserved for account recovery workflows.
    const user = await User.findOne({ username: trimmedUsername });

    if (!user) {
      return sendError(res, 401, "Invalid username or password.");
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return sendError(res, 401, "Invalid username or password.");
    }

    return sendSuccess(res, 200, "Login successful.", {
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("[AUTH] Login error:", error.message);
    return next(error);
  }
};

/**
 * Starts a password reset request for a username.
 * Generates a secure single-use token and sends a 15-minute reset link by email.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username) {
      return sendSuccess(res, 200, PASSWORD_RESET_MESSAGE);
    }

    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      return sendSuccess(res, 200, PASSWORD_RESET_MESSAGE);
    }

    const user = await User.findOne({ username: trimmedUsername });

    if (!user || !user.email) {
      return sendSuccess(res, 200, PASSWORD_RESET_MESSAGE);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    /**
     * Reset Token Security
     * The raw token goes only to the user's email; the database stores a hash and short expiration.
     */
    user.resetPasswordToken = hashResetToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MS);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (emailError) {
      console.error("[AUTH] Password reset email error:", emailError.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
    }

    return sendSuccess(res, 200, PASSWORD_RESET_MESSAGE);
  } catch (error) {
    console.error("[AUTH] Forgot password error:", error.message);
    return next(error);
  }
};

/**
 * Resets a password using a valid reset token.
 * Hashes the new password through the User model save hook and clears token fields after use.
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return sendError(res, 400, "Password is required.");
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters long.");
    }

    const hashedToken = hashResetToken(req.params.token);

    /**
     * Token Validation
     * The reset link is valid only when the hashed token matches and the 15-minute window has not expired.
     */
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return sendError(res, 400, "Password reset link is invalid or has expired.");
    }

    /**
     * Password Reset
     * Assigning password triggers the model hook, which hashes it before saving.
     */
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return sendSuccess(res, 200, "Password reset successfully.");
  } catch (error) {
    console.error("[AUTH] Reset password error:", error.message);
    return next(error);
  }
};
