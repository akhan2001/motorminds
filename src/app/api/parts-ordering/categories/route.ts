import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const vehicleId = searchParams.get('vehicleId')

        if (!vehicleId) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Vehicle ID is required' 
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

        // API call to get parts categories using the correct endpoint structure
        // Based on your working example: /category/type-id/{typeId}/products-groups-variant-3/{vehicleId}/lang-id/{langId}
        // Parameters: typeId=1 (Automobile), vehicleId (from engine), langId=4 (English)
        const apiUrl = `https://auto-parts-catalog.p.rapidapi.com/category/type-id/1/products-groups-variant-3/${vehicleId}/lang-id/4`
        
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'auto-parts-catalog.p.rapidapi.com'
            }
        }

        const response = await fetch(apiUrl, options)
        
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
        
        let categoriesData
        try {
            categoriesData = JSON.parse(result)
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

        // Transform categories data from Get Category v3 response
        const transformedCategories: any[] = []
        
        // Handle different possible response structures
        let categories = null
        
        if (categoriesData && typeof categoriesData === 'object') {
            // Try different possible structures based on API documentation
            if (categoriesData.categories) {
                categories = categoriesData.categories
            } else if (categoriesData.data) {
                categories = categoriesData.data
            } else {
                // Direct object structure like { "100001": { "text": "Body", "children": {...} } }
                categories = categoriesData
            }
        }
        
        if (categories && typeof categories === 'object') {
            // Extract main categories (top level) from the v3 response
            Object.keys(categories).forEach(categoryId => {
                const category = categories[categoryId]
                
                if (category && (category.text || category.categoryName)) {
                    transformedCategories.push({
                        categoryId: parseInt(categoryId),
                        categoryName: category.text || category.categoryName || `Category ${categoryId}`,
                        level: 1, // Main category level
                        children: category.children || {},
                        fullInfo: category // Keep original data for debugging
                    })
                }
            })
        }

        // Sort alphabetically by category name
        const sortedCategories = transformedCategories.sort((a, b) => 
            a.categoryName.localeCompare(b.categoryName)
        )

        return NextResponse.json({
            success: true,
            data: sortedCategories,
            rawData: categoriesData, // Include raw data for debugging
            message: `Categories fetched successfully from v3 endpoint. Found ${sortedCategories.length} categories.`
        })

    } catch (error) {
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to fetch categories',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
