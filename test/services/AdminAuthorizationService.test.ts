// test/services/AdminAuthorizationService.test.ts
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

  test("should load admin user IDs from environment variables", () => {
    // Set up environment
    process.env.ADMIN_USER_IDS = "U12345,U67890";

    const authService = new AdminAuthorizationService();

    // Check admin users were loaded correctly
    expect(authService.getAdminUserIds()).toEqual(["U12345", "U67890"]);
  });

  test("should handle empty admin user IDs", () => {
    // Set up environment
    process.env.ADMIN_USER_IDS = "";

    const authService = new AdminAuthorizationService();

    // Check admin users list is empty
    expect(authService.getAdminUserIds()).toEqual([]);
  });

  test("should correctly identify admin users", () => {
    // Set up environment
    process.env.ADMIN_USER_IDS = "U12345,U67890";

    const authService = new AdminAuthorizationService();

    // Test admin user check
    expect(authService.isUserAdmin("U12345")).toBe(true);
    expect(authService.isUserAdmin("U67890")).toBe(true);
    expect(authService.isUserAdmin("U99999")).toBe(false);
  });

  test("should correctly identify admin commands", () => {
    // Set up environment
    process.env.ADMIN_COMMANDS = "team,admin,config";

    const authService = new AdminAuthorizationService();

    // Test command check
    expect(authService.isAdminCommand("team list")).toBe(true);
    expect(authService.isAdminCommand("team add")).toBe(true);
    expect(authService.isAdminCommand("admin users")).toBe(true);
    expect(authService.isAdminCommand("config set")).toBe(true);
    expect(authService.isAdminCommand("help")).toBe(false);
    expect(authService.isAdminCommand("status")).toBe(false);
  });

  test("should authorize admin users for admin commands", () => {
    // Set up environment
    process.env.ADMIN_USER_IDS = "U12345,U67890";
    process.env.ADMIN_COMMANDS = "team,admin,config";

    const authService = new AdminAuthorizationService();

    // Test authorization
    expect(authService.isAuthorized("U12345", "team list")).toBe(true);
    expect(authService.isAuthorized("U67890", "admin users")).toBe(true);
    expect(authService.isAuthorized("U99999", "team add")).toBe(false);
  });

  test("should authorize all users for non-admin commands", () => {
    // Set up environment
    process.env.ADMIN_USER_IDS = "U12345,U67890";
    process.env.ADMIN_COMMANDS = "team,admin,config";

    const authService = new AdminAuthorizationService();

    // Test authorization for non-admin commands
    expect(authService.isAuthorized("U12345", "help")).toBe(true);
    expect(authService.isAuthorized("U67890", "status")).toBe(true);
    expect(authService.isAuthorized("U99999", "help")).toBe(true);
  });
});
