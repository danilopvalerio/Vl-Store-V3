import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // 1. Pastas para ignorar (antigo .eslintignore)
  {
    ignores: ["node_modules", "dist", "build", "generated", "**/*.js"],
  },

  // 2. Configurações globais (Node.js)
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // 3. Configurações recomendadas (Base JS + TypeScript)
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // 4. Suas regras personalizadas (proibindo any)
  {
    files: ["**/*.ts"],
    rules: {
      // 🚫 Erro se usar 'any'
      "@typescript-eslint/no-explicit-any": "error",

      // ⚠️ Aviso se declarar variável e não usar (ignora se começar com _)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_", // variáveis iniciadas com _
          argsIgnorePattern: "^_", // parâmetros iniciados com _
          caughtErrorsIgnorePattern: "^_", // erros em catch iniciados com _
        },
      ],

      // Opcional: Desativa a regra que obriga 'const' se vc preferir 'let'
      "prefer-const": "warn",
    },
  },
];
