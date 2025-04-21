// jest.config.js - Updated for CI/CD performance
export default {
  preset: "ts-jest/presets/default-esm", // Use the ESM preset
  moduleNameMapper: {
    // This regex tells Jest: if an import path starts with ./ or ../
    // and ends with .js, try resolving it without the .js extension
    // (Jest will then automatically look for .ts, .tsx, .d.ts etc.)
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "./test/tsconfig.test.json",
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  testMatch: ["**/test/**/*.test.(ts|js)"],
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  reporters: ["default", "jest-junit"],

  // Add these settings to reduce memory usage
  maxWorkers: 2, // Limits parallel test execution
  testTimeout: 30000, // Increases timeout to 30 seconds
  forceExit: true, // Forces Jest to exit after tests complete
  detectOpenHandles: true, // Helps identify resource leaks
  // Silent version for CI
  silent: process.env.CI === "true", // Reduces console output in CI
};
