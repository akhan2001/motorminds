import { NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

export async function GET() {
    try {
        // Check if env vars are set
        const publicKey = process.env.MOTOR_DAAS_PUBLIC_KEY
        const privateKey = process.env.MOTOR_DAAS_PRIVATE_KEY
        
        if (!publicKey || !privateKey) {
            return NextResponse.json({
                success: false,
                error: 'MOTOR DaaS credentials not configured',
                hint: 'Set MOTOR_DAAS_PUBLIC_KEY and MOTOR_DAAS_PRIVATE_KEY in .env.local'
            }, { status: 500 })
        }

        const client = new MotorDaasClient({
            publicKey,
            privateKey,
            baseUrl: process.env.MOTOR_DAAS_BASE_URL || 'https://api.motor.com/v1'
        })
        
        // Test 1: HelloWorld to verify authentication
        console.log('Testing HelloWorld endpoint...')
        const helloResponse = await client.testHelloWorld()
        console.log('✅ HelloWorld successful:', helloResponse)

        // Test 2: VIN lookup (trying multiple sandbox VINs)
        console.log('Testing VIN lookup...')
        const testVins = [
            '1FTFW1ET1CFA84056', // 2012 Ford F-150 (Base Vehicle ID 26332 - we know this works for DTCs)
            '1B3ES47Y6VD205309', // 1997 Dodge Neon
            '1FMZU74W22UC09718', // 2002 Ford Explorer
        ]
        let vehicleInfo = null
        for (const vin of testVins) {
            try {
                console.log(`  Trying VIN: ${vin}`)
                vehicleInfo = await client.getVehicleInfo(vin)
                console.log(`✅ VIN lookup successful with ${vin}:`, vehicleInfo)
                break
            } catch (error) {
                console.log(`  ❌ VIN ${vin} failed:`, error instanceof Error ? error.message : 'Unknown error')
            }
        }

        // Test 3: DTC lookup (using 2012 Ford F-150 Base Vehicle ID 26332 from MOTOR docs)
        console.log('Testing DTC lookup...')
        const testBaseVehicleId = 26332 // 2012 Ford F-150
        let dtcInfo = null
        try {
            // Test without specific DTC code (get all DTCs)
            dtcInfo = await client.getDiagnosticTroubleCodes(testBaseVehicleId)
            console.log('✅ DTC lookup successful:', {
                totalCount: dtcInfo.totalCount || 0,
                hasApplications: dtcInfo.applications?.length > 0
            })
        } catch (error) {
            console.log('❌ DTC lookup failed:', error instanceof Error ? error.message : 'Unknown error')
            // Continue even if DTC lookup fails
        }

        return NextResponse.json({
            success: true,
            helloWorld: helloResponse,
            vehicleInfo: vehicleInfo,
            dtcInfo: dtcInfo ? {
                totalCount: dtcInfo.totalCount || 0,
                hasApplications: dtcInfo.applications?.length > 0,
                sampleApplication: dtcInfo.applications?.[0] || null
            } : null,
            message: vehicleInfo && dtcInfo
                ? 'MOTOR DaaS authentication, VIN lookup, and DTC lookup all working correctly!'
                : vehicleInfo
                ? 'MOTOR DaaS authentication and VIN lookup working, but DTC lookup failed. Check server logs.'
                : 'MOTOR DaaS authentication working, but some lookups failed. Check server logs.'
        })
    } catch (error) {
        console.error('MOTOR DaaS test error:', error)
        const errorResponse: any = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
        
        if (error instanceof Error && 'statusCode' in error) {
            errorResponse.statusCode = (error as any).statusCode
            errorResponse.errorCode = (error as any).errorCode
        }
        
        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error instanceof Error ? error.stack : undefined
            errorResponse.hint = 'Check server console logs for detailed error information'
        }
        
        return NextResponse.json(errorResponse, { status: 500 })
    }
}