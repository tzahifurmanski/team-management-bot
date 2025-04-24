import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { DataSource } from "typeorm";
import {
  initializeDatabase,
  AppDataSource,
} from "../../src/database/connection.js";
import { logger } from "../../src/settings/server_consts.js";

// Create spies for the logger functions
const infoSpy = jest.spyOn(logger, "info").mockImplementation(() => logger);
const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => logger);

// Create a spy for AppDataSource.initialize
const initializeSpy = jest.spyOn(AppDataSource, "initialize");

describe("Database Connection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AppDataSource state
    Object.defineProperty(AppDataSource, "isInitialized", {
      get: jest.fn(() => false),
      configurable: true,
    });

    // Set up the initialize spy to resolve by default
    initializeSpy.mockResolvedValue(AppDataSource);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should initialize database successfully", async () => {
    const result = await initializeDatabase();
    expect(result).toBe(true);
    expect(infoSpy).toHaveBeenCalledWith(
      "Database connection established successfully",
    );
  });

  it("should handle initialization error", async () => {
    const mockError = new Error("Connection failed");
    initializeSpy.mockRejectedValue(mockError);

    const result = await initializeDatabase();
    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to connect to database:",
      mockError,
    );
  });

  it("should not reinitialize if already initialized", async () => {
    Object.defineProperty(AppDataSource, "isInitialized", {
      get: jest.fn(() => true),
      configurable: true,
    });

    const result = await initializeDatabase();
    expect(result).toBe(true);
    expect(initializeSpy).not.toHaveBeenCalled();
  });
});
