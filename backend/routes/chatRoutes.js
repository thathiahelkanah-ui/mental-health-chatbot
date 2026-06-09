/**
 * File Purpose:
 * Defines protected endpoints for AI chat and chat history management.
 */
import express from "express";
import {
  deleteChat,
  generateGreeting,
  getChatById,
  getChats,
  sendMessage,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/chat
 * Sends a message to the AI and returns the updated chat
 */
router.post("/", protect, sendMessage);

/**
 * GET /api/chat/greeting
 * Generates a friendly greeting for the authenticated user
 */
router.get("/greeting", protect, generateGreeting);

/**
 * GET /api/chat
 * Retrieves all saved chats for the authenticated user
 */
router.get("/", protect, getChats);

/**
 * DELETE /api/chat/:id
 * Deletes a saved chat owned by the authenticated user
 */
router.delete("/:id", protect, deleteChat);

/**
 * GET /api/chat/:id
 * Retrieves one saved chat owned by the authenticated user
 */
router.get("/:id", protect, getChatById);

export default router;
