import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["out/**", ".next/**", "node_modules/**", "next-env.d.ts", "public/sw.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  { files: ["scripts/**/*.{js,cjs,mjs}"], languageOptions: { globals: { process: "readonly", console: "readonly", require: "readonly" } }, rules: { "@typescript-eslint/no-require-imports": "off" } },
);
