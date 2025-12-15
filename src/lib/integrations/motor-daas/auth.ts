// src/lib/integrations/motor-daas/auth.ts

import { createHmac } from 'crypto';

export interface MotorAuthConfig {
    publicKey: string;
    privateKey: string;
    baseUrl?: string;
}

export class MotorDaasAuth {
    private publicKey: string;
    private privateKey: string;

    constructor(config: MotorAuthConfig) {
        this.publicKey = config.publicKey;
        this.privateKey = config.privateKey;
    }

    /**
     * Generate HMAC-SHA256 signature
     * Format: PublicKey\nHTTPVerb\nEpoch\nURIPath
     */
    generateSignature(httpVerb: string, uriPath: string, epoch: number): string {
        const signatureData = [
            this.publicKey,
            httpVerb.toUpperCase(),
            epoch.toString(),
            uriPath
        ].join('\n');

        const hmac = createHmac('sha256', this.privateKey);
        hmac.update(signatureData, 'utf8');
        return hmac.digest('base64');
    }

    /**
     * URL encode signature for query string
     * + becomes %2B, / becomes %2F, = becomes %3D
     */
    urlEncodeSignature(signature: string): string {
        return signature
            .replace(/\+/g, '%2B')
            .replace(/\//g, '%2F')
            .replace(/=/g, '%3D');
    }

    /**
     * Build Authorization header
     * Format: Shared PublicKey:Signature
     */
    buildAuthHeader(httpVerb: string, uriPath: string): { Authorization: string; 'X-Date': string } {
        const epoch = Math.floor(Date.now() / 1000);
        const signature = this.generateSignature(httpVerb, uriPath, epoch);
        
        return {
            Authorization: `Shared ${this.publicKey}:${signature}`,
            'X-Date': epoch.toString()
        };
    }

    /**
     * Build query string authentication parameters
     * Format: ApiKey=...&Sig=...&Scheme=Shared&XDate=...
     */
    buildAuthQueryParams(httpVerb: string, uriPath: string): URLSearchParams {
        const epoch = Math.floor(Date.now() / 1000);
        const signature = this.generateSignature(httpVerb, uriPath, epoch);
        const encodedSig = this.urlEncodeSignature(signature);

        const params = new URLSearchParams();
        params.set('ApiKey', this.publicKey);
        params.set('Sig', encodedSig);
        params.set('Scheme', 'Shared');
        params.set('XDate', epoch.toString());

        return params;
    }
}
