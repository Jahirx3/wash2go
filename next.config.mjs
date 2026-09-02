/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ohmlyxebtnorlnmodwyi.supabase.co'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
