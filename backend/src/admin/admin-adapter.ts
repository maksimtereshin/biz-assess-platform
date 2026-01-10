/**
 * AdminJS Modules Loader and Adapter Registration
 *
 * CRITICAL: This module consolidates ALL AdminJS ESM imports in ONE place
 * to ensure all operations use the SAME module instance.
 *
 * Problem: Using eval('import()') in multiple places creates isolated
 * module contexts, causing adapter registration to fail.
 *
 * Solution: Load ALL modules once, register adapter, cache and return.
 */

let modulesCache: any = null;

export async function getAdminJSModules() {
  if (modulesCache) {
    console.log("[AdminJS] Returning cached modules");
    return modulesCache;
  }

  try {
    console.log("[AdminJS] Loading ESM modules...");

    // Load ALL AdminJS ESM modules in one place
    const AdminJS = (await eval('import("adminjs")')).default;
    const AdminJSTypeorm = await eval('import("@adminjs/typeorm")');
    const AdminJSExpress = await eval('import("@adminjs/express")');
    const { ComponentLoader } = await eval('import("adminjs")');

    console.log("[AdminJS] Registering TypeORM adapter...");

    // Register adapter using the SAME AdminJS instance
    AdminJS.registerAdapter({
      Database: AdminJSTypeorm.Database,
      Resource: AdminJSTypeorm.Resource,
    });

    console.log("[AdminJS] TypeORM adapter registered successfully");

    // Cache and return ALL modules
    modulesCache = {
      AdminJS,
      AdminJSTypeorm,
      AdminJSExpress,
      ComponentLoader,
    };

    return modulesCache;
  } catch (error) {
    console.error("[AdminJS] Failed to load modules:", error);
    throw error;
  }
}
