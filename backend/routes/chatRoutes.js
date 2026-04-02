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

router.post("/", protect, sendMessage);
router.get("/greeting", protect, generateGreeting);
router.get("/", protect, getChats);
router.delete("/:id", protect, deleteChat);
router.get("/:id", protect, getChatById);

export default router;
