import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "no-undef": "warn",
    },
  },
  {
    ignores: [
      "node_modules/",
      "public/",
      ".env",
      "dist/",
      "build/",
      "tailwind.config.js",
      "postcss.config.js",
      "**/*.ejs", // Explicitly ignore EJS in ESLint to avoid parsing errors
    ],
  },
];
