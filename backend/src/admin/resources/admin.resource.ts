import { ResourceOptions } from "adminjs";

/**
 * AdminJS resource configuration for Admin entity
 *
 * Features:
 * - Russian labels for all properties
 * - List view: username, created_at, created_by
 * - Edit view: username (editable), created_by (readonly)
 * - Validation: prevent deletion of last admin (handled in service)
 * - Auto-fill created_by on creation (handled in before hook)
 */
export const AdminResourceOptions: ResourceOptions = {
  navigation: {
    name: "Администрирование",
    icon: "User",
  },
  properties: {
    id: {
      isVisible: { list: false, filter: true, show: true, edit: false },
    },
    telegram_username: {
      isTitle: true,
      isRequired: true,
      isVisible: { list: true, filter: true, show: true, edit: true },
      props: {
        label: "Telegram Username",
      },
    },
    password_hash: {
      isVisible: false, // NEVER show password hash in UI for security
    },
    created_at: {
      isVisible: { list: true, filter: false, show: true, edit: false },
      props: {
        label: "Дата добавления",
      },
    },
    created_by_id: {
      isVisible: { list: false, filter: false, show: true, edit: false },
      props: {
        label: "Добавлен администратором (ID)",
      },
    },
    created_by: {
      isVisible: { list: true, filter: false, show: true, edit: false },
      props: {
        label: "Добавлен администратором",
      },
    },
  },
  listProperties: ["telegram_username", "created_at", "created_by"],
  showProperties: ["id", "telegram_username", "created_at", "created_by"],
  editProperties: ["telegram_username"],
  filterProperties: ["id", "telegram_username"],
  actions: {
    new: {
      isAccessible: true,
      before: async (request: any, context: any) => {
        // Auto-fill created_by with current admin ID
        // Note: This requires session to contain adminUser info
        if (context.session?.adminUser?.id) {
          request.payload.created_by_id = context.session.adminUser.id;
        }
        return request;
      },
    },
    edit: {
      isAccessible: true,
    },
    delete: {
      isAccessible: true,
      // Note: Validation to prevent last admin deletion happens in AdminService
    },
    list: { isAccessible: true },
    show: { isAccessible: true },
  },
};
