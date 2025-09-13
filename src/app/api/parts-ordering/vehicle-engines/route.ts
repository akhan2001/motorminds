import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const manufacturerId = searchParams.get('manufacturerId')
        const modelId = searchParams.get('modelId')

        if (!manufacturerId || !modelId) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Manufacturer ID and Model ID are required' 
                },
                { status: 400 }
            )
        }

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

        // API call to get vehicle engine types  
        // Using: typeId=1 (Automobile), langId=4 (English GB), countryFilterId=48 (Canada)
        // Correct endpoint pattern: /types/type-id/{typeId}/list-vehicles-types/{modelSeriesId}/lang-id/{langId}/country-filter-id/{countryFilterId}
        const url = `https://auto-parts-catalog.p.rapidapi.com/types/type-id/1/list-vehicles-types/${modelId}/lang-id/4/country-filter-id/48`
        
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
            
            if (response.status === 404) {
                return NextResponse.json(
                    { 
                        success: false, 
                        message: `Vehicle engines endpoint not found. The API endpoint might be different.`,
                        error: `404 Not Found: ${errorText}`,
                        debugInfo: {
                            url: url,
                            manufacturerId: manufacturerId,
                            modelId: modelId,
                            suggestion: 'Check the RapidAPI documentation for the correct vehicle engines endpoint'
                        }
                    },
                    { status: 404 }
                )
            }
            
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
                    error: errorText,
                    debugInfo: {
                        url: url,
                        status: response.status,
                        statusText: response.statusText
                    }
                },
                { status: response.status }
            )
        }

        const result = await response.text()
        
        let enginesData
        try {
            enginesData = JSON.parse(result)
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

        // Transform the engines data into a consistent format
        // The API returns: { modelType: 'PC', countModelTypes: 5, modelTypes: [...] }
        const modelTypes = enginesData?.modelTypes || []
        const transformedEngines = Array.isArray(modelTypes) ? modelTypes.map((engine: any) => ({
            vehicleId: engine.vehicleId,
            engineType: engine.typeEngineName || 'Unknown Engine',
            engineName: engine.typeEngineName || '',
            capacityLt: engine.capacityLt || '',
            numberOfCylinders: engine.numberOfCylinders || '',
            displacement: `${engine.capacityLt || ''}L`,
            power: `${engine.powerPs || engine.powerKw || ''} ${engine.powerPs ? 'PS' : engine.powerKw ? 'kW' : ''}`.trim(),
            fuelType: engine.fuelType || '',
            engineCodes: engine.engineCodes || '',
            bodyType: engine.bodyType || '',
            constructionPeriod: `${engine.constructionIntervalStart || ''} - ${engine.constructionIntervalEnd || 'Current'}`,
            fullInfo: engine // Keep original data for debugging
        })) : []

        return NextResponse.json({
            success: true,
            data: transformedEngines,
            rawData: enginesData, // Include raw data for debugging
            message: 'Vehicle engines fetched successfully'
        })

    } catch (error) {
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to fetch vehicle engines',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
