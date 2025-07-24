import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(req: Request) {
    try {
        // Check environment configuration
        const debugInfo = {
            hasApiKey: !!config.docuseal.apiKey,
            apiKeyLength: config.docuseal.apiKey ? config.docuseal.apiKey.length : 0,
            apiKeyStart: config.docuseal.apiKey ? config.docuseal.apiKey.substring(0, 8) + '...' : 'none',
            apiUrl: config.docuseal.apiUrl,
            baseUrl: config.docuseal.baseUrl,
            appBaseUrl: config.app.baseUrl
        };

        // Test API connectivity
        if (!config.docuseal.apiKey) {
            return NextResponse.json({
                ...debugInfo,
                error: 'DOCUSEAL_API_KEY not configured',
                status: 'missing_api_key'
            });
        }

        // Try to hit DocuSeal API to check authentication
        const testResponse = await fetch(`${config.docuseal.apiUrl}/templates`, {
            method: 'GET',
            headers: {
                'X-Auth-Token': config.docuseal.apiKey,
                'Content-Type': 'application/json'
            }
        });

        const testResult: any = {
            ...debugInfo,
            apiTest: {
                status: testResponse.status,
                statusText: testResponse.statusText,
                ok: testResponse.ok
            }
        };

        if (!testResponse.ok) {
            const errorText = await testResponse.text();
            testResult.apiTest.error = errorText;
            
            // Common error codes
            if (testResponse.status === 401) {
                testResult.status = 'invalid_api_key';
                testResult.message = 'API key is invalid or expired';
            } else if (testResponse.status === 403) {
                testResult.status = 'insufficient_permissions';
                testResult.message = 'API key does not have required permissions';
            } else if (testResponse.status === 429) {
                testResult.status = 'rate_limited';
                testResult.message = 'API rate limit exceeded';
            } else {
                testResult.status = 'api_error';
                testResult.message = `API returned ${testResponse.status}: ${testResponse.statusText}`;
            }
        } else {
            testResult.status = 'success';
            testResult.message = 'DocuSeal API is accessible';
        }

        return NextResponse.json(testResult);

    } catch (error) {
        console.error('DocuSeal debug error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'network_error'
        }, { status: 500 });
    }
} 