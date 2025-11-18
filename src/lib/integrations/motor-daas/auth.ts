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
     */
    buildAuthenticatedUrl(baseUrl: string, relativePath: string, httpVerb: string = 'GET'): string {
        const params = this.generateQueryParams(httpVerb, relativePath);
        const url = new URL(relativePath, baseUrl);

        // Append authentication parameters to query string
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