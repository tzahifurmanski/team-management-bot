export default {
  presets: [
    // Add your existing presets if you have them, otherwise,
    // you might need '@babel/preset-env' for general compatibility
    // and potentially '@babel/preset-typescript' if ts-jest isn't handling all TS syntax
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript", // If needed
  ],
  plugins: [
    // Add the new plugin
    "@babel/plugin-syntax-import-attributes",
    // Add any other Babel plugins you use
  ],
};
