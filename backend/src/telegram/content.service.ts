import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BotContent } from "../entities/bot-content.entity";
import { CONTENT_FALLBACKS } from "./telegram.constants";

/**
 * ContentService for database-driven bot content management
 * Implements in-memory caching with fallback to hardcoded defaults
 * Loads all content on service initialization for performance
 */
@Injectable()
export class ContentService implements OnModuleInit {
  private readonly logger = new Logger(ContentService.name);
  private contentCache: Map<string, string> = new Map();

  constructor(
    @InjectRepository(BotContent)
    private botContentRepository: Repository<BotContent>,
  ) {}

  /**
   * Lifecycle hook: Load all content into cache on module initialization
   * Implements graceful degradation if database unavailable
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log("Loading bot content from database...");
      const allContent = await this.botContentRepository.find();

      // Populate cache
      allContent.forEach((content) => {
        this.contentCache.set(content.content_key, content.content_value);
      });

      this.logger.log(
        `Successfully loaded ${allContent.length} content entries into cache`,
      );
    } catch (error) {
      this.logger.error(
        "Failed to load content from database, using fallbacks",
        error,
      );
      // Graceful degradation: service continues with fallback constants
    }
  }

  /**
   * Get content from cache (synchronous)
   * Falls back to CONTENT_FALLBACKS if key not in cache
   * Use this method in request handlers for best performance
   */
  getCachedContent(key: string): string {
    const cached = this.contentCache.get(key);
    if (cached) {
      return cached;
    }

    // Fallback to hardcoded constant
    const fallback = CONTENT_FALLBACKS[key];
    if (fallback) {
      this.logger.warn(
        `Content key "${key}" not in cache, using fallback value`,
      );
      return fallback;
    }

    // Ultimate fallback: return key itself for debugging
    this.logger.error(`Content key "${key}" not found in cache or fallbacks`);
    return key;
  }

  /**
   * Get content from cache (asynchronous method for consistency)
   * Returns cached value without database query
   */
  async getContent(key: string): Promise<string> {
    return this.getCachedContent(key);
  }
}
