import { ActionRequest, ActionResponse, ActionContext } from "adminjs";
import { SurveyVersionService } from "../../survey/survey-version.service";

/**
 * Custom AdminJS action: "Создать новую версию"
 * Clones the current version into a new DRAFT version (version + 1)
 * Available on show view for any SurveyVersion
 */
export const createNewVersionAction = {
  actionType: "record" as const,
  icon: "Copy",
  label: "Создать новую версию",
  component: false as const,

  /**
   * Handler executes the action
   * Calls SurveyVersionService.createNewVersionFromExisting()
   * Redirects to edit view of the new draft version
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

    try {
      // Get SurveyVersionService from AdminJS instance (attached in main.ts)
      const surveyVersionService = (context as any)._admin
        ?.surveyVersionService as SurveyVersionService | undefined;

      if (!surveyVersionService) {
        throw new Error(
          "SurveyVersionService not available in AdminJS context",
        );
      }

      // Get admin ID from session
      const adminId = (request as any).session?.adminUser?.id;
      if (!adminId) {
        throw new Error("Admin ID not found in session");
      }

      // Clone existing version into new draft
      const existingVersionId = record.params.id;
      const newVersion =
        await surveyVersionService.createNewVersionFromExisting(
          existingVersionId,
          adminId,
        );

      // Redirect to edit view of new version
      return {
        record: record.toJSON(currentAdmin),
        redirectUrl: `/admin/resources/SurveyVersion/records/${newVersion.id}/edit`,
        notice: {
          message: `Создана новая версия ${newVersion.version} в статусе Черновик`,
          type: "success",
        },
      };
    } catch (error: any) {
      return {
        record: record.toJSON(currentAdmin),
        notice: {
          message: `Ошибка при создании версии: ${error.message}`,
          type: "error",
        },
      };
    }
  },
};
