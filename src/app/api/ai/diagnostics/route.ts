import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { prompt, selectedVehicleId } = await request.json()

        console.log('API received:', { prompt, selectedVehicleId })

        // Just return Hello World for now
        return NextResponse.json({
            message: 'Hello World!',
            receivedPrompt: prompt,
            vehicleId: selectedVehicleId
        })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
