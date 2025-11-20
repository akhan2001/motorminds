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
    const pathOnly = relativePath.split('?')[0];
    
    // Build the string to sign according to MOTOR spec
    const stringToSign = [
      this.publicKey,
      httpVerb.toUpperCase(),
      epoch.toString(),
      pathOnly // Use path without query params
    ].join('\n');

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[MOTOR Auth] === Signature Generation ===');
      console.log('[MOTOR Auth] String to sign:');
      console.log(stringToSign);
      console.log('[MOTOR Auth] ---');
    }

    // Create HMAC-SHA256 hash using private key
    // Match debug script: pass private key as string directly
    const hmac = createHmac('sha256', this.privateKey);
    hmac.update(stringToSign, 'ascii');
    
    // Return base64-encoded signature
    const signature = hmac.digest('base64');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[MOTOR Auth] Signature:', signature);
      console.log('[MOTOR Auth] Signature URL encoded:', encodeURIComponent(signature));
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
    const pathForSigning = signingPath || pathOnly;
    
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
    if (existingQuery) {
      const existingParams = new URLSearchParams(existingQuery);
      existingParams.forEach((value, key) => {
        url.searchParams.append(key, value);
      });
    }
    
    // Append authentication parameters to query string (these go last)
    // Per MOTOR documentation: Signature must be URL encoded for query string
    // Order: Scheme, XDate, ApiKey, Sig
    const separator = url.search ? '&' : '?';
    const encodedSig = encodeURIComponent(authParams.Sig);
    const authQuery = `${separator}Scheme=${authParams.Scheme}&XDate=${authParams.XDate}&ApiKey=${authParams.ApiKey}&Sig=${encodedSig}`;
    url.search += authQuery;

    if (process.env.NODE_ENV === 'development') {
      console.log('[MOTOR Auth] Final URL (sig hidden):', url.toString().replace(/Sig=[^&]+/, 'Sig=***'));
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
