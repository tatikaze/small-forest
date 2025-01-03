import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  {
    ignores: ["**/$path.ts"],
  },
  ...compat.config({
    extends: ["eslint:recommended", "next", "next/core-web-vitals"],
    rules: {
      "react/react-in-jsx-scope": "off", // React のインポートが不要なことをESLintに伝える
    },
  }),
];

export default eslintConfig;
