import { ResourceOptions } from "adminjs";
import { createNewVersionAction } from "../actions/create-new-version.action";
import { publishVersionAction } from "../actions/publish-version.action";
import { unpublishVersionAction } from "../actions/unpublish-version.action";
import { previewSurveyAction } from "../actions/preview-survey.action";

/**
 * AdminJS resource configuration for SurveyVersion entity
 *
 * Features:
 * - Russian labels for all properties
 * - List view: survey_id, version, name, type, status, published_at, created_by
 * - Edit view: name, type, structure (custom JSONB editor), status
 * - Show view: all fields + structure preview
 * - Filters: by survey_id, by status
 * - Sorting: by version desc
 * - Validation: real-time structure JSONB validation in custom editor
 * - Custom actions: "Publish", "Create New Version", "Unpublish"
 * - Custom component: StructureEditor for tree-like editing of survey structure
 */
export const SurveyVersionResourceOptions: ResourceOptions = {
  navigation: {
    name: "Опросы",
    icon: "FileText",
  },
  properties: {
    id: {
      isVisible: { list: true, filter: true, show: true, edit: false },
      props: {
        label: "ID",
      },
    },
    survey_id: {
      isRequired: true,
      isVisible: { list: true, filter: true, show: true, edit: true },
      props: {
        label: "ID опроса",
      },
    },
    survey: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Опрос",
      },
    },
    version: {
      isVisible: { list: true, filter: false, show: true, edit: false },
      props: {
        label: "Версия",
      },
    },
    name: {
      isTitle: true,
      isRequired: true,
      isVisible: { list: true, filter: true, show: true, edit: true },
      props: {
        label: "Название",
      },
    },
    type: {
      isRequired: true,
      isVisible: { list: true, filter: true, show: true, edit: true },
      availableValues: [
        { value: "EXPRESS", label: "Экспресс-опрос" },
        { value: "FULL", label: "Полный опрос" },
      ],
      props: {
        label: "Тип опроса",
      },
    },
    structure: {
      type: "mixed",
      isRequired: true,
      isVisible: { list: false, filter: false, show: true, edit: true },
      props: {
        label: "Структура опроса",
      },
      components: {
        // Use component ID registered in ComponentLoader (main.ts)
        edit: "StructureEditor",
      },
    },
    status: {
      isRequired: true,
      isVisible: { list: true, filter: true, show: true, edit: true },
      availableValues: [
        { value: "DRAFT", label: "Черновик" },
        { value: "PUBLISHED", label: "Опубликовано" },
        { value: "ARCHIVED", label: "Архив" },
      ],
      props: {
        label: "Статус",
      },
    },
    published_at: {
      isVisible: { list: true, filter: false, show: true, edit: false },
      props: {
        label: "Дата публикации",
      },
    },
    created_by_id: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Создан администратором (ID)",
      },
    },
    created_by: {
      isVisible: { list: true, filter: false, show: true, edit: false },
      props: {
        label: "Создан администратором",
      },
    },
    created_at: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Дата создания",
      },
    },
    updated_at: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Дата обновления",
      },
    },
  },
  listProperties: [
    "id",
    "survey_id",
    "version",
    "name",
    "type",
    "status",
    "published_at",
    "created_by",
  ],
  showProperties: [
    "id",
    "survey_id",
    "survey",
    "version",
    "name",
    "type",
    "structure",
    "status",
    "published_at",
    "created_by_id",
    "created_by",
    "created_at",
    "updated_at",
  ],
  editProperties: ["survey_id", "name", "type", "structure", "status"],
  filterProperties: ["id", "survey_id", "name", "type", "status"],
  sort: {
    sortBy: "version",
    direction: "desc",
  },
  actions: {
    new: {
      isAccessible: true,
      before: async (request: any, context: any) => {
        // Auto-increment version number for the survey
        if (request.payload.survey_id) {
          const versionRepo = context.resource._decorated.getRepository();
          const maxVersion = await versionRepo
            .createQueryBuilder("sv")
            .select("MAX(sv.version)", "max")
            .where("sv.survey_id = :surveyId", {
              surveyId: request.payload.survey_id,
            })
            .getRawOne();

          request.payload.version = (maxVersion?.max || 0) + 1;
        }

        // Auto-fill created_by
        if (context.session?.adminUser?.id) {
          request.payload.created_by_id = context.session.adminUser.id;
        }

        return request;
      },
    },
    edit: {
      isAccessible: true,
      before: async (request: any) => {
        // If status changed to PUBLISHED, set published_at
        if (
          request.payload.status === "PUBLISHED" &&
          !request.payload.published_at
        ) {
          request.payload.published_at = new Date().toISOString();
        }
        return request;
      },
    },
    delete: {
      isAccessible: true,
    },
    list: { isAccessible: true },
    show: { isAccessible: true },

    // Custom actions for versioning workflow
    createNewVersion: createNewVersionAction,
    publishVersion: publishVersionAction,
    unpublishVersion: unpublishVersionAction,
    previewSurvey: previewSurveyAction,
  },
};
