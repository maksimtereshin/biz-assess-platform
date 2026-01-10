import { Test, TestingModule } from "@nestjs/testing";
import { SurveyVersionService } from "../../survey/survey-version.service";
import { SurveyVersionStatus } from "../../entities/survey-version.entity";
import { createNewVersionAction } from "./create-new-version.action";
import { publishVersionAction } from "./publish-version.action";
import { unpublishVersionAction } from "./unpublish-version.action";

/**
 * Focused tests for Custom Actions (Group 3.2)
 * Tests critical functionality only:
 * - Create new version action
 * - Publish version action
 * - Unpublish version action
 */
describe("Custom Actions for SurveyVersion", () => {
  let surveyVersionService: Partial<SurveyVersionService>;

  beforeEach(() => {
    // Mock SurveyVersionService
    surveyVersionService = {
      createNewVersionFromExisting: jest.fn(),
      publishVersion: jest.fn(),
      unpublishVersion: jest.fn(),
    };
  });

  describe("createNewVersionAction", () => {
    it("should clone existing version into new draft", async () => {
      // Arrange
      const mockNewVersion = {
        id: 2,
        survey_id: 1,
        version: 2,
        name: "Test Survey",
        type: "EXPRESS",
        status: SurveyVersionStatus.DRAFT,
        structure: [],
        created_by_id: 1,
      };

      (surveyVersionService.createNewVersionFromExisting as jest.Mock).mockResolvedValue(
        mockNewVersion,
      );

      const mockContext: any = {
        record: {
          params: { id: 1 },
          toJSON: jest.fn().mockReturnValue({ id: 1 }),
        },
        currentAdmin: { id: 1, username: "admin" },
        _admin: {
          options: {
            env: {
              surveyVersionService,
            },
          },
        },
      };

      const mockRequest: any = {
        session: {
          adminUser: { id: 1, username: "admin" },
        },
      };

      // Act
      const result = await createNewVersionAction.handler(
        mockRequest,
        {} as any,
        mockContext,
      );

      // Assert
      expect(surveyVersionService.createNewVersionFromExisting).toHaveBeenCalledWith(1, 1);
      expect(result).toHaveProperty("redirectUrl");
      expect(result.redirectUrl).toContain(`/records/${mockNewVersion.id}/edit`);
      expect(result.notice.type).toBe("success");
    });

    it("should return error if SurveyVersionService not available", async () => {
      // Arrange
      const mockContext: any = {
        record: {
          params: { id: 1 },
          toJSON: jest.fn().mockReturnValue({ id: 1 }),
        },
        currentAdmin: { id: 1 },
        _admin: {
          options: {
            env: {},
          },
        },
      };

      const mockRequest: any = {
        session: {
          adminUser: { id: 1 },
        },
      };

      // Act
      const result = await createNewVersionAction.handler(
        mockRequest,
        {} as any,
        mockContext,
      );

      // Assert
      expect(result.notice.type).toBe("error");
      expect(result.notice.message).toContain("not available");
    });
  });

  describe("publishVersionAction", () => {
    it("should publish draft version successfully", async () => {
      // Arrange
      const mockPublishedVersion = {
        id: 1,
        survey_id: 1,
        version: 1,
        name: "Test Survey",
        type: "EXPRESS",
        status: SurveyVersionStatus.PUBLISHED,
        published_at: new Date(),
        structure: [],
        created_by_id: 1,
      };

      (surveyVersionService.publishVersion as jest.Mock).mockResolvedValue(
        mockPublishedVersion,
      );

      const mockContext: any = {
        record: {
          params: { id: 1, status: SurveyVersionStatus.DRAFT },
          toJSON: jest.fn().mockReturnValue({ id: 1, status: "DRAFT" }),
        },
        currentAdmin: { id: 1 },
        _admin: {
          options: {
            env: {
              surveyVersionService,
            },
          },
        },
      };

      // Act
      const result = await publishVersionAction.handler({} as any, {} as any, mockContext);

      // Assert
      expect(surveyVersionService.publishVersion).toHaveBeenCalledWith(1);
      expect(result.notice.type).toBe("success");
      expect(result.notice.message).toContain("опубликована");
    });

    it("should reject publishing non-DRAFT version", async () => {
      // Arrange
      const mockContext: any = {
        record: {
          params: { id: 1, status: SurveyVersionStatus.PUBLISHED },
          toJSON: jest.fn().mockReturnValue({ id: 1, status: "PUBLISHED" }),
        },
        currentAdmin: { id: 1 },
        _admin: {
          options: {
            env: {
              surveyVersionService,
            },
          },
        },
      };

      // Act
      const result = await publishVersionAction.handler({} as any, {} as any, mockContext);

      // Assert
      expect(surveyVersionService.publishVersion).not.toHaveBeenCalled();
      expect(result.notice.type).toBe("error");
      expect(result.notice.message).toContain("Невозможно опубликовать");
    });

    it("should only be visible for DRAFT versions", () => {
      // Arrange
      const draftContext: any = {
        record: {
          params: { status: SurveyVersionStatus.DRAFT },
        },
      };

      const publishedContext: any = {
        record: {
          params: { status: SurveyVersionStatus.PUBLISHED },
        },
      };

      // Act & Assert
      expect(publishVersionAction.isVisible(draftContext)).toBe(true);
      expect(publishVersionAction.isVisible(publishedContext)).toBe(false);
    });
  });

  describe("unpublishVersionAction", () => {
    it("should unpublish (archive) published version successfully", async () => {
      // Arrange
      const mockArchivedVersion = {
        id: 1,
        survey_id: 1,
        version: 1,
        name: "Test Survey",
        type: "EXPRESS",
        status: SurveyVersionStatus.ARCHIVED,
        structure: [],
        created_by_id: 1,
      };

      (surveyVersionService.unpublishVersion as jest.Mock).mockResolvedValue(
        mockArchivedVersion,
      );

      const mockContext: any = {
        record: {
          params: { id: 1, status: SurveyVersionStatus.PUBLISHED },
          toJSON: jest.fn().mockReturnValue({ id: 1, status: "PUBLISHED" }),
        },
        currentAdmin: { id: 1 },
        _admin: {
          options: {
            env: {
              surveyVersionService,
            },
          },
        },
      };

      // Act
      const result = await unpublishVersionAction.handler({} as any, {} as any, mockContext);

      // Assert
      expect(surveyVersionService.unpublishVersion).toHaveBeenCalledWith(1);
      expect(result.notice.type).toBe("success");
      expect(result.notice.message).toContain("снята с публикации");
      expect(result.notice.message).toContain("Активные сессии продолжат работать");
    });

    it("should reject unpublishing non-PUBLISHED version", async () => {
      // Arrange
      const mockContext: any = {
        record: {
          params: { id: 1, status: SurveyVersionStatus.DRAFT },
          toJSON: jest.fn().mockReturnValue({ id: 1, status: "DRAFT" }),
        },
        currentAdmin: { id: 1 },
        _admin: {
          options: {
            env: {
              surveyVersionService,
            },
          },
        },
      };

      // Act
      const result = await unpublishVersionAction.handler({} as any, {} as any, mockContext);

      // Assert
      expect(surveyVersionService.unpublishVersion).not.toHaveBeenCalled();
      expect(result.notice.type).toBe("error");
      expect(result.notice.message).toContain("Невозможно снять с публикации");
    });

    it("should only be visible for PUBLISHED versions", () => {
      // Arrange
      const publishedContext: any = {
        record: {
          params: { status: SurveyVersionStatus.PUBLISHED },
        },
      };

      const draftContext: any = {
        record: {
          params: { status: SurveyVersionStatus.DRAFT },
        },
      };

      // Act & Assert
      expect(unpublishVersionAction.isVisible(publishedContext)).toBe(true);
      expect(unpublishVersionAction.isVisible(draftContext)).toBe(false);
    });
  });
});
