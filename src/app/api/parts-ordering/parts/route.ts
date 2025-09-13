import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const vehicleId = searchParams.get('vehicleId')
        const productGroupId = searchParams.get('productGroupId')

        if (!vehicleId || !productGroupId) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Vehicle ID and Product Group ID are required' 
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

        // API call to get parts/articles using the correct endpoint structure
        // Based on your example: /articles/list/type-id/{typeId}/vehicle-id/{vehicleId}/product-group-id/{productGroupId}/lang-id/{langId}
        // Parameters: typeId=1 (Automobile), vehicleId (from engine), productGroupId (categoryId), langId=4 (English)
        const url = `https://auto-parts-catalog.p.rapidapi.com/articles/list/type-id/1/vehicle-id/${vehicleId}/product-group-id/${productGroupId}/lang-id/4`
        
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
        
        let partsData
        try {
            partsData = JSON.parse(result)
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

        // Transform parts data based on the new API response structure
        // Response structure: { vehicleId, productGroupId, countArticles, articles: [array] }
        const articles = partsData?.articles || []
        
        const transformedParts = Array.isArray(articles) ? articles.map((part: any, index: number) => ({
            id: part.articleId || `article-${index}`,
            articleId: part.articleId,
            articleNo: part.articleNo,
            name: part.articleProductName || 'Unknown Part',
            description: part.articleProductName || '',
            supplier: part.supplierName || '',
            supplierId: part.supplierId,
            price: part.price || 0, // Price might not be in this endpoint
            availability: 'Available', // Default since not provided in this response
            imageUrl: part.s3image || null,
            partNumber: part.articleNo,
            brandName: part.supplierName || '',
            productId: part.productId,
            mediaType: part.articleMediaType,
            mediaFileName: part.articleMediaFileName,
            fullInfo: part // Keep original data for debugging
        })) : []

        return NextResponse.json({
            success: true,
            data: transformedParts,
            totalCount: partsData?.countArticles || transformedParts.length,
            vehicleId: partsData?.vehicleId,
            productGroupId: partsData?.productGroupId,
            rawData: partsData, // Include raw data for debugging
            message: `Parts fetched successfully. Found ${transformedParts.length} articles.`
        })

    } catch (error) {
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to fetch parts',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
