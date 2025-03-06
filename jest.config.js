// jest.config.js - Updated for CI/CD performance
module.exports = {
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "test/tsconfig.test.json",
      },
    ],
  },
  testMatch: ["**/test/**/*.test.(ts|js)"],
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  reporters: ["default", "jest-junit"],

  // Add these settings to reduce memory usage
  maxWorkers: 2, // Limits parallel test execution
  maxConcurrency: 5, // Limits async operations
  testTimeout: 30000, // Increases timeout to 30 seconds
  forceExit: true, // Forces Jest to exit after tests complete
  detectOpenHandles: true, // Helps identify resource leaks

  // Add this to divide tests into smaller batches if needed
  // Silent version for CI
  silent: process.env.CI === "true", // Reduces console output in CI
};
