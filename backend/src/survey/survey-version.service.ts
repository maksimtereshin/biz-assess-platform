import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SurveyVersion, SurveyVersionStatus } from "../entities/survey-version.entity";
import { Survey } from "../entities/survey.entity";
import { SurveyCategory } from "bizass-shared";
import { ValidatorService } from "./validator.service";

@Injectable()
export class SurveyVersionService {
  constructor(
    @InjectRepository(SurveyVersion)
    private versionRepository: Repository<SurveyVersion>,
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    private validatorService: ValidatorService,
  ) {}

  /**
   * Creates a new draft version for a survey
   * Auto-increments version number based on existing versions
   */
  async createDraftVersion(
    surveyId: number,
    name: string,
    type: string,
    structure: SurveyCategory[],
    createdById: number,
  ): Promise<SurveyVersion> {
    // Validate survey exists
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
    });
    if (!survey) {
      throw new NotFoundException(`Survey ${surveyId} not found`);
    }

    // Validate structure before saving (delegated to ValidatorService)
    this.validatorService.validateSurveyStructure(structure);

    // Get next version number
    const latestVersion = await this.versionRepository
      .createQueryBuilder("version")
      .where("version.survey_id = :surveyId", { surveyId })
      .orderBy("version.version", "DESC")
      .getOne();

    const nextVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // Create new draft version
    const version = this.versionRepository.create({
      survey_id: surveyId,
      version: nextVersionNumber,
      name,
      type: type.toUpperCase(),
      structure,
      status: SurveyVersionStatus.DRAFT,
      created_by_id: createdById,
    });

    return await this.versionRepository.save(version);
  }

  /**
   * Creates a new draft version by cloning an existing version
   * Used when editing a published version - creates draft with version++
   */
  async createNewVersionFromExisting(
    existingVersionId: number,
    createdById: number,
  ): Promise<SurveyVersion> {
    // Get existing version
    const existingVersion = await this.versionRepository.findOne({
      where: { id: existingVersionId },
    });
    if (!existingVersion) {
      throw new NotFoundException(`Version ${existingVersionId} not found`);
    }

    // Create new draft by cloning
    return await this.createDraftVersion(
      existingVersion.survey_id,
      existingVersion.name,
      existingVersion.type,
      existingVersion.structure,
      createdById,
    );
  }

  /**
   * Publishes a draft version
   * Updates status to PUBLISHED, sets published_at, updates Survey.latest_published_version_id
   */
  async publishVersion(versionId: number): Promise<SurveyVersion> {
    // Get version
    const version = await this.versionRepository.findOne({
      where: { id: versionId },
      relations: ["survey"],
    });
    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Validate can be published (must be DRAFT)
    if (version.status !== SurveyVersionStatus.DRAFT) {
      throw new BadRequestException(
        `Version ${versionId} is not in DRAFT status (current: ${version.status})`,
      );
    }

    // Validate structure before publishing (delegated to ValidatorService)
    this.validatorService.validateSurveyStructure(version.structure);

    // Update version status
    version.status = SurveyVersionStatus.PUBLISHED;
    version.published_at = new Date();
    const publishedVersion = await this.versionRepository.save(version);

    // Update Survey.latest_published_version_id
    await this.surveyRepository.update(
      { id: version.survey_id },
      { latest_published_version_id: versionId },
    );

    return publishedVersion;
  }

  /**
   * Unpublishes a version (changes status to ARCHIVED)
   * Warning: Active sessions will continue to use this version
   */
  async unpublishVersion(versionId: number): Promise<SurveyVersion> {
    // Get version
    const version = await this.versionRepository.findOne({
      where: { id: versionId },
    });
    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Validate can be unpublished (must be PUBLISHED)
    if (version.status !== SurveyVersionStatus.PUBLISHED) {
      throw new BadRequestException(
        `Version ${versionId} is not in PUBLISHED status (current: ${version.status})`,
      );
    }

    // Update version status
    version.status = SurveyVersionStatus.ARCHIVED;
    return await this.versionRepository.save(version);
  }

  /**
   * Gets the latest version of a survey with optional status filter
   */
  async getLatestVersion(
    surveyId: number,
    status?: SurveyVersionStatus,
  ): Promise<SurveyVersion | null> {
    const queryBuilder = this.versionRepository
      .createQueryBuilder("version")
      .where("version.survey_id = :surveyId", { surveyId });

    if (status) {
      queryBuilder.andWhere("version.status = :status", { status });
    }

    return await queryBuilder
      .orderBy("version.version", "DESC")
      .getOne();
  }

  /**
   * Gets version history for a survey (all versions)
   */
  async getVersionHistory(surveyId: number): Promise<SurveyVersion[]> {
    return await this.versionRepository
      .createQueryBuilder("version")
      .leftJoinAndSelect("version.created_by", "admin")
      .where("version.survey_id = :surveyId", { surveyId })
      .orderBy("version.version", "DESC")
      .getMany();
  }
}
