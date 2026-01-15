import * as bcrypt from "bcryptjs";
import { AdminService } from "../admin.service";

/**
 * Password-based authentication provider for AdminJS
 * Replaces Telegram WebApp authentication for desktop-only admin access
 */
export function createPasswordAuthProvider(
  DefaultAuthProvider: any,
  componentLoader: any,
  adminService: AdminService,
): any {
  return new DefaultAuthProvider({
    componentLoader,
    authenticate: async (context: any) => {
      const { email, password } = context;

      if (!email || !password) {
        console.error("[AUTH] Email or password not provided");
        return null;
      }

      try {
        // Find admin by username (stored in telegram_username field)
        const admin = await adminService.findByUsername(email);

        if (!admin) {
          console.error(`[AUTH] Admin not found: ${email}`);
          return null;
        }

        // Verify password using bcrypt
        const isValidPassword = await bcrypt.compare(
          password,
          admin.password_hash,
        );

        if (!isValidPassword) {
          console.error(`[AUTH] Invalid password for: ${email}`);
          return null;
        }

        console.log(`[AUTH] Successful password authentication: ${email}`);

        // Return user object for AdminJS session
        return {
          id: admin.id,
          email: admin.telegram_username, // AdminJS expects email field
          username: admin.telegram_username,
          title: admin.telegram_username,
          avatarUrl: null,
        };
      } catch (error) {
        console.error("[AUTH] Authentication error:", error.message);
        return null;
      }
    },
  });
}
