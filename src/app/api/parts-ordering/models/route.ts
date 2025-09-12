import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const manufacturerId = searchParams.get('manufacturerId')

        if (!manufacturerId) {
            return NextResponse.json(
                { success: false, message: 'Manufacturer ID is required' },
                { status: 400 }
            )
        }

        const apiKey = process.env.RAPIDAPI_KEY
        console.log('API Key exists:', !!apiKey)
        console.log('API Key length:', apiKey ? apiKey.length : 0)
        console.log('Manufacturer ID:', manufacturerId)

        const url = `https://auto-parts-catalog.p.rapidapi.com/models/list/type-id/1/manufacturer-id/${manufacturerId}/lang-id/4/country-filter-id/49`
        
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey || '',
                'x-rapidapi-host': 'auto-parts-catalog.p.rapidapi.com'
            }
        }

        const response = await fetch(url, options)
        
        if (!response.ok) {
            const errorText = await response.text()
            console.error('API Error Response:', errorText)
            throw new Error(`API request failed with status: ${response.status} - ${errorText}`)
        }

        const result = await response.text()
        console.log('API Response:', result.substring(0, 500)) // Log first 500 chars
        
        // Parse the response if it's JSON
        let modelsData
        try {
            modelsData = JSON.parse(result)
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError)
            // If it's not JSON, return the raw text
            modelsData = result
        }

        return NextResponse.json({
            success: true,
            data: modelsData,
            message: 'Models fetched successfully'
        })

    } catch (error) {
        console.error('Error fetching models:', error)
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to fetch models',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
