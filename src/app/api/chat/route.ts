import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { StringOutputParser } from "@langchain/core/output_parsers";

// export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
	return `${message.role}: ${message.content}`;
};

const TEMPLATE = `
You are Mia, an AI assistant for mechanics specializing in customer data, vehicles, and shop operations.

If data is missing, suggest alternatives or state its unavailable. Ignore non-automotive topics. Maintain a friendly, conversational tone with helpful details.

Response Rules:
- Respond directly without prefixing with "Mia:"
- Never add classification types like [action] or [info_retrieval] at the end of responses
- If customer data is missing, suggest checking the CRM
- If vehicle info is incomplete, recommend a VIN check
- If a part is unavailable, suggest ordering it
- Redirect non-relevant questions to automotive topics
- If asked about repair procedures, provide a general overview in bullet points

Special Functionality:
1. When a user asks to create a customer (e.g., "create a customer for John Doe", "add a new customer"), respond with a helpful message and end with [CUSTOMER_FORM] tag on a new line. Example:
"I'll help you create a new customer for John Doe. Please fill out the following information in the form below.
[CUSTOMER_FORM]"

2. When a user asks to send a message/email/text to a customer (e.g., "send a message to @John Doe (johndoe@gmail.com)"), respond with a helpful message and end with [EMAIL_FORM] tag on a new line. Example:
"I'll help you send a message to John Doe (johndoe@gmail.com). Please fill out the following information in the form below.
[EMAIL_FORM]"

Example Responses:
User: "What's John Doe's car?"
"John Doe drives a Toyota. Let me know if you need service history or maintenance recommendations!"

User: "Does John need an oil change?"
"I don't have recent service data, but if it's been over 5,000 km, it's a good idea to check. I can help schedule one!"

User: "What color is John's car?"
"John's car is blue. If you need a paint match for repairs, I can assist with that too."

User: "Create a customer for John Smith"
"I'll help you create a new customer for John Smith. I'll need some basic information like their phone number, email, and address. Please fill out the form below and I'll add them to your customer database.
[CUSTOMER_FORM]"

Current Conversation Context:
chat_history: {chat_history}

User: {input}
`;

async function detectCarQuery(query: string): Promise<{ isCarQuery: boolean; carInfo: { make: string; model: string; year: string } | null }> {
	const carModel = new ChatOpenAI({
		temperature: 0.3,
		model: "gpt-3.5-turbo",
	});
	
	const carPrompt = PromptTemplate.fromTemplate(`
		Determine if the user's query is about a specific car and extract the car information.
		
		If the query mentions a specific car with make, model, and year, extract that information.
		For example:
		- "How do I change the oil in my 2018 Toyota Camry?" -> Toyota, Camry, 2018
		- "What's the maintenance schedule for a 2020 Honda Civic?" -> Honda, Civic, 2020
		
		If the query doesn't mention a specific car with all three details (make, model, year), respond with "none".
		
		Output format:
		If car info is found: "car_info:make,model,year"
		If no car info: "none"
		
		Query: {input}
	`);
	
	const carChain = carPrompt.pipe(carModel).pipe(new StringOutputParser());
	
	try {
		const result = (await carChain.invoke({
			input: query
		})).trim();
		
		if (result === "none") {
			return { isCarQuery: false, carInfo: null };
		}
		
		const match = result.match(/car_info:([^,]+),([^,]+),(\d{4})/);
		if (match) {
			return {
				isCarQuery: true,
				carInfo: {
					make: match[1].trim(),
					model: match[2].trim(),
					year: match[3].trim()
				}
			};
		}
		
		return { isCarQuery: false, carInfo: null };
	} catch (error) {
		console.error("Error detecting car query:", error);
		return { isCarQuery: false, carInfo: null };
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const lookAtDatabase = body.look_at_database;
		const messages = body.messages ?? [];
		console.log("Body in main chat route: ", body);

		// Check if this is a car-specific query
		const lastMessage = messages[messages.length - 1];
		const carQueryDetection = await detectCarQuery(lastMessage.content);

		if (carQueryDetection.isCarQuery && carQueryDetection.carInfo) {
			console.log("Car query detected, delegating to car query endpoint");
			
			const carQueryResponse = await fetch(new URL("/api/chat/car-query", req.url), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query: lastMessage.content,
					car_make: carQueryDetection.carInfo.make,
					car_model: carQueryDetection.carInfo.model,
					car_year: carQueryDetection.carInfo.year,
				}),
			});

			if (!carQueryResponse.ok) {
				throw new Error("Failed to fetch from car query endpoint");
			}

			const carData = await carQueryResponse.json();
			
			// Create a formatted response with sources and diagrams
			const formattedResponse = `${carData.response}\n\nSources:\n${carData.sources.map((source: { filename: string; section: string; page_number: number }) => 
				`- ${source.filename}, ${source.section}, Page ${source.page_number}`
			).join('\n')}${carData.diagrams.length > 0 ? `\n\nDiagrams:\n${carData.diagrams.map((diagram: string) => 
				`- ${diagram}`
			).join('\n')}` : ''}`;

			// Create a streaming response for the formatted text
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					const words = formattedResponse.split(' ');
					for (const word of words) {
						await new Promise(resolve => setTimeout(resolve, 20));
						controller.enqueue(encoder.encode(word + ' '));
					}
					controller.close();
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
			},
		});
	}

	if (lookAtDatabase) {
			console.log("Database mode is enabled, delegating to retrieval endpoint");
			
			const retrievalResponse = await fetch(new URL("/api/chat/retrieval", req.url), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body)
			});

			if (!retrievalResponse.ok) {
				console.error("Failed to fetch from retrieval endpoint:", await retrievalResponse.text());
				throw new Error("Failed to fetch from retrieval endpoint");
			}

			// The retrieval endpoint will handle both database and non-database queries
			return retrievalResponse;
		}

		const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
		const currentMessageContent = messages[messages.length - 1].content;
		const prompt = PromptTemplate.fromTemplate(TEMPLATE);

		const model = new ChatOpenAI({
			temperature: 0.8,
			model: "gpt-3.5-turbo",
		});

		const outputParser = new HttpResponseOutputParser();

		const chain = prompt.pipe(model).pipe(outputParser);

		const stream = await chain.stream({
			chat_history: formattedPreviousMessages.join("\n"),
		input: currentMessageContent,
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
} catch (e: any) {
		console.error("Error in main chat route:", e);
		return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
	}
}