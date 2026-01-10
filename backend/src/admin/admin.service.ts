import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Admin } from "../entities/admin.entity";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  /**
   * Validates if a telegram username is in the admins table
   * @param telegramUsername - Telegram username to validate
   * @returns true if user is an admin, false otherwise
   */
  async validateAdmin(telegramUsername: string): Promise<boolean> {
    const normalizedUsername = telegramUsername.trim().toLowerCase();
    this.logger.log(
      `[ADMIN CHECK] Validating username: "${telegramUsername}" (normalized: "${normalizedUsername}")`,
    );

    const admin = await this.adminRepository.findOne({
      where: { telegram_username: ILike(normalizedUsername) },
    });

    this.logger.log(
      `[ADMIN CHECK] Query result for "${normalizedUsername}": ${admin ? "FOUND" : "NOT FOUND"}`,
    );

    if (!admin) {
      // Show what's actually in database
      const allAdmins = await this.adminRepository.find();
      this.logger.warn(
        `[ADMIN CHECK] Available admins:`,
        allAdmins.map((a) => a.telegram_username),
      );
    }

    return !!admin;
  }

  /**
   * Checks if a telegram username is an admin
   * Alias for validateAdmin for better readability
   * @param telegramUsername - Telegram username to check
   * @returns true if user is an admin, false otherwise
   */
  async isAdmin(telegramUsername: string): Promise<boolean> {
    return this.validateAdmin(telegramUsername);
  }

  /**
   * Creates a new admin
   * @param username - Telegram username
   * @param createdById - ID of the admin creating this admin
   * @returns Created admin entity
   */
  async createAdmin(username: string, createdById: number): Promise<Admin> {
    // Check if admin already exists (case-insensitive)
    const normalizedUsername = username.trim().toLowerCase();
    const existing = await this.adminRepository.findOne({
      where: { telegram_username: ILike(normalizedUsername) },
    });

    if (existing) {
      throw new BadRequestException(
        `Admin with username ${username} already exists`,
      );
    }

    // Create new admin
    const admin = this.adminRepository.create({
      telegram_username: username,
      created_by_id: createdById,
    });

    return this.adminRepository.save(admin);
  }

  /**
   * Deletes an admin
   * Prevents deletion of the last admin
   * @param id - Admin ID to delete
   */
  async deleteAdmin(id: number): Promise<void> {
    // Check if admin exists
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Check if this is the last admin
    const adminCount = await this.adminRepository.count();
    if (adminCount <= 1) {
      throw new BadRequestException("Cannot delete the last administrator");
    }

    await this.adminRepository.remove(admin);
  }

  /**
   * Gets admin history for audit purposes
   * @returns Array of all admins with their creation info
   */
  async getAdminHistory(): Promise<Admin[]> {
    return this.adminRepository.find({
      relations: ["created_by"],
      order: { created_at: "DESC" },
    });
  }

  /**
   * Finds an admin by telegram username
   * @param telegramUsername - Telegram username
   * @returns Admin entity or null
   */
  async findByUsername(telegramUsername: string): Promise<Admin | null> {
    const normalizedUsername = telegramUsername.trim().toLowerCase();
    return this.adminRepository.findOne({
      where: { telegram_username: ILike(normalizedUsername) },
    });
  }

  /**
   * Finds an admin by ID
   * @param id - Admin ID
   * @returns Admin entity or null
   */
  async findById(id: number): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { id } });
  }
}
