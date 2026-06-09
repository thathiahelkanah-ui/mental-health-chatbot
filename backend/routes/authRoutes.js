/**
 * File Purpose:
 * Defines public authentication endpoints for account creation and login.
 */
import express from "express";
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Creates a new user account with username, email, and password
 * Email is collected for account recovery, but username remains the login identifier
 */
router.post("/register", registerUser);

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT
 */
router.post("/login", loginUser);

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email when the submitted username belongs to an account
 */
router.post("/forgot-password", forgotPassword);

/**
 * POST /api/auth/reset-password/:token
 * Resets a password with a valid single-use reset token
 */
router.post("/reset-password/:token", resetPassword);

export default router;
