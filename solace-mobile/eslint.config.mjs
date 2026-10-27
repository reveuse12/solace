import config from "../eslint.config.mjs";

export default [
  ...config,
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
  // The native test harness loads transpiled code with a controlled CommonJS loader.
  { files: ["tests/**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
];
