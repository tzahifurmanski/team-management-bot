// eslint.config.js
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // Global ignores
  {
    ignores: ["node_modules/", "dist/"], // Add other ignored paths like build outputs
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript specific configurations
  // This replaces 'plugin:@typescript-eslint/recommended', parser, and plugin settings
  ...tseslint.configs.recommended,

  // Configuration for all JS/TS files
  {
    languageOptions: {
      ecmaVersion: "latest", // Equivalent to your previous setting
      sourceType: "module", // Equivalent to your previous setting
      globals: {
        ...globals.node, // Adds Node.js globals
        ...globals.browser, // Adds browser globals
        ...globals.jest,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },

  // eslint-config-prettier is added last, and turns off all rules that are unnecessary or might conflict with Prettier.
  eslintConfigPrettier,
);
