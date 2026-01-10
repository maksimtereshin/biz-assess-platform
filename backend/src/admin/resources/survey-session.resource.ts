import { ResourceOptions } from "adminjs";

/**
 * AdminJS resource configuration for SurveySession entity
 *
 * Features:
 * - Russian labels for all properties
 * - Read-only resource (no create/edit/delete)
 * - List view: id, survey_id, survey_version_id, user_id, status, started_at, completed_at
 * - Show view: all fields + relations to survey and version
 * - Filters: by survey_id, by status
 * - Sorting: by started_at desc
 */
export const SurveySessionResourceOptions: ResourceOptions = {
  navigation: {
    name: "Опросы",
    icon: "Activity",
  },
  properties: {
    id: {
      isVisible: { list: true, filter: true, show: true, edit: false },
      props: {
        label: "ID",
      },
    },
    survey_id: {
      isVisible: { list: true, filter: true, show: true, edit: false },
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
    survey_version_id: {
      isVisible: { list: true, filter: true, show: true, edit: false },
      props: {
        label: "ID версии опроса",
      },
    },
    survey_version: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Версия опроса",
      },
    },
    user_id: {
      isVisible: { list: true, filter: true, show: true, edit: false },
      props: {
        label: "ID пользователя",
      },
    },
    user: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Пользователь",
      },
    },
    session_token: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Токен сессии",
      },
    },
    status: {
      isVisible: { list: true, filter: true, show: true, edit: false },
      availableValues: [
        { value: "IN_PROGRESS", label: "В процессе" },
        { value: "COMPLETED", label: "Завершена" },
        { value: "ABANDONED", label: "Прервана" },
      ],
      props: {
        label: "Статус",
      },
    },
    started_at: {
      isVisible: { list: true, filter: false, show: true, edit: false },
      props: {
        label: "Дата начала",
      },
    },
    completed_at: {
      isVisible: { list: true, filter: false, show: true, edit: false },
      props: {
        label: "Дата завершения",
      },
    },
    current_question_id: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Текущий вопрос (ID)",
      },
    },
  },
  listProperties: [
    "id",
    "survey_id",
    "survey_version_id",
    "user_id",
    "status",
    "started_at",
    "completed_at",
  ],
  showProperties: [
    "id",
    "survey_id",
    "survey",
    "survey_version_id",
    "survey_version",
    "user_id",
    "user",
    "session_token",
    "status",
    "started_at",
    "completed_at",
    "current_question_id",
  ],
  filterProperties: ["id", "survey_id", "survey_version_id", "user_id", "status"],
  sort: {
    sortBy: "started_at",
    direction: "desc",
  },
  actions: {
    new: { isAccessible: false }, // Read-only
    edit: { isAccessible: false }, // Read-only
    delete: { isAccessible: false }, // Read-only
    list: { isAccessible: true },
    show: { isAccessible: true },
  },
};
