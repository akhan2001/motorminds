import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { widgetMiddleware } from "./middleware-widget";

export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/api/widget")) {
        return widgetMiddleware(request);
    }
    return await updateSession(request);
}

// Ensure the middleware is only called for relevant paths.
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
