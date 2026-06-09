/**
 * File Purpose:
 * Defines chat and message schemas for persisted conversation history.
 */
import mongoose from "mongoose";

/**
 * Chat Schema
 * Stores chat sessions and conversation history for each user.
 */
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "bot"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
    },
    sentiment: {
      type: String,
    },
    emotion: {
      type: String,
    },
  },
  {
    _id: false,
  }
);

/**
 * Chat Model Definition
 * Links a chat thread to a user and preserves its message history
 */
const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
