import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException, Logger } from "@nestjs/common";
import { AuthService } from "../../auth/auth.service";
import { AdminService } from "../admin.service";

/**
 * AdminAuthGuard protects AdminJS routes with automatic authentication
 *
 * Authentication flow:
 * 1. First request: Extract token from query parameter ?token=xxx
 * 2. Validate JWT token using AuthService
 * 3. Check if user is admin using AdminService.isAdmin()
 * 4. If admin: save username to session and allow access
 * 5. If not admin: return 403 Forbidden
 * 6. Subsequent requests: Read username from session
 *
 * Security:
 * - Token is short-lived (15 minutes)
 * - Double validation: JWT signature + database check
 * - Session persists admin info for subsequent requests
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = request.session;

    // Check if user already authenticated in session
    if (session?.adminUser) {
      this.logger.log(`Admin ${session.adminUser.username} authenticated via session`);
      return true;
    }

    // First-time authentication: extract token from query parameter
    const token = request.query.token as string;

    if (!token) {
      this.logger.warn('No token provided and no active session');
      throw new UnauthorizedException('Admin authentication required');
    }

    try {
      // Validate JWT token
      const payload = this.authService.validateAdminToken(token);
      const { username } = payload;

      this.logger.log(`Validating admin token for user: ${username}`);

      // Check if user is in admins table
      const isAdmin = await this.adminService.isAdmin(username);

      if (!isAdmin) {
        this.logger.warn(`Access denied for non-admin user: ${username}`);
        throw new ForbiddenException('Доступ запрещен. Вы не являетесь администратором.');
      }

      // Save admin info to session
      session.adminUser = {
        username,
        authenticatedAt: new Date().toISOString(),
      };

      this.logger.log(`Admin ${username} authenticated successfully via token`);

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Admin authentication error:', error);
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }
}
