// src/lib/integrations/motor-daas/auth.ts

import { createHmac } from 'crypto';
import { MotorAuthConfig, MotorRequestParams } from './types';

export class MotorDaasAuth {
	private publicKey: string;
	private privateKey: string;

	constructor(config: MotorAuthConfig) {
		this.publicKey = config.publicKey;
		this.privateKey = config.privateKey;
	}

	/**
	 * Generate HMAC-SHA256 signature for MOTOR DaaS API request
	 * Format: {PUBLIC_KEY}\n{HTTP_VERB}\n{EPOCH}\n{RELATIVE_PATH}
	 * 
	 * CRITICAL: relativePath MUST NOT include query parameters
	 * 
	 * Based on MOTOR DaaS documentation authentication requirements
	 */
	generateSignature(
		httpVerb: string,
		relativePath: string,
		epoch: number
	): string {
		// IMPORTANT: Remove any query parameters from the path
		// The signature is generated using ONLY the path portion
		// Also normalize the path - ensure it starts with / and has no double slashes
		let pathOnly = relativePath.split('?')[0];

		// Normalize path: ensure it starts with / and remove any double slashes (except after protocol)
		if (!pathOnly.startsWith('/')) {
			pathOnly = '/' + pathOnly;
		}
		// Replace multiple consecutive slashes with single slash (but preserve // after ://)
		pathOnly = pathOnly.replace(/([^:]\/)\/+/g, '$1');

		// Build the string to sign according to MOTOR spec
		// Format: {PUBLIC_KEY}\n{HTTP_VERB}\n{EPOCH}\n{RELATIVE_PATH}
		const stringToSign = [
			this.publicKey,
			httpVerb.toUpperCase(),
			epoch.toString(),
			pathOnly // Use path without query params
		].join('\n');

		// Debug logging in development
		if (process.env.NODE_ENV === 'development') {
			console.log('[MOTOR Auth] === Signature Generation ===');
			console.log('[MOTOR Auth] Input path:', relativePath);
			console.log('[MOTOR Auth] Normalized path for signing:', pathOnly);
			console.log('[MOTOR Auth] HTTP Verb:', httpVerb.toUpperCase());
			console.log('[MOTOR Auth] Epoch:', epoch);
			console.log('[MOTOR Auth] Public Key:', this.publicKey);
			console.log('[MOTOR Auth] String to sign (with \\n separators):');
			console.log(stringToSign);
			console.log('[MOTOR Auth] String to sign (escaped for display):');
			console.log(stringToSign.replace(/\n/g, '\\n'));
		}

		// Create HMAC-SHA256 hash using private key
		// The private key should be passed as a string (not Buffer)
		if (!this.privateKey) {
			throw new Error('MOTOR DaaS private key is not configured');
		}

		if (process.env.NODE_ENV === 'development') {
			console.log('[MOTOR Auth] Private key length:', this.privateKey.length);
			console.log('[MOTOR Auth] Private key (first 10 chars):', this.privateKey.substring(0, 10) + '...');
		}

		const hmac = createHmac('sha256', this.privateKey);
		// Update with the string to sign using ASCII encoding
		hmac.update(stringToSign, 'ascii');

		// Return base64-encoded signature
		const signature = hmac.digest('base64');

		if (process.env.NODE_ENV === 'development') {
			console.log('[MOTOR Auth] Signature (base64):', signature);
			console.log('[MOTOR Auth] Signature (URL encoded):', encodeURIComponent(signature));
			console.log('[MOTOR Auth] === End Signature Generation ===');
		}

		return signature;
	}

	/**
	 * Generate query string parameters for authenticated request
	 * Creates the required query parameters: Scheme, XDate, ApiKey, Sig
	 */
	generateQueryParams(
		httpVerb: string,
		relativePath: string
	): MotorRequestParams {
		// Get current epoch time (seconds since Unix epoch)
		const epoch = Math.floor(Date.now() / 1000);

		// Generate signature using path WITHOUT query parameters
		const pathOnly = relativePath.split('?')[0];
		const signature = this.generateSignature(httpVerb, pathOnly, epoch);

		// Return query parameters as specified by MOTOR API
		return {
			Scheme: 'Shared',
			XDate: epoch.toString(),
			ApiKey: this.publicKey,
			Sig: signature
		};
	}

