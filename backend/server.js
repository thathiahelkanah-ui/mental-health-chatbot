import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const maskedApiKey = process.env.OPENAI_API_KEY
  ? `${process.env.OPENAI_API_KEY.slice(0, 7)}...${process.env.OPENAI_API_KEY.slice(-4)}`
  : "missing";

console.log("Loaded API Key:", maskedApiKey);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.use((err, req, res, next) => {
  console.error("[SERVER] Unhandled error:", err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong.",
  });
});

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
