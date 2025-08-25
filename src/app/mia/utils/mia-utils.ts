'use client'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface VehicleContext {
    year?: number
    make?: string
    model?: string
    vin?: string
}

export async function sendMessageToMia(
    shopId: string,
    messages: Message[],
    vehicleContext?: VehicleContext
): Promise<string> {
    const response = await fetch('/api/mia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            shopId,
            messages,
            vehicleContext
        }),
    })

    if (!response.ok) {
        throw new Error('Sorry, there was a problem connecting to Mia.')
    }

    const data = await response.json()
    return data.message || "I couldn't process that request."
}
