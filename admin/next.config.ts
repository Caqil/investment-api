
  // next.config.js
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['localhost'], // Add your API domain here
    },
    env: {
      // Environment variables to be used client-side
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_API_TOKEN_KEY: process.env.NEXT_PUBLIC_API_TOKEN_KEY,
    },
  }
  
  module.exports = nextConfig