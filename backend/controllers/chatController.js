import OpenAI from "openai";
import Chat from "../models/Chat.js";

const SYSTEM_PROMPT = `
You are a supportive mental health assistant.
Your tone must always be calm, empathetic, and non-judgmental.
Keep responses short, practical, and helpful.
Do not provide medical diagnoses, emergency assessments, or claim to be a licensed professional.
If the user expresses severe distress, self-harm, suicidal thoughts, or danger, gently encourage them to contact local emergency services, a crisis hotline, or a licensed mental health professional immediately and to reach out to a trusted person nearby.
When appropriate, suggest grounding techniques, reflection, journaling, breathing, or seeking support.
`;

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const buildChatTitle = (message) => message.slice(0, 30).trim();

export const sendMessage = async (req, res, next) => {
  console.log("[CHAT] Chat endpoint hit");

  try {
    if (!req.user) {
      console.warn("[CHAT] Request reached controller without authenticated user");
      return sendError(res, 401, "Not authorized. Please log in and provide a valid token.");
    }

    console.log("Incoming body:", req.body);

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const { chatId, message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("[CHAT] OPENAI_API_KEY is missing or empty");
      return sendError(res, 500, "OPENAI_API_KEY is not configured.");
    }

    const userMessage = message.trim();
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    const openai = new OpenAI({
      apiKey,
    });

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const aiResponse = completion.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      return sendError(res, 502, "OpenAI returned an empty response.");
    }

    console.log("[CHAT] Response generated for user:", req.user.username);

    let chat = null;

    if (chatId) {
      chat = await Chat.findOne({
        _id: chatId,
        user: req.user._id,
      });

      if (!chat) {
        return sendError(res, 404, "Chat not found.");
      }
    } else {
      chat = new Chat({
        user: req.user._id,
        title: buildChatTitle(userMessage),
        messages: [],
      });
    }

    if (!chat.title) {
      chat.title = buildChatTitle(userMessage);
    }

    chat.messages.push({
      role: "user",
      text: userMessage,
    });

    chat.messages.push({
      role: "bot",
      text: aiResponse,
    });

    await chat.save();

    return res.status(200).json({
      success: true,
      data: {
        chatId: chat._id,
        messages: chat.messages,
      },
    });
  } catch (error) {
    console.error("[CHAT] OpenAI chat error:", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      name: error.name,
      response: error.response?.data || null,
    });

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.status === 401
          ? "OpenAI authentication failed. Check OPENAI_API_KEY."
          : "OpenAI request failed.",
        error: error.message,
      });
    }

    return next(error);
  }
};

export const getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select("title messages createdAt updatedAt");

    return res.status(200).json({
      success: true,
      data: chats,
    });
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
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("[CHAT] Get chat by id error:", error.message);
    return next(error);
  }
};
