import mongoose from "mongoose";
import env from "./env.js";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 3000;

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(
        `MongoDB not reachable (attempt ${attempt}/${MAX_ATTEMPTS}): ${reason} — retrying in ${RETRY_DELAY_MS / 1000}s`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
