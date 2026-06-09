/**
 * File Purpose:
 * Creates the MongoDB connection used by the Express API.
 */
import mongoose from "mongoose";

/**
 * Connects to MongoDB using the configured connection string
 * Throws when MONGO_URI is missing or the connection fails
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in the environment variables.");
  }

  const connection = await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

export default connectDB;
