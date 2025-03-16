import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";

export const runtime = "edge";

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

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const lookAtDatabase = body.look_at_database;
		const messages = body.messages ?? [];
		// console.log("Body: ", body);

		if (lookAtDatabase) {
			// console.log("Delegating to retrieval endpoint");
			const retrievalResponse = await fetch(new URL("/api/chat/retrieval", req.url), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body)
			});

			if (!retrievalResponse.ok) {
				throw new Error("Failed to fetch from retrieval endpoint");
			}

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

		return new StreamingTextResponse(stream);
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
	}
}