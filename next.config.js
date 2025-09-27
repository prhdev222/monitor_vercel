/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove env config that's causing build issues
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
}

module.exports = nextConfig
