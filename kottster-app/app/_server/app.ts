import { createApp, createIdentityProvider } from "@kottster/server";
import schema from "../../kottster-app.json";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/*
 * Security: All sensitive data is now loaded from environment variables.
 * See .env.example for required configuration.
 */
export const app = createApp({
  schema,
  secretKey: process.env.KOTTSTER_SECRET_KEY || "",
  kottsterApiToken: process.env.KOTTSTER_API_TOKEN || "",

  /*
   * The identity provider configuration.
   * See https://kottster.app/docs/app-configuration/identity-provider
   */
  identityProvider: createIdentityProvider("sqlite", {
    fileName: "app.db",

    passwordHashAlgorithm: "bcrypt",
    jwtSecretSalt: process.env.KOTTSTER_JWT_SALT || "",

    /* The root admin user credentials - MUST be set via environment variables */
    rootUsername: process.env.ROOT_USERNAME || "",
    rootPassword: process.env.ROOT_PASSWORD || "",
  }),
});
