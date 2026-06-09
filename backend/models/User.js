/**
 * File Purpose:
 * Defines the user schema and secure password hashing behavior.
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";

/**
 * User Model Definition
 * Keeps usernames normalized, stores recovery email addresses, and enforces password requirements
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      // Allows legacy users without email to keep logging in while new accounts require unique email.
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    /**
     * Reset token stores a hashed, single-use password reset secret.
     * The raw token is only sent by email and is never stored directly.
     */
    resetPasswordToken: {
      type: String,
    },
    /**
     * Expiration timestamp limits reset links to a short 15-minute window.
     */
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Password Hashing Hook
 * Hashes new or modified passwords before saving the user document
 */
userSchema.pre("save", async function saveHook() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

/**
 * Compares a plain-text password against the stored hash
 * @param {string} enteredPassword - Password submitted during login
 * @returns {Promise<boolean>} Whether the submitted password matches the stored hash
 */
userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
