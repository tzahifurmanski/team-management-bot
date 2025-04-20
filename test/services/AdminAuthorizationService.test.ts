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
      process.env.ADMIN_USER_IDs = "";

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
  });
});
