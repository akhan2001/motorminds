import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { name, email, message, shopName } = await req.json();

    // TODO: Send this to a backend, email service, or CRM
    console.log("New lead for", shopName, { name, email, message });

    return NextResponse.json({ success: true });
}
