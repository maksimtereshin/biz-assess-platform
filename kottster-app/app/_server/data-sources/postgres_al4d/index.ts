import { KnexPgAdapter } from "@kottster/server";
import knex from "knex";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * PostgreSQL connection configuration using environment variables.
 * All credentials are loaded securely from environment.
 * See .env.example for required configuration.
 *
 * Learn more at https://knexjs.org/guide/#configuration-options
 */
const client = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bizass_platform",
    // Enable SSL in production for security
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  },
  searchPath: ["public"],
});

export default new KnexPgAdapter(client);
