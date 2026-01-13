/**
 * Simple username/password authentication provider for AdminJS
 * Replaces complex Telegram authentication with standard login form
 */
export function createAuthProvider(
  DefaultAuthProvider: any,
  componentLoader: any,
  adminService: any,
): any {
  return new DefaultAuthProvider({
    componentLoader,
    authenticate: async ({ email, password }: any) => {
      // AdminJS login form uses "email" field - we use it as telegram_username
      if (!email || !password) {
        return null;
      }

      // Authenticate using AdminService
      const admin = await adminService.authenticateWithCredentials(
        email,
        password,
      );

      if (!admin) {
        return null;
      }

      // Return user object for AdminJS session
      return {
        id: admin.id,
        email: admin.telegram_username, // AdminJS expects email field
        username: admin.telegram_username,
        title: admin.telegram_username,
        avatarUrl: null,
      };
    },
  });
}
