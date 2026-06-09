/**
 * File Purpose:
 * Verifies JWT bearer tokens and attaches the authenticated user to protected requests.
 */
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protects routes that require authentication
 * Validates the bearer token and loads the matching user without the password field
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("[AUTH] Authorization header received:", authHeader || "none");

    if (!authHeader) {
      console.warn("[AUTH] Token missing from Authorization header");
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token is missing.",
      });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      console.warn("[AUTH] Invalid Authorization header format");
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token must use Bearer format.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in the environment variables.");
    }

    const decoded = jwt.verify(token, jwtSecret);
    console.log("[AUTH] Token verified for userId:", decoded.userId);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.warn("[AUTH] Authenticated token user no longer exists");
      return res.status(401).json({
        success: false,
        message: "Not authorized. User not found.",
      });
    }

    req.user = user;
    console.log("[AUTH] User authenticated:", user.username);
    return next();
  } catch (error) {
    console.error("[AUTH] JWT middleware error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid token.",
    });
  }
};
