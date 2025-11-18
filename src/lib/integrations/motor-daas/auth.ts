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
     * Based on MOTOR DaaS documentation authentication requirements
     */
    generateSignature(
        httpVerb: string,
        relativePath: string,
        epoch: number
    ): string {
        // Build the string to sign according to MOTOR spec
        const stringToSign = [
            this.publicKey,
            httpVerb.toUpperCase(),
            epoch.toString(),
            relativePath
        ].join('\n');

        // Create HMAC-SHA256 hash using private key
        const hmac = createHmac('sha256', this.privateKey);
        hmac.update(stringToSign, 'ascii');

        // Return base64-encoded signature
        return hmac.digest('base64');
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

        // Generate signature
        const signature = this.generateSignature(httpVerb, relativePath, epoch);

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
     * @param signingPath - Path to use for signature generation (should include /v1/)
     */
    buildAuthenticatedUrl(baseUrl: string, relativePath: string, httpVerb: string = 'GET', signingPath?: string): string {
        // Use signingPath for signature if provided, otherwise use relativePath (without query params)
        // Extract pathname and query string separately
        const pathParts = relativePath.split('?');
        const pathOnly = pathParts[0];
        const existingQuery = pathParts[1] || '';
        
        // For signing, use the path only (no query params) - query params are NOT included in signature
        const pathForSigning = signingPath || pathOnly;
        const params = this.generateQueryParams(httpVerb, pathForSigning);
        
        // Construct URL properly - if baseUrl has a pathname and pathOnly starts with /,
        // we need to append pathOnly to baseUrl's pathname, not replace it
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
            // If pathOnly doesn't start with /, append to baseUrl pathname
            const basePath = baseUrlObj.pathname.endsWith('/') 
                ? baseUrlObj.pathname 
                : `${baseUrlObj.pathname}/`;
            fullPath = `${basePath}${pathOnly}`;
        }
        
        // Build the full URL
        const url = new URL(fullPath, baseUrlObj.origin);

        // Add existing query parameters first (if any)
        if (existingQuery) {
            const existingParams = new URLSearchParams(existingQuery);
            existingParams.forEach((value, key) => {
                url.searchParams.append(key, value);
            });
        }

        // Append authentication parameters to query string (these go last)
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return url.toString();
    }

    /**
     * Extract relative path from full URL
     * Removes protocol, domain, and query string
     */
    getRelativePath(fullUrl: string, baseUrl: string): string {
        const url = new URL(fullUrl, baseUrl);
        return url.pathname;
    }

    /**
     * Verify credentials are configured
     */
    isConfigured(): boolean {
        return !!(this.publicKey && this.privateKey);
    }
}