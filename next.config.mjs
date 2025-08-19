/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'net', 'tls', 'crypto' modules on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        querystring: false,
        zlib: false,
        http: false,
        https: false,
        buffer: false,
        timers: false,
        punycode: false,
        stringDecoder: false,
      }
      
      // Exclude MongoDB and related modules from client bundle
      config.externals = config.externals || []
      config.externals.push({
        'mongodb': 'commonjs mongodb',
        '@mongodb-js/zstd': 'commonjs @mongodb-js/zstd',
        'snappy': 'commonjs snappy',
        'kerberos': 'commonjs kerberos',
        'bson-ext': 'commonjs bson-ext',
        '@aws-sdk/credential-providers': 'commonjs @aws-sdk/credential-providers',
        'gcp-metadata': 'commonjs gcp-metadata',
        'socks': 'commonjs socks',
        'aws4': 'commonjs aws4',
        'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
      })
      
      // Exclude server-only modules from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/mongodb': false,
        '@/lib/products': false,
        '@/lib/sales': false,
        '@/lib/auth': false,
      }
    }
    
    return config
  },
  experimental: {
    serverComponentsExternalPackages: [
      'mongodb',
      '@mongodb-js/zstd',
      'snappy',
      'kerberos',
      'bson-ext',
      'bcryptjs',
      'jsonwebtoken'
    ]
  }
}

export default nextConfig
