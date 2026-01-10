import { ActionRequest, ActionResponse, ActionContext } from "adminjs";
import { SurveyVersionService } from "../../survey/survey-version.service";
import { SurveyVersionStatus } from "../../entities/survey-version.entity";

/**
 * Custom AdminJS action: "Опубликовать версию"
 * Changes status to PUBLISHED, sets published_at, updates Survey.latest_published_version_id
 * Available ONLY on show view for SurveyVersions with status DRAFT
 */
export const publishVersionAction = {
  actionType: "record" as const,
  icon: "CheckCircle",
  label: "Опубликовать версию",
  guard: "Вы уверены? Эта версия станет доступной пользователям",
  component: false as const,

  /**
   * Show action only for DRAFT versions
   */
  isVisible: (context: ActionContext) => {
    const { record } = context;
    if (!record) return false;

    const status = record.params.status;
    return status === SurveyVersionStatus.DRAFT;
  },

  /**
   * Handler executes the action
   * Calls SurveyVersionService.publishVersion()
   * Shows success notice after publishing
   */
  handler: async (
    request: ActionRequest,
    response: ActionResponse,
    context: ActionContext,
  ) => {
    const { record, currentAdmin } = context;

    // Validate record exists
    if (!record) {
      return {
        record: record?.toJSON(currentAdmin),
        notice: {
          message: "Версия не найдена",
          type: "error",
        },
      };
    }

    // Validate status is DRAFT
    if (record.params.status !== SurveyVersionStatus.DRAFT) {
      return {
        record: record.toJSON(currentAdmin),
        notice: {
          message: `Невозможно опубликовать версию со статусом ${record.params.status}. Только черновики могут быть опубликованы.`,
          type: "error",
        },
      };
    }

    try {
      // Get SurveyVersionService from AdminJS instance (attached in main.ts)
      const surveyVersionService = (context as any)._admin
        ?.surveyVersionService as SurveyVersionService | undefined;

      if (!surveyVersionService) {
        throw new Error(
          "SurveyVersionService not available in AdminJS context",
        );
      }

      // Publish version
      const versionId = record.params.id;
      const publishedVersion =
        await surveyVersionService.publishVersion(versionId);

      return {
        record: record.toJSON(currentAdmin),
        notice: {
          message: `Версия ${publishedVersion.version} успешно опубликована. Новые пользователи будут использовать эту версию.`,
          type: "success",
        },
      };
    } catch (error: any) {
      return {
        record: record.toJSON(currentAdmin),
        notice: {
          message: `Ошибка при публикации версии: ${error.message}`,
          type: "error",
        },
      };
    }
  },
};
