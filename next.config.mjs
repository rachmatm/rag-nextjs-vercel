/** @type {import('next').NextConfig} */
const nextConfig = {
  // The MCP route uses the Node.js runtime and the Neon serverless driver.
  serverExternalPackages: ["@neondatabase/serverless"],
};

export default nextConfig;
