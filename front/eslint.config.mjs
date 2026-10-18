import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextVitals,
  { ignores: ["**/$path.ts", "**/$api.ts"] },
];
