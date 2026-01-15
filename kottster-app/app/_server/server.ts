import { app } from "./app";

async function bootstrap() {
  // Kottster listens on all interfaces by default
  // Data sources are automatically loaded from data-sources/ directory
  await app.listen();
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
