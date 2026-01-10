import { ActionRequest, ActionResponse, ActionContext } from "adminjs";
import { SurveyVersionService } from "../../survey/survey-version.service";
import { SurveyVersionStatus } from "../../entities/survey-version.entity";

/**
 * Custom AdminJS action: "Снять с публикации"
 * Changes status to ARCHIVED (hides from new users, active sessions continue)
 * Available ONLY on show view for SurveyVersions with status PUBLISHED
 */
export const unpublishVersionAction = {
  actionType: "record" as const,
  icon: "Archive",
  label: "Снять с публикации",
  guard:
    "Новые пользователи не смогут начать этот опрос. Активные сессии продолжат работать.",
  component: false as const,

  /**
   * Show action only for PUBLISHED versions
   */
  isVisible: (context: ActionContext) => {
    const { record } = context;
    if (!record) return false;

    const status = record.params.status;
    return status === SurveyVersionStatus.PUBLISHED;
  },

  /**
   * Handler executes the action
   * Calls SurveyVersionService.unpublishVersion()
   * Shows success notice with warning about active sessions
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

    // Validate status is PUBLISHED
    if (record.params.status !== SurveyVersionStatus.PUBLISHED) {
      return {
        record: record.toJSON(currentAdmin),
        notice: {
          message: `Невозможно снять с публикации версию со статусом ${record.params.status}. Только опубликованные версии могут быть архивированы.`,
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

      // Unpublish version (change to ARCHIVED)
      const versionId = record.params.id;
      const archivedVersion =
        await surveyVersionService.unpublishVersion(versionId);

      return {
        record: record.toJSON(currentAdmin),
        notice: {
          message: `Версия ${archivedVersion.version} снята с публикации. Новые пользователи не смогут начать этот опрос. Активные сессии продолжат работать.`,
          type: "success",
        },
      };
    } catch (error: any) {
      return {
        record: record.toJSON(currentAdmin),
        notice: {
          message: `Ошибка при снятии с публикации: ${error.message}`,
          type: "error",
        },
      };
    }
  },
};
