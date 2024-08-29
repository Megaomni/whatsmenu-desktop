const path = require('path')
/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/api/printLayoutPDF',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
      {
        source: '/api/printLayout',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
      {
        // matching all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard/request',
        permanent: false,
      },
      {
        source: '/',
        destination: 'https://adm.whatsmenu.com.br',
        permanent: false,
      },
      {
        source: '/paghiper',
        destination: `${process.env.WHATSMENU_API}/paghiper`,
        permanent: false,
      },
      {
        source: '/pizzas/1.jpg',
        destination: 'https://api2.whatsmenu.com.br/pizzas/1.jpg',
        permanent: true,
      },
      {
        source: '/pizzas/2.jpg',
        destination: 'https://api2.whatsmenu.com.br/pizzas/2.jpg',
        permanent: true,
      },
      {
        source: '/pizzas/3.jpg',
        destination: 'https://api2.whatsmenu.com.br/pizzas/3.jpg',
        permanent: true,
      },
      {
        source: '/pizzas/4.jpg',
        destination: 'https://api2.whatsmenu.com.br/pizzas/4.jpg',
        permanent: true,
      },
    ]
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  images: {
    domains: ['s3.us-west-2.amazonaws.com'],
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  env: {
    WHATSMENU_API: process.env.WHATSMENU_API,
    WHATSMENU_API_V3: process.env.WHATSMENU_API_V3,
    WHATSMENU_BASE_URL: process.env.WHATSMENU_BASE_URL,
    BASE_URL: process.env.NEXTAUTH_URL,
    CANONICAL_URL: process.env.CANONICAL_URL,
    WS_SOCKET_API: process.env.WS_SOCKET_API,
    PAGARME_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAGARME_KEY,
    ASAAS_DASHBOARD_URL: process.env.ASAAS_DASHBOARD_URL,
  },
  // webpack5: true,
  // webpack: (config) => {
  //   config.resolve.fallback = { fs: false };

  //   return config;
  // },
  // "beta.whatsmenu.com.br"
  // webpack: (config, options) => {
  //   config.module.rules.push({
  //     test: /\.mp3/,
  //     use: [
  //       options.defaultLoaders.babel,
  //       {
  //         loader: 'file-loader',
  //         options: {
  //           name: '[path][name].[ext]',
  //         }
  //       },
  //     ],
  //   })

  //   return config
  // }
}
 
module.exports = nextConfig
