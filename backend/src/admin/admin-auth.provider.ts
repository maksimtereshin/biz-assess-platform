import { AdminService } from "./admin.service";

/**
 * AdminAuthProvider implements AdminJS authentication interface
 *
 * This provider uses session data populated by AdminAuthGuard
 * AdminJS calls authenticate() to check if user is logged in
 *
 * Flow:
 * 1. AdminAuthGuard validates token and saves user to session
 * 2. AdminJS calls authenticate() on each request
 * 3. This provider reads from session and returns user info
 * 4. If no session: return null (user not authenticated)
 */
export class AdminAuthProvider {
  constructor(private adminService: AdminService) {}

  /**
   * Authenticates admin user using session data
   * Called by AdminJS on each request to check authentication status
   *
   * @param context - Request context with session
   * @returns Admin user object or null if not authenticated
   */
  async authenticate(context: any): Promise<{ username: string; role: string } | null> {
    const { session } = context;

    // Check if admin user exists in session
    if (!session?.adminUser) {
      return null;
    }

    const { username } = session.adminUser;

    // Verify user is still an admin (in case they were removed from admins table)
    const isAdmin = await this.adminService.isAdmin(username);

    if (!isAdmin) {
      // Clear session if user is no longer admin
      delete session.adminUser;
      return null;
    }

    // Return admin user info for AdminJS
    return {
      username,
      role: 'admin',
    };
  }

  /**
   * Serializes admin user for session storage
   * Called by AdminJS when saving session
   */
  serialize(admin: { username: string; role: string }): string {
    return JSON.stringify(admin);
  }

  /**
   * Deserializes admin user from session storage
   * Called by AdminJS when reading session
   */
  deserialize(json: string): { username: string; role: string } {
    return JSON.parse(json);
  }
}
