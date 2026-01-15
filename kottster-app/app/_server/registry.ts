import { DataSourceRegistry } from "@kottster/server";
import postgres_al4d from "./data-sources/postgres_al4d";

/**
 * Data source registry for the application.
 * Registers all available data sources for use in Kottster.
 */
export const registry = new DataSourceRegistry({
  postgres_al4d,
});
