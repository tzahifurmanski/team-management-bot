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
};
