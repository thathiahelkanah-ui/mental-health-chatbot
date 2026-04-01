import express from "express";
import {
  createChatReply,
  getChatById,
  getChats,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getChats);
router.get("/:id", protect, getChatById);
router.post("/", protect, createChatReply);

export default router;
