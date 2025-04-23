import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { AdminAuthorizationService } from "../../src/services/AdminAuthorizationService";

describe("AdminAuthorizationService", () => {
  // Save and restore environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Group related tests to reduce test setup/teardown overhead
  describe("admin identification", () => {
    test("should load admin user IDs and identify admins correctly", () => {
      // Set up environment
      process.env.ADMIN_USER_IDS = "U12345,U67890";

      const authService = new AdminAuthorizationService();

      // Test loading and identification
      expect(authService.getAdminUserIds()).toEqual(["U12345", "U67890"]);
      expect(authService.isUserAdmin("U12345")).toBe(true);
      expect(authService.isUserAdmin("U67890")).toBe(true);
      expect(authService.isUserAdmin("U99999")).toBe(false);
    });

    test("should handle empty admin user IDs", () => {
      // Set up environment
      process.env.ADMIN_USER_IDS = "";

      const authService = new AdminAuthorizationService();

      // Check admin users list is empty
      expect(authService.getAdminUserIds()).toEqual([]);
    });
  });

  describe("command authorization", () => {
    test("should identify admin commands and authorize properly", () => {
      // Set up environment
      process.env.ADMIN_USER_IDS = "U12345,U67890";
      process.env.ADMIN_COMMANDS = "team,admin,config";
      process.env.ADMIN_LOG_ACTIONS = "false"; // Disable logging for tests

      const authService = new AdminAuthorizationService();

      // Test command check
      expect(authService.isAdminCommand("team list")).toBe(true);
      expect(authService.isAdminCommand("admin users")).toBe(true);
      expect(authService.isAdminCommand("help")).toBe(false);

      // Test authorization
      expect(authService.isAuthorized("U12345", "team list")).toBe(true);
      expect(authService.isAuthorized("U99999", "team list")).toBe(false);
      expect(authService.isAuthorized("U99999", "help")).toBe(true);
    });

    test("should handle empty admin commands", () => {
      process.env.ADMIN_USER_IDS = "U12345";
      process.env.ADMIN_COMMANDS = "";
      process.env.ADMIN_LOG_ACTIONS = "false";

      const authService = new AdminAuthorizationService();

      expect(authService.isAdminCommand("any command")).toBe(false);
      expect(authService.isAuthorized("U12345", "any command")).toBe(true);
    });

    test("should handle logging configuration", () => {
      process.env.ADMIN_USER_IDS = "U12345";
      process.env.ADMIN_COMMANDS = "team";
      process.env.ADMIN_LOG_ACTIONS = "true";

      const authService = new AdminAuthorizationService();

      // Logging should be enabled
      expect(authService.isAuthorized("U12345", "team list")).toBe(true);
      expect(authService.isAuthorized("U99999", "team list")).toBe(false);
    });
  });

  describe("confirmation flow", () => {
    test("should handle confirmation requests and confirmations", async () => {
      process.env.ADMIN_USER_IDS = "U12345";
      process.env.ADMIN_COMMANDS = "team";
      process.env.ADMIN_REQUIRE_CONFIRMATION = "true";
      process.env.ADMIN_LOG_ACTIONS = "false";

      const authService = new AdminAuthorizationService();
      const userId = "U12345";
      const teamId = "T12345";
      const action = "delete team";

      // Request confirmation
      await authService.requestConfirmation(userId, teamId, action);

      // Confirm action immediately
      expect(authService.confirmAction(userId, teamId, action)).toBe(true);

      // Try to confirm again (should fail as request was consumed)
      expect(authService.confirmAction(userId, teamId, action)).toBe(false);
    });

    test("should handle expired confirmation requests", async () => {
      process.env.ADMIN_USER_IDS = "U12345";
      process.env.ADMIN_COMMANDS = "team";
      process.env.ADMIN_REQUIRE_CONFIRMATION = "true";
      process.env.ADMIN_LOG_ACTIONS = "false";

      const authService = new AdminAuthorizationService();
      const userId = "U12345";
      const teamId = "T12345";
      const action = "delete team";

      // Request confirmation
      await authService.requestConfirmation(userId, teamId, action);

      // Mock Date.now to simulate expiration
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 6 * 60 * 1000); // 6 minutes later

      // Try to confirm (should fail as request expired)
      expect(authService.confirmAction(userId, teamId, action)).toBe(false);

      // Restore Date.now
      Date.now = originalNow;
    });

    test("should handle non-existent confirmation requests", () => {
      process.env.ADMIN_USER_IDS = "U12345";
      process.env.ADMIN_COMMANDS = "team";
      process.env.ADMIN_REQUIRE_CONFIRMATION = "true";
      process.env.ADMIN_LOG_ACTIONS = "false";

      const authService = new AdminAuthorizationService();

      // Try to confirm without requesting
      expect(authService.confirmAction("U12345", "T12345", "delete team")).toBe(
        false,
      );
    });

    test("should log confirmation actions when logging is enabled", async () => {
      process.env.ADMIN_USER_IDS = "U12345";
      process.env.ADMIN_COMMANDS = "team";
      process.env.ADMIN_REQUIRE_CONFIRMATION = "true";
      process.env.ADMIN_LOG_ACTIONS = "true";

      const authService = new AdminAuthorizationService();
      const userId = "U12345";
      const teamId = "T12345";
      const action = "delete team";

      // Request confirmation
      await authService.requestConfirmation(userId, teamId, action);

      // Confirm action with logging enabled
      expect(authService.confirmAction(userId, teamId, action)).toBe(true);
    });
  });
});
