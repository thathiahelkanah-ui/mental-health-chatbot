import OpenAI from "openai";
import Chat from "../models/Chat.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    console.log("Incoming message:", message);

    let reply;

    try {
      console.log("Calling OpenAI...");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a calm, supportive mental health assistant.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      });

      console.log("OpenAI success");

      reply = completion.choices[0].message.content;
    } catch (err) {
      console.error("OpenAI error FULL:", err);

      reply = "Hi, I'm here to listen. What's on your mind?";
    }

    let chat;

    if (!req.body.chatId) {
      chat = new Chat({
        user: req.user._id,
        title: message.substring(0, 25),
        messages: [],
      });
    } else {
      chat = await Chat.findOne({
        _id: req.body.chatId,
        user: req.user._id,
      });
    }

    if (!chat) {
      return sendError(res, 404, "Chat not found.");
    }

    chat.messages.push(
      { role: "user", text: message },
      { role: "bot", text: reply }
    );

    await chat.save();

    return res.json({
      chatId: chat._id,
      messages: chat.messages,
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.json({
      messages: [
        { role: "bot", text: "Something went wrong." },
      ],
    });
  }
};

export const generateGreeting = async (req, res) => {
  try {
    const username = req.user?.username || "there";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a warm, friendly mental health assistant.",
        },
        {
          role: "user",
          content: `Generate a short, welcoming message for a user named ${username}. Be friendly, supportive, and natural.`,
        },
      ],
    });

    const greeting = completion.choices[0].message.content;

    return res.json({ greeting });
  } catch (error) {
    console.error("Greeting error:", error);

    return res.json({
      greeting: `Hi ${req.user?.username || "there"}! I'm here for you. What's on your mind today?`,
    });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    return res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Delete chat error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select("title messages createdAt updatedAt");

    return res.status(200).json(chats);
  } catch (error) {
    console.error("[CHAT] Get chats error:", error.message);
    return next(error);
  }
};

export const getChatById = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!chat) {
      return sendError(res, 404, "Chat not found.");
    }

    return res.status(200).json({
      chatId: chat._id,
      title: chat.title,
      messages: chat.messages,
    });
  } catch (error) {
    console.error("[CHAT] Get chat by id error:", error.message);
    return next(error);
  }
};
