import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let userConfig = undefined
try {
	userConfig = await import('./v0-user-next.config')
} catch (e) {
	// ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
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

		// Ensure @ai-sdk/provider always resolves to the root package,
		// avoiding partial scoped installs under @ai-sdk/gateway/node_modules
		config.resolve = config.resolve || {}
		config.resolve.alias = {
			...(config.resolve.alias || {}),
			'@ai-sdk/provider': path.join(
				__dirname,
				'node_modules',
				'@ai-sdk',
				'provider',
				'dist',
				'index.mjs'
			),
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
