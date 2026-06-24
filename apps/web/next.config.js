/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@whyme/shared"],
}

module.exports = nextConfig
