import { createDataSource, KnexPgAdapter } from "@kottster/server";
import knex from "knex";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * PostgreSQL data source configuration using environment variables.
 * All credentials are loaded securely from environment.
 * See .env.example for required configuration.
 *
 * Learn more at https://kottster.app/docs/data-sources
 */
export default createDataSource({
  type: "postgres" as any,
  name: "postgres_al4d",
  databaseSchemas: ["public"],
  tablesConfig: {},
  init: () => {
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

    return new KnexPgAdapter(client);
  },
});
