import { Module, Global } from '@nestjs/common';
import { QueryCacheService } from './services/query-cache.service';

/**
 * Common Module
 * Global module for shared utilities and services across the application
 * Includes QueryCacheService for performance optimization
 */
@Global()
@Module({
  providers: [QueryCacheService],
  exports: [QueryCacheService],
})
export class CommonModule {}
