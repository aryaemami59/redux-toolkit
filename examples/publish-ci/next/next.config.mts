import type { NextConfig } from 'next'

const nextConfig = {
  reactStrictMode: true,

  turbopack: {
    root: import.meta.dirname,
  },

  typescript: {
    tsconfigPath: './tsconfig.json',
  },
} as const satisfies NextConfig

export default nextConfig
