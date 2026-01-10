import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SurveyVersionService } from "./survey-version.service";
import { ValidatorService } from "./validator.service";
import { SurveyVersion, SurveyVersionStatus } from "../entities/survey-version.entity";
import { Survey } from "../entities/survey.entity";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { SurveyCategory } from "bizass-shared";

describe("SurveyVersionService", () => {
  let service: SurveyVersionService;
  let versionRepository: Repository<SurveyVersion>;
  let surveyRepository: Repository<Survey>;
  let validatorService: ValidatorService;

  const mockSurvey: Partial<Survey> = {
    id: 1,
    type: "EXPRESS",
    name: "Express Survey",
  };

  const mockStructure: SurveyCategory[] = [
    {
      id: "cat1",
      name: "Category 1",
      subcategories: [
        {
          id: "sub1",
          name: "Subcategory 1",
          questions: [
            {
              id: 1,
              text: "Question 1",
              answers: [
                { id: 1, text: "Answer 1", value: 5, color: "#000", range: "1-10" },
              ],
            },
          ],
        },
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyVersionService,
        ValidatorService,
        {
          provide: getRepositoryToken(SurveyVersion),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Survey),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SurveyVersionService>(SurveyVersionService);
    validatorService = module.get<ValidatorService>(ValidatorService);
    versionRepository = module.get<Repository<SurveyVersion>>(
      getRepositoryToken(SurveyVersion),
    );
    surveyRepository = module.get<Repository<Survey>>(
      getRepositoryToken(Survey),
    );
  });

  describe("createDraftVersion", () => {
    it("should create a new draft version with auto-incremented version number", async () => {
      // Arrange
      const surveyId = 1;
      const name = "Test Survey";
      const type = "EXPRESS";
      const createdById = 1;

      jest.spyOn(surveyRepository, "findOne").mockResolvedValue(mockSurvey as Survey);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ version: 1 }),
      };
      jest
        .spyOn(versionRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      const mockVersion: Partial<SurveyVersion> = {
        id: 1,
        survey_id: surveyId,
        version: 2,
        name,
        type,
        structure: mockStructure,
        status: SurveyVersionStatus.DRAFT,
        created_by_id: createdById,
      };
      jest.spyOn(versionRepository, "create").mockReturnValue(mockVersion as SurveyVersion);
      jest.spyOn(versionRepository, "save").mockResolvedValue(mockVersion as SurveyVersion);

      // Act
      const result = await service.createDraftVersion(
        surveyId,
        name,
        type,
        mockStructure,
        createdById,
      );

      // Assert
      expect(result.version).toBe(2);
      expect(result.status).toBe(SurveyVersionStatus.DRAFT);
      expect(versionRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if survey does not exist", async () => {
      // Arrange
      jest.spyOn(surveyRepository, "findOne").mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createDraftVersion(999, "Test", "EXPRESS", mockStructure, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("publishVersion", () => {
    it("should publish a draft version and update Survey.latest_published_version_id", async () => {
      // Arrange
      const versionId = 1;
      const mockDraftVersion: Partial<SurveyVersion> = {
        id: versionId,
        survey_id: 1,
        version: 2,
        status: SurveyVersionStatus.DRAFT,
        structure: mockStructure,
      };

      jest
        .spyOn(versionRepository, "findOne")
        .mockResolvedValue(mockDraftVersion as SurveyVersion);

      const mockPublishedVersion: Partial<SurveyVersion> = {
        ...mockDraftVersion,
        status: SurveyVersionStatus.PUBLISHED,
        published_at: new Date(),
      };
      jest
        .spyOn(versionRepository, "save")
        .mockResolvedValue(mockPublishedVersion as SurveyVersion);

      jest.spyOn(surveyRepository, "update").mockResolvedValue(undefined);

      // Act
      const result = await service.publishVersion(versionId);

      // Assert
      expect(result.status).toBe(SurveyVersionStatus.PUBLISHED);
      expect(result.published_at).toBeDefined();
      expect(surveyRepository.update).toHaveBeenCalledWith(
        { id: mockDraftVersion.survey_id },
        { latest_published_version_id: versionId },
      );
    });

    it("should throw BadRequestException if version is not in DRAFT status", async () => {
      // Arrange
      const mockPublishedVersion: Partial<SurveyVersion> = {
        id: 1,
        status: SurveyVersionStatus.PUBLISHED,
      };

      jest
        .spyOn(versionRepository, "findOne")
        .mockResolvedValue(mockPublishedVersion as SurveyVersion);

      // Act & Assert
      await expect(service.publishVersion(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe("getLatestVersion", () => {
    it("should return the latest published version for a survey", async () => {
      // Arrange
      const surveyId = 1;
      const mockLatestVersion: Partial<SurveyVersion> = {
        id: 3,
        survey_id: surveyId,
        version: 3,
        status: SurveyVersionStatus.PUBLISHED,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLatestVersion),
      };
      jest
        .spyOn(versionRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.getLatestVersion(surveyId, SurveyVersionStatus.PUBLISHED);

      // Assert
      expect(result).toEqual(mockLatestVersion);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("version.status = :status", {
        status: SurveyVersionStatus.PUBLISHED,
      });
    });
  });

  describe("validateStructure", () => {
    it("should throw BadRequestException for duplicate category IDs", async () => {
      // Arrange
      const invalidStructure: SurveyCategory[] = [
        {
          id: "cat1",
          name: "Category 1",
          subcategories: [
            {
              id: "sub1",
              name: "Subcategory 1",
              questions: [{ id: 1, text: "Q1" }],
            },
          ],
        },
        {
          id: "cat1", // Duplicate ID
          name: "Category 2",
          subcategories: [
            {
              id: "sub2",
              name: "Subcategory 2",
              questions: [{ id: 2, text: "Q2" }],
            },
          ],
        },
      ];

      jest.spyOn(surveyRepository, "findOne").mockResolvedValue(mockSurvey as Survey);

      // Act & Assert
      await expect(
        service.createDraftVersion(1, "Test", "EXPRESS", invalidStructure, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for duplicate question IDs", async () => {
      // Arrange
      const invalidStructure: SurveyCategory[] = [
        {
          id: "cat1",
          name: "Category 1",
          subcategories: [
            {
              id: "sub1",
              name: "Subcategory 1",
              questions: [
                { id: 1, text: "Q1" },
                { id: 1, text: "Q2" }, // Duplicate question ID
              ],
            },
          ],
        },
      ];

      jest.spyOn(surveyRepository, "findOne").mockResolvedValue(mockSurvey as Survey);

      // Act & Assert
      await expect(
        service.createDraftVersion(1, "Test", "EXPRESS", invalidStructure, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("createNewVersionFromExisting", () => {
    it("should clone an existing version into a new draft", async () => {
      // Arrange
      const existingVersionId = 1;
      const createdById = 2;

      const mockExistingVersion: Partial<SurveyVersion> = {
        id: existingVersionId,
        survey_id: 1,
        version: 1,
        name: "Existing Survey",
        type: "EXPRESS",
        structure: mockStructure,
        status: SurveyVersionStatus.PUBLISHED,
      };

      jest
        .spyOn(versionRepository, "findOne")
        .mockResolvedValue(mockExistingVersion as SurveyVersion);
      jest.spyOn(surveyRepository, "findOne").mockResolvedValue(mockSurvey as Survey);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ version: 1 }),
      };
      jest
        .spyOn(versionRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      const mockNewVersion: Partial<SurveyVersion> = {
        id: 2,
        survey_id: 1,
        version: 2,
        name: "Existing Survey",
        type: "EXPRESS",
        structure: mockStructure,
        status: SurveyVersionStatus.DRAFT,
        created_by_id: createdById,
      };
      jest.spyOn(versionRepository, "create").mockReturnValue(mockNewVersion as SurveyVersion);
      jest.spyOn(versionRepository, "save").mockResolvedValue(mockNewVersion as SurveyVersion);

      // Act
      const result = await service.createNewVersionFromExisting(existingVersionId, createdById);

      // Assert
      expect(result.version).toBe(2);
      expect(result.status).toBe(SurveyVersionStatus.DRAFT);
      expect(result.name).toBe(mockExistingVersion.name);
      expect(result.created_by_id).toBe(createdById);
    });
  });

  describe("unpublishVersion", () => {
    it("should change status from PUBLISHED to ARCHIVED", async () => {
      // Arrange
      const versionId = 1;
      const mockPublishedVersion: Partial<SurveyVersion> = {
        id: versionId,
        status: SurveyVersionStatus.PUBLISHED,
      };

      jest
        .spyOn(versionRepository, "findOne")
        .mockResolvedValue(mockPublishedVersion as SurveyVersion);

      const mockArchivedVersion: Partial<SurveyVersion> = {
        ...mockPublishedVersion,
        status: SurveyVersionStatus.ARCHIVED,
      };
      jest
        .spyOn(versionRepository, "save")
        .mockResolvedValue(mockArchivedVersion as SurveyVersion);

      // Act
      const result = await service.unpublishVersion(versionId);

      // Assert
      expect(result.status).toBe(SurveyVersionStatus.ARCHIVED);
    });
  });
});
