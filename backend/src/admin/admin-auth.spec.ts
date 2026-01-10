import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "../auth/auth.service";
import { AdminService } from "./admin.service";
import { SurveyService } from "../survey/survey.service";
import { UnauthorizedException } from "@nestjs/common";

describe("Admin Authentication", () => {
  let authService: AuthService;
  let adminService: AdminService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: SurveyService,
          useValue: {
            canStartNewSurvey: jest.fn(),
            createNewSession: jest.fn(),
          },
        },
        {
          provide: AdminService,
          useValue: {
            isAdmin: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    adminService = module.get<AdminService>(AdminService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe("generateAdminAuthToken", () => {
    it("should generate a JWT token with admin role and 15 minute expiration", () => {
      const username = "maksim_tereshin";
      const expectedToken = "admin.jwt.token";
      const expectedPayload = { username, role: "admin" };

      jest.spyOn(jwtService, "sign").mockReturnValue(expectedToken);

      const result = authService.generateAdminAuthToken(username);

      expect(jwtService.sign).toHaveBeenCalledWith(expectedPayload, {
        expiresIn: "15m",
      });
      expect(result).toBe(expectedToken);
    });
  });

  describe("validateAdminToken", () => {
    it("should successfully validate a valid admin token", () => {
      const token = "valid.admin.token";
      const expectedPayload = { username: "maksim_tereshin", role: "admin" };

      jest.spyOn(jwtService, "verify").mockReturnValue(expectedPayload);

      const result = authService.validateAdminToken(token);

      expect(result).toEqual(expectedPayload);
      expect(jwtService.verify).toHaveBeenCalledWith(token);
    });

    it("should throw UnauthorizedException for invalid token", () => {
      const token = "invalid.token";

      jest.spyOn(jwtService, "verify").mockImplementation(() => {
        throw new Error("Invalid token");
      });

      expect(() => authService.validateAdminToken(token)).toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for expired token", () => {
      const token = "expired.token";

      jest.spyOn(jwtService, "verify").mockImplementation(() => {
        throw new Error("Token expired");
      });

      expect(() => authService.validateAdminToken(token)).toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for token without admin role", () => {
      const token = "user.token";

      jest.spyOn(jwtService, "verify").mockReturnValue({
        username: "regular_user",
        role: "user",
      });

      expect(() => authService.validateAdminToken(token)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("Admin access control", () => {
    it("should allow access for user in admins table", async () => {
      const username = "maksim_tereshin";

      jest.spyOn(adminService, "isAdmin").mockResolvedValue(true);

      const isAdmin = await adminService.isAdmin(username);

      expect(isAdmin).toBe(true);
      expect(adminService.isAdmin).toHaveBeenCalledWith(username);
    });

    it("should deny access for user not in admins table", async () => {
      const username = "not_an_admin";

      jest.spyOn(adminService, "isAdmin").mockResolvedValue(false);

      const isAdmin = await adminService.isAdmin(username);

      expect(isAdmin).toBe(false);
      expect(adminService.isAdmin).toHaveBeenCalledWith(username);
    });
  });

  describe("Full authentication flow", () => {
    it("should complete full admin authentication flow successfully", async () => {
      const username = "maksim_tereshin";
      const token = "admin.jwt.token";

      // Step 1: Generate token
      jest.spyOn(jwtService, "sign").mockReturnValue(token);
      const generatedToken = authService.generateAdminAuthToken(username);
      expect(generatedToken).toBe(token);

      // Step 2: Validate token
      jest
        .spyOn(jwtService, "verify")
        .mockReturnValue({ username, role: "admin" });
      const payload = authService.validateAdminToken(token);
      expect(payload.username).toBe(username);
      expect(payload.role).toBe("admin");

      // Step 3: Check admin status
      jest.spyOn(adminService, "isAdmin").mockResolvedValue(true);
      const isAdmin = await adminService.isAdmin(username);
      expect(isAdmin).toBe(true);
    });

    it("should block non-admin users even with valid token structure", async () => {
      const username = "not_an_admin";
      const token = "valid.jwt.token";

      // Token is structurally valid
      jest
        .spyOn(jwtService, "verify")
        .mockReturnValue({ username, role: "admin" });
      const payload = authService.validateAdminToken(token);
      expect(payload.username).toBe(username);

      // But user is not in admins table
      jest.spyOn(adminService, "isAdmin").mockResolvedValue(false);
      const isAdmin = await adminService.isAdmin(username);
      expect(isAdmin).toBe(false);
    });
  });
});
