import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.RAPID_API_KEY
        
        if (!apiKey) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'RapidAPI key is not configured. Please check your .env.local file.',
                    error: 'Missing RAPID_API_KEY environment variable'
                },
                { status: 500 }
            )
        }

        // API call to get manufacturers/makes
        // Using: typeId=1 (Automobile), langId=4 (English GB), countryFilterId=48 (Canada)
        const url = `https://auto-parts-catalog.p.rapidapi.com/manufacturers/list/type-id/1/lang-id/4/country-filter-id/48`
        
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'auto-parts-catalog.p.rapidapi.com'
            }
        }

        const response = await fetch(url, options)
        
        if (!response.ok) {
            const errorText = await response.text()
            
            if (response.status === 401) {
                return NextResponse.json(
                    { 
                        success: false, 
                        message: 'RapidAPI key is invalid or expired.',
                        error: `Authentication failed: ${errorText}`
                    },
                    { status: 401 }
                )
            }
            
            return NextResponse.json(
                { 
                    success: false, 
                    message: `API request failed with status: ${response.status}`,
                    error: errorText
                },
                { status: response.status }
            )
        }

        const result = await response.text()
        
        let manufacturersData
        try {
            manufacturersData = JSON.parse(result)
        } catch (parseError) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Invalid JSON response from API',
                    error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
                },
                { status: 500 }
            )
        }

        // Transform manufacturers data
        const transformedManufacturers = Array.isArray(manufacturersData) ? manufacturersData.map((manufacturer: any) => ({
            manufacturerId: manufacturer.manufacturerId || manufacturer.id,
            manufacturerName: manufacturer.manufacturerName || manufacturer.name || manufacturer.manufacturer,
            fullInfo: manufacturer // Keep original data for debugging
        })) : []

        return NextResponse.json({
            success: true,
            data: transformedManufacturers,
            rawData: manufacturersData, // Include raw data for debugging
            message: 'Manufacturers fetched successfully'
        })

    } catch (error) {
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to fetch manufacturers',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