	/**
	 * Build full URL with authentication parameters
	 * Appends auth query params to the URL
	 * @param baseUrl - Base URL (e.g., https://api.motor.com/v1)
	 * @param relativePath - Actual path for the URL (e.g., /Information/...)
	 * @param httpVerb - HTTP method (GET, POST, etc.)
	 * @param signingPath - Optional path to use for signature generation (should include /v1/)
	 */
	buildAuthenticatedUrl(
		baseUrl: string,
		relativePath: string,
		httpVerb: string = 'GET',
		signingPath?: string
	): string {
		// Extract path without query params for URL construction
		const pathParts = relativePath.split('?');
		const pathOnly = pathParts[0];
		const existingQuery = pathParts[1] || '';

		// For signing, use signingPath if provided, otherwise use pathOnly
		// signingPath should include /v1/ prefix if needed
		// Normalize the signing path to ensure it's correct
		let pathForSigning = signingPath || pathOnly;

		// Ensure signing path starts with / and normalize slashes
		if (!pathForSigning.startsWith('/')) {
			pathForSigning = '/' + pathForSigning;
		}
		// Replace multiple consecutive slashes with single slash
		pathForSigning = pathForSigning.replace(/([^:]\/)\/+/g, '$1');

		// Generate auth params using the signing path
		const authParams = this.generateQueryParams(httpVerb, pathForSigning);

		// Build full URL - handle baseUrl with pathname (e.g., /v1)
		const baseUrlObj = new URL(baseUrl);
		let fullPath = pathOnly;

		// If baseUrl has a pathname (e.g., /v1) and pathOnly starts with /,
		// combine them properly
		if (baseUrlObj.pathname && baseUrlObj.pathname !== '/' && pathOnly.startsWith('/')) {
			const basePath = baseUrlObj.pathname.endsWith('/')
				? baseUrlObj.pathname.slice(0, -1)
				: baseUrlObj.pathname;
			fullPath = `${basePath}${pathOnly}`;
		} else if (!pathOnly.startsWith('/')) {
			const basePath = baseUrlObj.pathname.endsWith('/')
				? baseUrlObj.pathname
				: `${baseUrlObj.pathname}/`;
			fullPath = `${basePath}${pathOnly}`;
		}

		// Build the URL object
		const url = new URL(fullPath, baseUrlObj.origin);

    // Add existing query parameters first (if any)
    // Use URLSearchParams to properly encode values
    if (existingQuery) {
      const existingParams = new URLSearchParams(existingQuery);
      existingParams.forEach((value, key) => {
        // URLSearchParams automatically encodes values, but we need to be careful
        // to not double-encode. Since we're using URLSearchParams, it handles encoding.
        url.searchParams.append(key, value);
      });
    }
    
    // Append authentication parameters to query string (these go last)
    // Per MOTOR documentation: Signature must be URL encoded for query string
    // The signature is Base64 encoded and may contain +, /, = which need special encoding:
    // + → %2B, / → %2F, = → %3D
    // encodeURIComponent handles these automatically
    // Order per documentation example: ApiKey, Sig, Scheme, XDate
    const encodedSig = encodeURIComponent(authParams.Sig);
    
    // Build auth query string manually to ensure correct order and encoding
    // We can't use URLSearchParams.append() as it doesn't preserve order and might double-encode
    // Manual construction ensures exact format MOTOR expects
    const authParamsStr = [
        `ApiKey=${encodeURIComponent(authParams.ApiKey)}`,
        `Sig=${encodedSig}`,
        `Scheme=${encodeURIComponent(authParams.Scheme)}`,
        `XDate=${authParams.XDate}`
    ].join('&');
    
    // Append auth params to existing query string
    // Use manual string concatenation to avoid double-encoding issues
    if (url.search) {
        url.search += '&' + authParamsStr;
    } else {
        url.search = '?' + authParamsStr;
    }
    
    // Verify the final URL structure in development
    if (process.env.NODE_ENV === 'development') {
      const finalUrl = url.toString();
      const sigMatch = finalUrl.match(/Sig=([^&]+)/);
      if (sigMatch) {
        const sigInUrl = sigMatch[1];
        console.log('[MOTOR Auth] Signature in URL:', sigInUrl);
        console.log('[MOTOR Auth] Expected signature:', encodedSig);
        console.log('[MOTOR Auth] Signatures match:', sigInUrl === encodedSig);
      }
    }

		if (process.env.NODE_ENV === 'development') {
			console.log('[MOTOR Auth] === URL Construction ===');
			console.log('[MOTOR Auth] Base URL:', baseUrl);
			console.log('[MOTOR Auth] Relative Path:', relativePath);
			console.log('[MOTOR Auth] Signing Path:', pathForSigning);
			console.log('[MOTOR Auth] Epoch:', authParams.XDate);
			console.log('[MOTOR Auth] Public Key:', authParams.ApiKey);
			console.log('[MOTOR Auth] Signature (raw):', authParams.Sig);
			console.log('[MOTOR Auth] Signature (URL encoded):', encodedSig);
			console.log('[MOTOR Auth] Final URL (sig hidden):', url.toString().replace(/Sig=[^&]+/, 'Sig=***'));
			console.log('[MOTOR Auth] Full URL:', url.toString());
		}

		return url.toString();
	}

	/**
	 * Extract relative path from full URL
	 * Removes protocol, domain, but keeps query string
	 */
	getRelativePath(fullUrl: string, baseUrl: string): string {
		const url = new URL(fullUrl, baseUrl);
		return url.pathname + url.search;
	}

	/**
	 * Verify credentials are configured
	 */
	isConfigured(): boolean {
		return !!(this.publicKey && this.privateKey);
	}
}
