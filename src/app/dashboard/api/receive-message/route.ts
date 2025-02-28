import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const { name, phone, email, message } = await request.json();
	console.log(name, phone, email, message);
	return NextResponse.json({ message: "Message received" });
}
