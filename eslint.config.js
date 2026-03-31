import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Archivos que ESLint nunca debe tocar
  globalIgnores([
    "dist",
    "node_modules",
    "public/mockServiceWorker.js", // generado por MSW
    "playwright-report",
    "test-results",
  ]),

  // ─── Código fuente ──────────────────────────────────────────────────────────
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      // Variables sin usar — ignoramos las que empiezan por _ o mayúscula
      // _ es convención para "ignorado intencionalmente" (ej: catch(_err))
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^[A-Z_]",
          argsIgnorePattern: "^_",
        },
      ],

      // console.log está bien en desarrollo pero no debe llegar a producción.
      // warn en vez de error para no bloquear pero sí recordarlo
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // prop-types no tiene sentido sin TypeScript
      "react/prop-types": "off",
    },
  },

  // ─── Tests unitarios e integración (Vitest) ────────────────────────────────
  {
    files: ["src/tests/unit/**", "src/tests/integration/**"],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Globals de Vitest — sin esto ESLint marca describe/it/expect como undefined
        ...(globals.vitest ?? {
          describe: "readonly",
          it: "readonly",
          test: "readonly",
          expect: "readonly",
          beforeEach: "readonly",
          afterEach: "readonly",
          beforeAll: "readonly",
          afterAll: "readonly",
          vi: "readonly",
        }),
      },
    },
    rules: {
      // En tests los console.log son útiles para depurar — los permitimos
      "no-console": "off",
    },
  },

  // ─── Tests E2E (Playwright) ────────────────────────────────────────────────
  {
    files: ["src/tests/e2e/**"],
    languageOptions: {
      globals: {
        ...globals.node, // Playwright corre en Node
      },
    },
    rules: {
      "no-console": "off",
    },
  },
]);
