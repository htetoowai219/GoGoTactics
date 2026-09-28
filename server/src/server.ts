import app from "./app.js";
import env, { allowedOrigins } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const server = app.listen(env.PORT, env.HOST, () => {
    console.log(
      `GoGoTactics API running on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`,
    );
    console.log(`Allowed client origins: ${allowedOrigins.join(", ")}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
