// src/lib/integrations/motor-daas/client.ts

import { MotorDaasAuth, MotorAuthConfig } from './auth';

export interface MotorApiResponse<T> {
    Body?: T;
    Header?: {
        StatusCode?: number;
        Messages?: Array<{ Type: string; Code?: string; ShortDescription?: string; LongDescription?: string }>;
        Status?: string;
    };
}

export class MotorDaasClient {
    private auth: MotorDaasAuth;
    private baseUrl: string;

    constructor(config: MotorAuthConfig) {
        this.auth = new MotorDaasAuth(config);
        this.baseUrl = config.baseUrl || 'https://api.motor.com/v1';
    }

    /**
     * Simple HelloWorld test
     * Endpoint: /v1/Getting/Started/HelloWorld
     */
    async helloWorld(correlationId?: string): Promise<{ Text: string }> {
        const uriPath = '/v1/Getting/Started/HelloWorld';
        const url = new URL(`${this.baseUrl}/Getting/Started/HelloWorld`);
        
        // Use query string authentication (works in browsers)
        const authParams = this.auth.buildAuthQueryParams('GET', uriPath);
        authParams.forEach((value, key) => {
            url.searchParams.set(key, value);
        });

        // Add correlation ID if provided
        if (correlationId) {
            url.searchParams.set('xcorrelationid', correlationId);
        }
        
        const headers: HeadersInit = {
            'Accept': 'application/json'
        };

        // Add correlation ID header if provided
        if (correlationId) {
            headers['X-CorrelationID'] = correlationId;
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            await this.handleError(response);
        }

        const data: MotorApiResponse<{ Text: string }> = await response.json();
        
        // Extract Body if wrapped
        return data.Body || data as any;
    }

    /**
     * Make authenticated request with query string auth
     */
    async request<T>(
        endpoint: string,
        method: string = 'GET',
        queryParams?: Record<string, string>,
        correlationId?: string
    ): Promise<T> {
        // Ensure endpoint starts with /v1
        const uriPath = endpoint.startsWith('/v1') ? endpoint : `/v1${endpoint}`;
        const url = new URL(`${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);

        // Add authentication query params
        const authParams = this.auth.buildAuthQueryParams(method, uriPath);
        authParams.forEach((value, key) => {
            url.searchParams.set(key, value);
        });

        // Add custom query params
            if (queryParams) {
                Object.entries(queryParams).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }

        // Add correlation ID
        if (correlationId) {
            url.searchParams.set('xcorrelationid', correlationId);
        }

        const headers: HeadersInit = {
            'Accept': 'application/json'
        };

        if (correlationId) {
            headers['X-CorrelationID'] = correlationId;
        }

        const response = await fetch(url.toString(), {
            method,
            headers
        });

            if (!response.ok) {
            await this.handleError(response);
        }

        const data: MotorApiResponse<T> = await response.json();
        return (data.Body !== undefined ? data.Body : data) as T;
    }

    private async handleError(response: Response): Promise<never> {
        let errorMessage = `MOTOR API error: ${response.status}`;
        let errorCode = 'API_ERROR';

        try {
            const errorData: MotorApiResponse<unknown> = await response.json();
            
            if (errorData.Header?.Messages) {
                const errors = errorData.Header.Messages.filter(m => m.Type === 'Error');
                if (errors.length > 0) {
                    errorMessage = errors[0].LongDescription || errors[0].ShortDescription || errorMessage;
                    errorCode = errors[0].Code || errorCode;
                }
            }
        } catch {
            // Not JSON, use default
        }

        // User-friendly error messages
        if (response.status === 401) {
            errorMessage = 'Authentication failed. Check your MOTOR DaaS credentials and signature.';
            errorCode = 'AUTH_FAILED';
        } else if (response.status === 429) {
            errorMessage = 'Rate limit exceeded. 1500 requests per 15 minutes allowed.';
            errorCode = 'RATE_LIMIT_EXCEEDED';
        } else if (response.status === 403) {
            errorMessage = 'Access forbidden. Check timestamp is within 15 minutes.';
            errorCode = 'FORBIDDEN';
        }

        const error = new Error(errorMessage) as Error & { statusCode: number; errorCode: string };
        error.statusCode = response.status;
        error.errorCode = errorCode;
        throw error;
    }
}
