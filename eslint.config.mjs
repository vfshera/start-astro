import * as astroParser from "astro-eslint-parser";
import tseslint from "typescript-eslint";
import astroPlugin from "eslint-plugin-astro";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: ["dist", ".astro", "pnpm-lock.yaml", "bun.lock"],
  },
  astroPlugin.configs.recommended,
  tseslint.configs.recommended,
  stylistic.configs.recommended,
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },

      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: process.cwd(),
      },
    },
  },
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".astro"],
      },
    },
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    rules: {
      "no-console": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "all",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@stylistic/padding-line-between-statements": [
        "warn",

        // Imports
        {
          blankLine: "always",
          prev: "import",
          next: "*",
        },
        {
          blankLine: "any",
          prev: "import",
          next: "import",
        },

        // Blank line before exports
        {
          blankLine: "always",
          prev: "*",
          next: "export",
        },

        // Blank line after exports
        {
          blankLine: "always",
          prev: "export",
          next: "*",
        },

        // Types/interfaces
        {
          blankLine: "always",
          prev: ["type", "interface"],
          next: "*",
        },
        {
          blankLine: "any",
          prev: ["type", "interface"],
          next: ["type", "interface"],
        },
        {
          blankLine: "always",
          prev: "*",
          next: ["type", "interface"],
        },

        // Functions
        {
          blankLine: "always",
          prev: "function",
          next: "function",
        },

        // After block-like statements
        {
          blankLine: "always",
          prev: "block-like",
          next: "*",
        },
        {
          blankLine: "any",
          prev: "block-like",
          next: "block-like",
        },

        // Before return
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },

        // Before throw
        {
          blankLine: "always",
          prev: "*",
          next: "throw",
        },
      ],
    },
  },
  eslintConfigPrettier,
);
