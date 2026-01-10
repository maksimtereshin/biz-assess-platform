import { DataSource } from "typeorm";
import { config } from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as entities from "./entities";

// Load environment variables
config();

// Get migration files (excluding spec files)
const migrationsDir = path.join(__dirname, "migrations");
const migrationFiles = fs.existsSync(migrationsDir)
  ? fs
      .readdirSync(migrationsDir)
      .filter(
        (file) => file.endsWith(".ts") && !file.endsWith(".spec.ts") && !file.endsWith(".d.ts")
      )
      .map((file) => path.join(migrationsDir, file))
  : [];

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "bizass_platform",
  entities: Object.values(entities),
  migrations: migrationFiles,
  migrationsTableName: "migrations",
  synchronize: false, // Never use synchronize with migrations
  logging: true,
});
