import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../auth/auth.service";
import { AdminService } from "../admin.service";

/**
 * Middleware to validate admin JWT tokens from Authorization header
 * Replaces session-based authentication for Telegram WebView compatibility
 * Token is stored in Telegram SecureStorage and sent via Bearer token
 */
@Injectable()
export class AdminTokenAuthMiddleware implements NestMiddleware {
  constructor(
    private authService: AuthService,
    private adminService: AdminService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedException("No admin token provided");
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Validate JWT token signature and expiration
      const payload = this.authService.validateAdminToken(token);

      // Verify user is still an admin (in case they were removed)
      const isAdmin = await this.adminService.isAdmin(payload.username);
      if (!isAdmin) {
        throw new UnauthorizedException("User is not an admin");
      }

      // Get full admin details from database
      const adminUser = await this.adminService.findByUsername(
        payload.username,
      );

      if (!adminUser) {
        throw new UnauthorizedException("Admin user not found");
      }

      // Attach admin to request object for AdminJS
      (req as any).adminUser = {
        id: adminUser.id,
        username: adminUser.telegram_username,
        email: `${adminUser.telegram_username}@telegram.user`,
      };

      next();
    } catch (error) {
      throw new UnauthorizedException("Invalid admin token");
    }
  }
}
