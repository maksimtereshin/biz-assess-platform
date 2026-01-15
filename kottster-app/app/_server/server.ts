import { app } from "./app";
import { registry } from "./registry";

async function bootstrap() {
  // Load data sources into the app
  app.loadFromDataSourceRegistry(registry);

  // Initialize identity provider
  await app.initialize();

  // Kottster listens on all interfaces by default
  await app.listen();

  console.log(`Server running on port ${process.env.PORT || 5480}`);
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
