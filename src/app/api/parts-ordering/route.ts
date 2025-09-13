import { NextRequest, NextResponse } from 'next/server'

// RapidAPI Auto Parts Catalog configuration
const RAPIDAPI_BASE = 'https://auto-parts-catalog.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.RAPID_API_KEY

// Default configuration for API calls
const API_CONFIG = {
    typeId: 1, // Automobile
    langId: 4, // English
    countryFilterId: 62, // Germany (can be changed to other countries)
}

// Vehicle specific data (will be populated from API calls)
const VEHICLE_DATA = {
    manufacturerId: null, // Will be fetched from manufacturers endpoint
    modelId: null, // Will be fetched from models endpoint
    vehicleId: null, // Will be fetched from vehicle types endpoint
    years: ['2018', '2019', '2020', '2021', '2022', '2023', '2024']
}

export async function GET(request: NextRequest) {
    try {
        console.log('Parts-ordering API called:', request.url)
        
        if (!RAPIDAPI_KEY) {
            console.error('RAPID_API_KEY environment variable is not set')
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'RapidAPI key is not configured. Please check your .env.local file.',
                    error: 'Missing RAPID_API_KEY environment variable'
                },
                { status: 500 }
            )
        }
        
        const { searchParams } = new URL(request.url)
        const year = searchParams.get('year') || '2022'
        const category = searchParams.get('category') || 'all'
        const make = searchParams.get('make') || ''
        const model = searchParams.get('model') || ''
        const manufacturerIdParam = searchParams.get('manufacturerId')
        const modelIdParam = searchParams.get('modelId')
        
        console.log('Request params:', { year, category, make, model, manufacturerIdParam, modelIdParam })

        // Use provided manufacturerId or get first available
        let manufacturerId: number | null = null
        if (manufacturerIdParam) {
            manufacturerId = parseInt(manufacturerIdParam)
        } else {
            manufacturerId = await getFirstManufacturerId()
        }

        if (!manufacturerId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Manufacturer not found',
                    message: 'No manufacturers found in the catalog'
                },
                { status: 404 }
            )
        }

        // Step 2: Use provided modelId or get first available
        let modelId: number | null = null
        if (modelIdParam) {
            modelId = parseInt(modelIdParam)
        } else {
            modelId = await getFirstModelId(manufacturerId)
        }

        if (!modelId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Model not found',
                    message: 'No models found for this manufacturer'
                },
                { status: 404 }
            )
        }

        // Step 3: Get first available vehicle type
        const vehicleTypeId = await getFirstVehicleId(manufacturerId, modelId)
        if (!vehicleTypeId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Vehicle not found',
                    message: 'No vehicle types found for this model'
                },
                { status: 404 }
            )
        }

        // Step 4: Get first available engine
        const engineId = await getFirstEngineId(vehicleTypeId)
        if (!engineId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Engine not found',
                    message: 'No engines found for this vehicle type'
                },
                { status: 404 }
            )
        }

        // Step 5: Get parts for the engine
        const parts = await getParts(engineId)

        return NextResponse.json({
            success: true,
            data: {
                vehicle: {
                    make: make || 'Unknown',
                    model: model || 'Unknown',
                    year: year,
                    manufacturerId: manufacturerId,
                    modelId: modelId,
                    vehicleTypeId: vehicleTypeId,
                    engineId: engineId
                },
                parts: parts,
                totalCount: parts.length,
                categories: ['Engine', 'Brakes', 'Interior', 'Exterior', 'Suspension', 'Electrical'],
                source: 'rapidapi'
            },
            message: 'Vehicle parts retrieved successfully from RapidAPI'
        })

    } catch (error) {
        console.error('Error fetching vehicle parts:', error)
        
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('Authentication failed')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication Error',
                    message: 'RapidAPI key is invalid or expired. Please check your .env.local file and verify the RAPID_API_KEY.'
                },
                { status: 401 }
            )
        }
        
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch parts data',
                message: error instanceof Error ? error.message : 'An error occurred while retrieving parts information',
                debugInfo: {
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    errorMessage: error instanceof Error ? error.message : String(error)
                }
            },
            { status: 500 }
        )
    }
}

// Helper function to make API calls
async function makeApiCall(endpoint: string): Promise<any> {
    console.log('Making API call to:', `${RAPIDAPI_BASE}${endpoint}`)
    
    if (!RAPIDAPI_KEY) {
        throw new Error('RAPID_API_KEY is not configured')
    }
    
    const response = await fetch(`${RAPIDAPI_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'auto-parts-catalog.p.rapidapi.com'
        }
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        console.error('Response status:', response.status)
        
        if (response.status === 401) {
            throw new Error(`Authentication failed: RapidAPI key is invalid or expired`)
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
}

// Step 1: Get first available manufacturer ID
async function getFirstManufacturerId(): Promise<number | null> {
    try {
        const endpoint = `/manufacturers/list/type-id/1`
        const data = await makeApiCall(endpoint)
        
        console.log('Manufacturers response:', data)
        
        // Return the first manufacturer
        return data && data.length > 0 ? data[0].id : null
    } catch (error) {
        console.error('Error fetching manufacturers:', error)
        return null
    }
}

// Step 2: Get first available model ID
async function getFirstModelId(manufacturerId: number): Promise<number | null> {
    try {
        const endpoint = `/vehicles/models/brand-id/${manufacturerId}`
        const data = await makeApiCall(endpoint)
        
        // Return the first model
        return data && data.length > 0 ? data[0].id : null
    } catch (error) {
        console.error('Error fetching models:', error)
        return null
    }
}

// Step 3: Get first available vehicle type
async function getFirstVehicleId(manufacturerId: number, modelId: number): Promise<number | null> {
    try {
        const endpoint = `/vehicles/types/model-id/${modelId}`
        const data = await makeApiCall(endpoint)
        
        // Return the first vehicle type
        return data && data.length > 0 ? data[0].id : null
    } catch (error) {
        console.error('Error fetching vehicle types:', error)
        return null
    }
}

// Step 4: Get first available engine
async function getFirstEngineId(vehicleTypeId: number): Promise<number | null> {
    try {
        const endpoint = `/vehicles/engines/vehicle-type-id/${vehicleTypeId}`
        const data = await makeApiCall(endpoint)
        
        // Return the first engine
        return data && data.length > 0 ? data[0].id : null
    } catch (error) {
        console.error('Error fetching engines:', error)
        return null
    }
}

// Step 5: Get parts for the engine
async function getParts(engineId: number): Promise<any[]> {
    try {
        const endpoint = `/parts/engine-id/${engineId}/lang-id/4`
        const data = await makeApiCall(endpoint)
        
        // Process parts into our format
        return data.map((part: any, index: number) => ({
            id: part.id || `PART-${index + 1}`,
            name: part.name || part.description || 'Unknown Part',
            partNumber: part.partNumber || part.articleNumber || 'N/A',
            category: part.category || 'Engine',
            price: part.price || 0,
            description: part.description || 'No description available',
            compatibleYears: ['2022'],
            manufacturer: part.manufacturer || 'Toyota',
            inStock: true,
            imageUrl: part.imageUrl || '/parts-images/default.jpg'
        }))
    } catch (error) {
        console.error('Error fetching parts:', error)
        return []
    }
}
