/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  serverExternalPackages: ["@ark-ui/react", "@zag-js/anatomy"],
}
