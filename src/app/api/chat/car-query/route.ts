import { NextRequest, NextResponse } from "next/server";

interface CarQueryResponse {
    response: string;
    topic: string;
    sources: {
        filename: string;
        section: string;
        page_number: number;
        type: "text" | "diagram";
        image_path?: string;
    }[];
    diagrams: string[];
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, car_make, car_model, car_year } = body;

        // Validate required fields
        if (!query || !car_make || !car_model || !car_year) {
            return NextResponse.json(
                { error: "Missing required fields: query, car_make, car_model, and car_year are required" },
                { status: 400 }
            );
        }

        // Check if it's the supported car (Mazda 121 1990)
        const isSupportedCar = 
            car_make.toLowerCase() === "mazda" && 
            car_model.toLowerCase() === "121" && 
            car_year === 1990;

        if (isSupportedCar) {
            console.log("Sending request to FastAPI with:", { query, car_make, car_model, car_year });

            // Make request to external RAG chatbot API
            const response = await fetch("https://rag-chatbot-api-mi4f.onrender.com/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query,
                    car_make,
                    car_model,
                    car_year,
                }),
            });

            if (!response.ok) {
                console.error("FastAPI Error:", await response.text());
                throw new Error(`External API responded with status: ${response.status}`);
            }

            const data: CarQueryResponse = await response.json();
            console.log("Received response from FastAPI:", data);

            return NextResponse.json({
                response: data.response,
                topic: data.topic,
                sources: data.sources,
                diagrams: data.diagrams
            });
        }

        // For all other cars, return the standard response structure
        return NextResponse.json({
            response: query,
            topic: "General Car Query",
            sources: [],
            diagrams: []
        });

    } catch (error: any) {
        console.error("Error in car query route:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process car query" },
            { status: 500 }
        );
    }
} 