import { DataSource } from "typeorm";
import { config } from "dotenv";
import * as entities from "./entities";

// Load environment variables
config();

// Filter out non-entity exports (enums, types, etc)
const entityClasses = Object.values(entities).filter(
  (exported) => typeof exported === "function",
);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "bizass_platform",
  entities: entityClasses,
  // Use glob pattern for migrations - works in both dev (.ts) and production (.js)
  // Excludes .spec.ts, .spec.js, and .d.ts files
  migrations: [__dirname + "/migrations/*[0-9]*{.ts,.js}"],
  migrationsTableName: "migrations",
  synchronize: false, // Never use synchronize with migrations
  logging: true,
});
