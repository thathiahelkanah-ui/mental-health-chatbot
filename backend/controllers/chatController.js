/**
 * File Purpose:
 * Handles OpenAI interactions, sentiment analysis, and authenticated chat history operations.
 */
import OpenAI from "openai";
import Sentiment from "sentiment";
import Chat from "../models/Chat.js";

/**
 * OpenAI Client
 * Uses the server-side API key to keep requests off the browser
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Sentiment Analyzer
 * Scores user messages so the assistant can adapt tone before responding
 */
const sentiment = new Sentiment();

/**
 * Sends a standardized error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code for the error
 * @param {string} message - Human-readable error message
 * @returns {object} Express JSON response
 */
const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Detects emotional state from a user message.
 * Supports anxious, sad, angry, happy, and neutral categories for response personalization.
 * @param {string} text
 * @returns {string}
 */
function detectEmotion(text) {
  const message = text.toLowerCase();

  if (
    message.includes("stress") ||
    message.includes("stressed") ||
    message.includes("anxiety") ||
    message.includes("anxious") ||
    message.includes("worried")
  ) {
    return "anxious";
  }

  if (
    message.includes("sad") ||
    message.includes("depressed") ||
    message.includes("lonely")
  ) {
    return "sad";
  }

  if (
    message.includes("angry") ||
    message.includes("frustrated") ||
    message.includes("upset")
  ) {
    return "angry";
  }

  if (
    message.includes("happy") ||
    message.includes("great") ||
    message.includes("excited")
  ) {
    return "happy";
  }

  return "neutral";
}

/**
 * Converts a sentiment score into a readable label.
 * @param {number} score - Numeric score returned by the sentiment analyzer
 * @returns {string} positive, negative, or neutral sentiment label
 */
function getSentimentLabel(score) {
  if (score >= 3) {
    return "positive";
  }

  if (score <= -3) {
    return "negative";
  }

  return "neutral";
}

/**
 * Handles AI chat requests.
 * Processes user messages, analyzes mood, and stores chat history.
 */
export const sendMessage = async (req, res) => {
  try {
    const { message: userMessage } = req.body;

    console.log("Incoming message:", userMessage);

    let reply;
    let chat;

    /**
     * Chat Persistence
     * Starts a new thread when no chatId is provided, otherwise loads the user's existing chat.
     */
    if (!req.body.chatId) {
      chat = new Chat({
        user: req.user._id,
        title: userMessage.substring(0, 25),
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

    /**
     * Sentiment Analysis
     * The sentiment package scores message tone; scores >= 3 are positive and <= -3 are negative.
     */
    const sentimentResult = sentiment.analyze(userMessage);
    const sentimentLabel = getSentimentLabel(sentimentResult.score);

    /**
     * Emotion Detection
     * Keyword-based categories help Chat Buddy personalize tone for common emotional states.
     */
    const emotion = detectEmotion(userMessage);

    /**
     * Conversation Memory
     * Only the last 10 messages are included to preserve context without excessive token usage.
     */
    const conversationHistory = chat.messages
      .slice(-10)
      .map((msg) => `${msg.role}: ${msg.text}`)
      .join("\n");

    /**
     * Mood Trend Detection
     * Reviews the latest user messages, including the current message, to notice repeated negative sentiment.
     */
    const recentUserMessages = [
      ...chat.messages.filter((msg) => msg.role === "user").slice(-4),
      { text: userMessage, sentiment: sentimentLabel },
    ];
    const negativeMessageCount = recentUserMessages.filter((msg) => {
      const label = msg.sentiment || getSentimentLabel(sentiment.analyze(msg.text).score);
      return label === "negative";
    }).length;
    const moodTrendContext = negativeMessageCount >= 4
      ? "The user has shown repeated negative sentiment recently.\nRespond with additional empathy."
      : "";

    try {
      console.log("Calling OpenAI...");

      /**
       * Prompt Engineering
       * Supplies emotional context, recent conversation memory, and the current message so responses feel specific.
       */
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Chat Buddy, an empathetic mental wellness companion.

Your responsibilities:

* Understand emotional state.
* Use conversation history.
* Avoid generic responses.
* Avoid repetitive wording.
* Show empathy.
* Ask meaningful follow-up questions.
* Encourage reflection.
* Celebrate positive progress.
* Never sound robotic.
* Adapt tone based on sentiment and emotion.

Current sentiment:
${sentimentLabel}

Detected emotion:
${emotion}

Conversation history:
${conversationHistory}

Current user message:
${userMessage}

${moodTrendContext}

Generate a personalized response.`,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      console.log("OpenAI success");

      reply = completion.choices[0].message.content;
    } catch (err) {
      console.error("OpenAI error FULL:", err);

      reply = "Hi, I'm here to listen. What's on your mind?";
    }

    chat.messages.push(
      {
        role: "user",
        text: userMessage,
        sentiment: sentimentLabel,
        emotion,
        createdAt: new Date(),
      },
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

/**
 * Generates a personalized greeting for the current user
 * Falls back to a local greeting when the AI request fails
 */
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

/**
 * Deletes a chat owned by the authenticated user
 * Uses both chat id and user id to avoid deleting another user's chat
 */
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

/**
 * Gets all chats for the authenticated user
 * Returns recent chats first with only the fields needed by the client
 */
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

/**
 * Gets one chat by id for the authenticated user
 * Returns chat metadata and message history when the chat exists
 */
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
