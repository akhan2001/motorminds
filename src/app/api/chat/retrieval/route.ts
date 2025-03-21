import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateSQLQuery, executeSQLQuery, explainSQLQuery } from "../../../mia/lib/sql-generator";
import { StreamingTextResponse, Message as VercelChatMessage } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const runtime = "edge";

// Initialize OpenAI client (keeping for SQL generation)
const openai = new OpenAI({
  	apiKey: process.env.OPENAI_API_KEY,
});

const formatMessage = (message: VercelChatMessage) => {
	return `${message.role}: ${message.content}`;
};

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const messages = body.messages ?? [];
		const currentMessageContent = messages[messages.length - 1].content;
		const shopId = body.shop_id;

		// Ensure shop_id is provided
		if (!shopId) {
			return NextResponse.json(
				{ error: "shop_id is required for database queries" },
				{ status: 400 }
			);
		}

		// Create LangChain model for classification
		const classificationModel = new ChatOpenAI({
			temperature: 0.3,
			model: "gpt-3.5-turbo",
		});
		
		// Classification prompt
		const classificationPrompt = PromptTemplate.fromTemplate(`
			Classify if this query is database-related or not:
			
			Database-related queries are currently only for retrieving customer information.
			
			Non-database queries are general questions, advice requests, or casual conversation
			not related to retrieving customer information.
			
			Respond with ONLY 'database' or 'non-database'.
			
			Query: {input}
		`);
		
		// Create classification chain
		const classificationChain = classificationPrompt.pipe(classificationModel).pipe(new StringOutputParser());
		
		// Run classification
		const queryType = (await classificationChain.invoke({
			input: currentMessageContent
		})).trim().toLowerCase();

		// If query is not database-related, inform the user
		if (queryType === "non-database") {
			// Convert previous messages to LangChain messages
			const messageHistory = [];
			for (const message of messages.slice(0, -1)) {
				if (message.role === 'user') {
					messageHistory.push(new HumanMessage(message.content));
				} else if (message.role === 'assistant') {
					messageHistory.push(new AIMessage(message.content));
				}
			}
			
			// Add the current message
			messageHistory.push(new HumanMessage(currentMessageContent));
			
			// Create non-database response model
			const nonDbModel = new ChatOpenAI({
				temperature: 0.7,
				model: "gpt-3.5-turbo",
				maxTokens: 200,
			});
			
			// Create the prompt for non-database responses
			const systemMessage = new SystemMessage(
				`You are Mia Database, a helpful shop assistant that can help with database queries for retrieving customer information. The user has asked a question that doesn't seem to be database-related, but they currently have Database Mode activated. 
				
				Respond conversationally and politely to acknowledge their question, but gently remind them 
				that Database Mode is specifically for retrieving customer information from the database.
				
				Suggest that they switch off Database Mode for general questions, advice, or conversations.
				
				Use specific examples of database queries they could try in this mode like "Show me customer 
				information" or "Give me a list of all customers", or suggest they turn off Database Mode for their 
				current question.
				
				Be friendly, helpful, and specific - don't be robotic or use template language.`
			);
			
			// Run the non-database response
			const aiResponse = await nonDbModel.invoke([
				systemMessage,
				...messageHistory
			]);
			
			// Get response content
			const responseContent = aiResponse.content.toString();
			
			// Create a streaming response
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					// Split the response into words to simulate token-by-token streaming
					const words = responseContent.split(' ');
					
					for (const word of words) {
						// Add a small delay between words to simulate streaming
						await new Promise(resolve => setTimeout(resolve, 20));
						controller.enqueue(encoder.encode(word + ' '));
					}
					
					controller.close();
				}
			});

			return new StreamingTextResponse(stream);
		}

		// 1. Generate SQL query from natural language
		let sqlQuery;
		try {
			sqlQuery = await generateSQLQuery(currentMessageContent, shopId);
			console.log("Generated SQL query:", sqlQuery);
		} catch (error: any) {
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(encoder.encode("I had trouble retrieving that information. Please try again."));
					controller.close();
				}
			});
			return new StreamingTextResponse(stream);
		}

		// 2. Execute the SQL query
		let results;
		try {
			results = await executeSQLQuery(sqlQuery, shopId);
		} catch (error: any) {
			console.error("Error executing SQL query:", error);
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(encoder.encode("I had trouble retrieving that information. Please try again."));
					controller.close();
				}
			});
			return new StreamingTextResponse(stream);
		}

		// 4. Generate natural language response using LangChain
		try {
			// Format the results for the AI
			const formattedResults = Array.isArray(results) 
				? `Found ${results.length} results: ${JSON.stringify(results, null, 2)}` 
				: JSON.stringify(results);
			
			// Convert previous messages to LangChain messages
			const messageHistory = [];
			for (const message of messages.slice(0, -1)) {
				if (message.role === 'user') {
					messageHistory.push(new HumanMessage(message.content));
				} else if (message.role === 'assistant') {
					messageHistory.push(new AIMessage(message.content));
				}
			}
			
			// Create response model
			const responseModel = new ChatOpenAI({
				temperature: 0.7,
				model: "gpt-3.5-turbo",
			});
			
			// Create the system message for database responses
			const systemMessage = new SystemMessage(
				`You are Mia, a professional and helpful shop assistant. Answer the user's question based on the data provided.
				
				FORMATTING GUIDELINES:
				- Do not use tables, markdown, or any bolding with asterisks.
				- Use bullet points where appropriate
				- Format dates in a human-readable way (e.g., "March 15, 2025" instead of "2025-03-15")
				- Format phone numbers consistently with dashes
				
				TONE GUIDELINES:
				- Be professional yet conversational and helpful
				- Use natural language instead of structured data presentation
				- Use the customer's name when available
				- Be concise but thorough
				- Don't mention SQL or database queries in your response
				- Avoid technical formatting like tables - present information in a conversational way
				- Do not use emojis in your responses
				- Maintain a friendly but professional tone
				
				If the data shows no results, politely inform the user that no matching information was found.
				
				RETRIEVED DATA:
				${formattedResults}`
			);
			
			// Add the current message
			const finalMessages = [
				systemMessage,
				...messageHistory,
				new HumanMessage(currentMessageContent)
			];
			
			// Generate response
			const response = await responseModel.invoke(finalMessages);
			
			// Get the complete response
			const responseContent = response.content.toString();
			
			// Create a custom stream that simulates token-by-token streaming
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					// Split the response into words to simulate token-by-token streaming
					const words = responseContent.split(' ');
					
					for (const word of words) {
						// Add a small delay between words to simulate streaming
						await new Promise(resolve => setTimeout(resolve, 20));
						controller.enqueue(encoder.encode(word + ' '));
					}
					
					controller.close();
				}
			});

			return new StreamingTextResponse(stream);
		} catch (responseError) {
			console.error("Error generating AI response:", responseError);
			
			// Fallback to simple response
			return NextResponse.json({
				message: `I found ${Array.isArray(results) ? results.length : 0} results for your query.`,
				sqlQuery: sqlQuery,
				results: results
			});
		}
	} catch (e: any) {
		console.error("Error details:", {
			message: e.message,
			name: e.name,
			code: e.code,
			details: e.details || "No additional details"
		});
		return NextResponse.json({ 
			error: e.message,
			details: e.details || e.code || e.name 
		}, { status: e.status ?? 500 });
	}
}