import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContentService } from "./content.service";
import { BotContent } from "../entities/bot-content.entity";

/**
 * Focused tests for ContentService
 * Tests critical behaviors: content retrieval, caching, fallback defaults
 * Scope: 6 tests (as per spec requirements)
 */
describe("ContentService", () => {
  let service: ContentService;
  let repository: Repository<BotContent>;

  const mockRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: getRepositoryToken(BotContent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    repository = module.get<Repository<BotContent>>(
      getRepositoryToken(BotContent),
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  /**
   * Test 1: Service initialization loads content into cache
   * Critical: Verifies onModuleInit lifecycle hook loads content
   */
  it("should load all content into cache on initialization", async () => {
    const mockContent = [
      {
        id: 1,
        content_key: "welcome_message",
        content_value: "Добро пожаловать!",
        content_type: "message",
        language: "ru",
      },
      {
        id: 2,
        content_key: "main_button_checkup",
        content_value: "🔍 Чекап",
        content_type: "button_text",
        language: "ru",
      },
    ];

    mockRepository.find.mockResolvedValue(mockContent);

    await service.onModuleInit();

    expect(mockRepository.find).toHaveBeenCalledTimes(1);
    expect(service.getCachedContent("welcome_message")).toBe(
      "Добро пожаловать!",
    );
    expect(service.getCachedContent("main_button_checkup")).toBe("🔍 Чекап");
  });

  /**
   * Test 2: getCachedContent returns cached value
   * Critical: Verifies in-memory cache works without DB queries
   */
  it("should return cached content without DB query", async () => {
    const mockContent = [
      {
        id: 1,
        content_key: "wip_message",
        content_value: "Функция в разработке",
        content_type: "message",
        language: "ru",
      },
    ];

    mockRepository.find.mockResolvedValue(mockContent);
    await service.onModuleInit();

    // Clear mock to verify no new DB calls
    mockRepository.find.mockClear();

    const result = service.getCachedContent("wip_message");

    expect(result).toBe("Функция в разработке");
    expect(mockRepository.find).not.toHaveBeenCalled();
  });

  /**
   * Test 3: getCachedContent falls back to CONTENT_FALLBACKS
   * Critical: Verifies fallback mechanism when content not in cache
   */
  it("should return fallback value when content key not in cache", async () => {
    mockRepository.find.mockResolvedValue([]);
    await service.onModuleInit();

    const result = service.getCachedContent("welcome_message");

    // Should return fallback from CONTENT_FALLBACKS constant
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  /**
   * Test 4: getContent retrieves from database
   * Critical: Verifies async database retrieval method
   */
  it("should retrieve content from database via getContent", async () => {
    const mockContent = [
      {
        id: 1,
        content_key: "test_key",
        content_value: "test_value",
        content_type: "message",
        language: "ru",
      },
    ];

    mockRepository.find.mockResolvedValue(mockContent);
    await service.onModuleInit();

    const result = await service.getContent("test_key");

    expect(result).toBe("test_value");
  });

  /**
   * Test 5: Service handles database failure gracefully
   * Critical: Verifies error handling and fallback when DB unavailable
   */
  it("should handle database failure and use fallbacks", async () => {
    mockRepository.find.mockRejectedValue(new Error("Database unavailable"));

    // Should not throw, but log error and use fallbacks
    await service.onModuleInit();

    const result = service.getCachedContent("welcome_message");

    // Should return fallback value
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  /**
   * Test 6: Multiple calls to getCachedContent return same value
   * Critical: Verifies cache consistency
   */
  it("should return consistent cached values across multiple calls", async () => {
    const mockContent = [
      {
        id: 1,
        content_key: "main_button_admin",
        content_value: "🔧 Админ панель",
        content_type: "button_text",
        language: "ru",
      },
    ];

    mockRepository.find.mockResolvedValue(mockContent);
    await service.onModuleInit();

    const result1 = service.getCachedContent("main_button_admin");
    const result2 = service.getCachedContent("main_button_admin");
    const result3 = service.getCachedContent("main_button_admin");

    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
    expect(result1).toBe("🔧 Админ панель");
  });
});
