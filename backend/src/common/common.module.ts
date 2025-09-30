import { Module, Global } from '@nestjs/common';

/**
 * Common Module
 * Global module for shared utilities and services across the application
 * Currently minimal as shared types are now imported directly
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class CommonModule {}