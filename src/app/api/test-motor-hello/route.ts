// src/app/api/test-motor-hello/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { MotorDaasClient } from '@/lib/integrations/motor-daas';

/**
 * Simple test endpoint for MOTOR DaaS HelloWorld
 *
 * Test with: GET http://localhost:3000/api/test-motor-hello
 */
export async function GET(req: NextRequest) {
    console.log('\n=== MOTOR DaaS HelloWorld Test ===\n');

    try {
        // Check credentials
        const publicKey = process.env.MOTOR_DAAS_PUBLIC_KEY;
        const privateKey = process.env.MOTOR_DAAS_PRIVATE_KEY;
        const baseUrl = process.env.MOTOR_DAAS_BASE_URL || 'https://api.motor.com/v1';

        if (!publicKey || !privateKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'MOTOR DaaS credentials not configured',
                    hint: 'Add MOTOR_DAAS_PUBLIC_KEY and MOTOR_DAAS_PRIVATE_KEY to .env.local'
                },
                { status: 500 }
            );
        }

        console.log('Configuration:');
        console.log('  Public Key:', publicKey.substring(0, 10) + '...');
        console.log('  Base URL:', baseUrl);

        // Create client
        const client = new MotorDaasClient({
            publicKey,
            privateKey,
            baseUrl
        });

        console.log('\nCalling HelloWorld endpoint...');

        // Test HelloWorld
        const result = await client.helloWorld();

        console.log('Success! Response:', result);
        console.log('\n=== Test Complete ===\n');

        return NextResponse.json({
            success: true,
            message: 'MOTOR DaaS HelloWorld test successful',
            data: result,
            config: {
                baseUrl,
                publicKeyPreview: publicKey.substring(0, 10) + '...'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Test failed:', error);
        console.log('\n=== Test Failed ===\n');

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Unknown error',
                errorCode: error.errorCode,
                statusCode: error.statusCode,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                timestamp: new Date().toISOString()
            },
            { status: error.statusCode || 500 }
        );
    }
}
