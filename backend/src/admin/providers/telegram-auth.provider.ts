import { AuthService } from "../../auth/auth.service";
import { AdminService } from "../admin.service";

/**
 * Creates TelegramAuthProvider for AdminJS authentication using Telegram SecureStorage + Bearer tokens
 *
 * This factory function creates a provider that supports:
 * 1. Token-based authentication via URL query parameter (?token=...)
 * 2. Token-based authentication via Authorization header (Bearer ...)
 * 3. Session-based authentication (fallback if cookies work)
 *
 * Flow:
 * 1. User arrives with ?token= from Telegram bot
 * 2. Token stored in Telegram SecureStorage via adminTokenHandler
 * 3. Redirect to /admin (no token in URL)
 * 4. handleLogin checks for token in query or Authorization header
 * 5. Validates JWT token and returns user object
 * 6. AdminJS stores user in req.session.adminUser automatically
 *
 * @param DefaultAuthProvider - AdminJS DefaultAuthProvider class (from admin-adapter)
 * @param componentLoader - AdminJS ComponentLoader instance
 * @param authService - AuthService for JWT token validation
 * @param adminService - AdminService for admin user management
 * @returns Configured AdminJS auth provider
 */
export function createTelegramAuthProvider(
  DefaultAuthProvider: any,
  componentLoader: any,
  authService: AuthService,
  adminService: AdminService,
): any {

  // Create and configure the provider
  const provider = new DefaultAuthProvider({
    componentLoader,
    authenticate: async (payload: any, context?: any) => {
      // This is called by AdminJS login form (if shown as fallback)
      // For Telegram auth, we use handleLogin instead
      // Return null to indicate "not authenticated via form"
      return null;
    },
  });

  // Override handleLogin method to implement custom token-based authentication
  provider.handleLogin = async function (
    opts: any,
    context?: any,
  ): Promise<any> {
    try {
      // Priority 1: Check for token in URL query (?token=...)
      // This is used on first visit from Telegram bot
      const tokenFromQuery = opts.query?.token;

      // Priority 2: Check Authorization header (Bearer ...)
      // This is used on subsequent requests if fetch override is active
      const authHeader = opts.headers?.authorization;
      const tokenFromHeader = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

      const token = tokenFromQuery || tokenFromHeader;

      if (!token) {
        // No token provided - show login form as fallback
        console.log(
          "[TelegramAuthProvider] No token found, showing login form",
        );
        return null;
      }

      // Validate JWT token
      const payload = authService.validateAdminToken(token);
      if (!payload || !payload.username) {
        throw new Error("Invalid token payload");
      }

      const normalizedUsername = payload.username.trim().toLowerCase();

      // Verify user is still an admin
      const isAdmin = await adminService.isAdmin(normalizedUsername);
      if (!isAdmin) {
        console.warn(
          `[TelegramAuthProvider] Access denied for user: ${normalizedUsername}`,
        );
        throw new Error(`Access denied for user: ${normalizedUsername}`);
      }

      // Get full admin user details
      const adminUser = await adminService.findByUsername(normalizedUsername);

      if (!adminUser) {
        throw new Error("Admin user not found in database");
      }

      console.log(
        `[TelegramAuthProvider] User authenticated successfully: ${normalizedUsername}`,
      );

      // Return user object - AdminJS will store in req.session.adminUser
      return {
        id: adminUser.id,
        email: `${adminUser.telegram_username}@telegram.user`,
        username: adminUser.telegram_username,
        title: adminUser.telegram_username,
        avatarUrl: null,
      };
    } catch (error) {
      console.error("[TelegramAuthProvider] Authentication error:", error);
      return null; // Show login form on error
    }
  };

  return provider;
}
