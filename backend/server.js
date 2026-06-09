/**
 * File Purpose:
 * Configures the Express server, middleware, API routes, database startup, and global errors.
 */
import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

/**
 * Masks the OpenAI key for startup diagnostics
 * Returns a safe display value without exposing the full secret
 */
const maskedApiKey = process.env.OPENAI_API_KEY
  ? `${process.env.OPENAI_API_KEY.slice(0, 7)}...${process.env.OPENAI_API_KEY.slice(-4)}`
  : "missing";

console.log("Loaded API Key:", maskedApiKey);

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Global Middleware
 * Enables cross-origin requests and parses JSON request bodies
 */
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

/**
 * GET /
 * Confirms that the API server is running
 */
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

/**
 * API Routes
 * Mounts authentication and chat endpoints under versioned feature paths
 */
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

/**
 * Global Error Handler
 * Sends consistent JSON responses for unhandled route and controller errors
 */
app.use((err, req, res, next) => {
  console.error("[SERVER] Unhandled error:", err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong.",
  });
});

/**
 * Starts the Express server
 * Connects to MongoDB before accepting incoming API requests
 */
const startServer = async () => {
  try {
    await connectDB(); 

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
