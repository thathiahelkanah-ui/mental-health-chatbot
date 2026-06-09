/**
 * File Purpose:
 * Enables the React plugin for the frontend development and build pipeline.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
