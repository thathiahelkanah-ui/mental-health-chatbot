import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: "1d" });
};

const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export const registerUser = async (req, res, next) => {
  console.log("[AUTH] Register endpoint hit");

  try {
    const { username, password } = req.body;
    console.log("Incoming username:", username);

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters long.");
    }

    const trimmedUsername = username.trim().toLowerCase();
    console.log("Trimmed username:", trimmedUsername);

    if (!trimmedUsername) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const existingUser = await User.findOne({ username: trimmedUsername });
    console.log("Existing user found:", existingUser);

    if (existingUser) {
      return sendError(res, 409, "Username already exists.");
    }

    const user = await User.create({ username: trimmedUsername, password });

    return sendSuccess(res, 201, "User registered successfully.", {
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("[AUTH] Register error:", error.message);

    if (error.code === 11000) {
      return sendError(res, 409, "Username already exists.");
    }

    return next(error);
  }
};

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
