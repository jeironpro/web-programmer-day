import js from "@eslint/js";
import tseslint from "typescript-eslint";

// ESLint plano (v9): recomendaciones de JS + TS sin reglas con opiniones
export default tseslint.config(
  { ignores: ["dist/", "node_modules/", ".yarn/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
