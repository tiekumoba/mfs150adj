import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closePool } from "./db/pool.js";

const server = createApp().listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  if (!env.DATABASE_URL) console.warn("DATABASE_URL not set: database-backed routes will fail");
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    void closePool().finally(() => process.exit(0));
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
