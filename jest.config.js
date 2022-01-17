module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: "test/tsconfig.test.json",
    },
  },
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testMatch: ["**/test/**/*.test.(ts|js)"],
  testEnvironment: "node",
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],
};
