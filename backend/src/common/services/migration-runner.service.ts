import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service to run SQL migrations on application startup
 * Tracks applied migrations in a dedicated table
 */
@Injectable()
export class MigrationRunnerService implements OnModuleInit {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit() {
    // Only run migrations in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.RUN_MIGRATIONS === 'true') {
      await this.runMigrations();
    }
  }

  private async runMigrations() {
    try {
      this.logger.log('Starting SQL migrations...');

      // Create migrations tracking table if it doesn't exist
      await this.createMigrationsTable();

      const migrationsDir = path.join(__dirname, '../../../migrations');

      // Check if migrations directory exists
      if (!fs.existsSync(migrationsDir)) {
        this.logger.warn(`Migrations directory not found: ${migrationsDir}`);
        return;
      }

      // Get all SQL files
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure order

      if (files.length === 0) {
        this.logger.log('No SQL migrations found');
        return;
      }

      // Run each migration
      for (const file of files) {
        // Check if migration was already applied
        const isApplied = await this.isMigrationApplied(file);

        if (isApplied) {
          this.logger.log(`⚠ Migration ${file} already applied (skipped)`);
          continue;
        }

        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        this.logger.log(`Running migration: ${file}`);

        try {
          await this.dataSource.query(sql);
          await this.markMigrationAsApplied(file);
          this.logger.log(`✓ Migration ${file} completed successfully`);
        } catch (error) {
          this.logger.error(`✗ Migration ${file} failed:`, error.message);
          throw error;
        }
      }

      this.logger.log('All migrations completed successfully');
    } catch (error) {
      this.logger.error('Error running migrations:', error);
      // Don't throw - allow app to start even if migrations fail
      // This prevents deployment failures
    }
  }

  private async createMigrationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS _sql_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await this.dataSource.query(sql);
  }

  private async isMigrationApplied(name: string): Promise<boolean> {
    const result = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM _sql_migrations WHERE name = $1',
      [name]
    );
    return parseInt(result[0].count) > 0;
  }

  private async markMigrationAsApplied(name: string): Promise<void> {
    await this.dataSource.query(
      'INSERT INTO _sql_migrations (name) VALUES ($1)',
      [name]
    );
  }
}
