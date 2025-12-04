let userConfig = undefined
try {
	userConfig = await import('./v0-user-next.config')
} catch (e) {
	// ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Handle CORS for Vercel deployments
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'Access-Control-Allow-Credentials', value: 'true' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
					{ key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
				],
			},
		]
	},
	eslint: {
		ignoreDuringBuilds: false,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
	experimental: {
		webpackBuildWorker: true,
		parallelServerBuildTraces: true,
		parallelServerCompiles: true,
		optimizeCss: true, // Optimize CSS loading
	},
	// Optimize CSS loading
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production',
	},
	// Optimize static assets
	staticPageGenerationTimeout: 120,
	// Optimize CSS chunks
	webpack: (config, { dev, isServer }) => {
		if (!dev && !isServer) {
			// Optimize CSS loading in production
			config.optimization.splitChunks.cacheGroups.styles = {
				name: 'styles',
				test: /\.(css|scss)$/,
				chunks: 'all',
				enforce: true,
			}
		}
		return config
	},
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
	if (!userConfig) {
		return
	}

	for (const key in userConfig) {
		if (
			typeof nextConfig[key] === 'object' &&
			!Array.isArray(nextConfig[key])
		) {
			nextConfig[key] = {
				...nextConfig[key],
				...userConfig[key],
			}
		} else {
			nextConfig[key] = userConfig[key]
		}
	}
}

export default nextConfig
