import { app } from "./app";

async function bootstrap() {
  // Kottster listens on all interfaces by default
  await app.listen();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
