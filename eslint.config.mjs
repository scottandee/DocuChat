import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nodePlugin from "eslint-plugin-n";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  nodePlugin.configs["flat/recommended"],

  {
    files: ["src/**/*.ts"],

    languageOptions: {
      parser: tseslint.parser,
    },

    rules: {
      "no-console": "off",
      "n/no-missing-import": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],

      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  {
    ignores: ["dist/", "build/", "node_modules/",],
  },
);