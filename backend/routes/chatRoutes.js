import express from "express";
import {
  getChatById,
  getChats,
  sendMessage,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/", protect, getChats);
router.get("/:id", protect, getChatById);

export default router;
