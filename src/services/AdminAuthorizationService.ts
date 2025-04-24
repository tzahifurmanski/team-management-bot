// src/services/AdminAuthorizationService.ts
import { logger } from "../settings/server_consts.js";
import { handleListParameter } from "../utils.js";

/**
 * Service for checking if users are authorized to perform admin actions
 */
export class AdminAuthorizationService {
  private adminUserIds: string[] = [];
  private adminCommands: string[] = [];
  private logActions: boolean = true;
  private requireConfirmation: boolean = true;
  private confirmationRequests: Map<
    string,
    { userId: string; action: string; expires: number }
  > = new Map();

  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load admin configuration from environment variables
   */
  private loadConfiguration(): void {
    // Load admin user IDs (safe with empty default)
    this.adminUserIds = handleListParameter(process.env.ADMIN_USER_IDS || "");

    // Load admin commands
    this.adminCommands = handleListParameter(
      process.env.ADMIN_COMMANDS || "team",
    );

    // Parse boolean values safely
    this.logActions = process.env.ADMIN_LOG_ACTIONS !== "false"; // Default to true
    this.requireConfirmation =
      process.env.ADMIN_REQUIRE_CONFIRMATION !== "false"; // Default to true

    logger.debug(`Loaded ${this.adminUserIds.length} admin users`);
    logger.debug(`Admin commands: ${this.adminCommands.join(", ")}`);
  }

  /**
   * Check if a user is authorized as an admin
   * @param userId The Slack user ID to check
   * @returns True if the user is an admin, false otherwise
   */
  public isUserAdmin(userId: string): boolean {
    return this.adminUserIds.includes(userId);
  }

  /**
   * Check if a command requires admin authorization
   * @param command The command to check
   * @returns True if the command requires admin authorization, false otherwise
   */
  public isAdminCommand(command: string): boolean {
    // Check if any admin command is a prefix of the given command
    return this.adminCommands.some((adminCommand) =>
      command.startsWith(adminCommand),
    );
  }

  /**
   * Check if a user is authorized to perform a specific command
   * @param userId The Slack user ID to check
   * @param command The command being executed
   * @returns True if the user is authorized, false otherwise
   */
  public isAuthorized(userId: string, command: string): boolean {
    // If command doesn't require admin privileges, allow it
    if (!this.isAdminCommand(command)) {
      return true;
    }

    // Check if user is an admin
    const isAdmin = this.isUserAdmin(userId);

    // Log the authorization check if enabled
    if (this.logActions) {
      logger.info(
        `Admin authorization check: User ${userId} ${isAdmin ? "allowed" : "denied"} for command "${command}"`,
      );
    }

    return isAdmin;
  }

  /**
   * Get all admin user IDs
   * This is mainly for testing purposes
   */
  public getAdminUserIds(): string[] {
    return [...this.adminUserIds];
  }

  /**
   * Request confirmation for an admin action
   * @param userId The Slack user ID requesting confirmation
   * @param teamId The Slack team ID
   * @param action The action being confirmed
   * @returns A promise that resolves when the confirmation request is processed
   */
  public async requestConfirmation(
    userId: string,
    teamId: string,
    action: string,
  ): Promise<void> {
    if (this.logActions) {
      logger.info(
        `Confirmation requested by user ${userId} for action "${action}" in team ${teamId}`,
      );
    }

    // Store the confirmation request with a 5-minute expiration
    const key = `${userId}:${teamId}:${action}`;
    this.confirmationRequests.set(key, {
      userId,
      action,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });
  }

  /**
   * Confirm an admin action
   * @param userId The Slack user ID confirming the action
   * @param teamId The Slack team ID
   * @returns True if the action is confirmed, false otherwise
   */
  public confirmAction(
    userId: string,
    teamId: string,
    action: string,
  ): boolean {
    if (this.logActions) {
      logger.info(`Confirmation check for user ${userId} in team ${teamId}`);
    }

    const key = `${userId}:${teamId}:${action}`;

    const request = this.confirmationRequests.get(key);
    if (!request) {
      return false;
    }

    // Check if the request has expired
    if (request.expires < Date.now()) {
      this.confirmationRequests.delete(key);
      return false;
    }

    // Clean up the request
    this.confirmationRequests.delete(key);

    return true;
  }
}

// Create and export singleton instance
export const adminAuthService = new AdminAuthorizationService();
