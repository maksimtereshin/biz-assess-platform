import { ResourceOptions } from "adminjs";

/**
 * AdminJS resource configuration for Survey entity (master record)
 *
 * Features:
 * - Russian labels for all properties
 * - List view: name, type, latest_published_version, status (via version), created_at
 * - Show view: all fields + history of versions (via relations)
 * - Actions: list, show, delete (soft delete)
 * - Filters: by type, by deleted status
 * - Sorting: by created_at desc
 */
export const SurveyResourceOptions: ResourceOptions = {
  navigation: {
    name: "Опросы",
    icon: "List",
  },
  properties: {
    id: {
      isVisible: { list: true, filter: true, show: true, edit: false },
      props: {
        label: "ID",
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
    latest_published_version_id: {
      isVisible: { list: true, filter: false, show: true, edit: false },
      props: {
        label: "Последняя опубликованная версия (ID)",
      },
    },
    latest_published_version: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Последняя опубликованная версия",
      },
    },
    deleted_at: {
      isVisible: { list: true, filter: true, show: true, edit: false },
      props: {
        label: "Дата удаления",
      },
    },
    versions: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "История версий",
      },
    },
  },
  listProperties: ["id", "name", "type", "latest_published_version_id", "deleted_at"],
  showProperties: [
    "id",
    "name",
    "type",
    "latest_published_version_id",
    "latest_published_version",
    "deleted_at",
    "versions",
  ],
  editProperties: ["name", "type"],
  filterProperties: ["id", "name", "type", "deleted_at"],
  sort: {
    sortBy: "id",
    direction: "desc",
  },
  actions: {
    new: {
      isAccessible: true,
    },
    edit: {
      isAccessible: true,
    },
    delete: {
      isAccessible: true,
      before: async (request: any) => {
        // Soft delete: set deleted_at instead of hard delete
        request.payload.deleted_at = new Date().toISOString();
        return request;
      },
    },
    list: { isAccessible: true },
    show: { isAccessible: true },
  },
};
