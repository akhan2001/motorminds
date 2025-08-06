import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import DOMPurify from "isomorphic-dompurify";

const rateLimiter = new RateLimiterMemory({
    points: 10, // 10 requests
    duration: 60, // per 60 seconds by IP
});

async function sanitize(body: any) {
    if (!body) return body;
    for (const key in body) {
        if (typeof body[key] === 'string') {
            body[key] = DOMPurify.sanitize(body[key]);
        }
    }
    return body;
}

export async function widgetMiddleware(request: NextRequest) {
    const ip = request.ip ?? "127.0.0.1";

    try {
        await rateLimiter.consume(ip);
    } catch (e) {
        return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
            status: 429,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    if (request.method === "POST" || request.method === "PUT") {
        try {
            let body = await request.json();
            body = await sanitize(body);
            // Re-create the request with the sanitized body
            const newRequest = new NextRequest(request.nextUrl, {
                body: JSON.stringify(body),
                headers: request.headers,
                method: request.method,
            });
            return NextResponse.next({ request: newRequest });
        } catch (error) {
            // Handle cases where body is not JSON, or other parsing errors
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}
