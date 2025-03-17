import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateSQLQuery, executeSQLQuery, explainSQLQuery } from "../../../mia/lib/sql-generator";
import { StreamingTextResponse } from "ai";

export const runtime = "edge";

// Initialize OpenAI client
const openai = new OpenAI({
  	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		// console.log("Request body:", body);
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

		// 1. Generate SQL query from natural language
		// console.log("Generating SQL query for:", currentMessageContent);
		let sqlQuery;
		try {
			sqlQuery = await generateSQLQuery(currentMessageContent, shopId);
			console.log("Generated SQL query:", sqlQuery);
		} catch (error: any) {
			// console.error("Error generating SQL query:", error);
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
			// console.log("Query results:", results);
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

		// 3. Generate explanation of the query (optional)
		// let explanation;
		// try {
		// 	explanation = await explainSQLQuery(currentMessageContent, sqlQuery);
		// 	console.log("Query explanation:", explanation);
		// } catch (error) {
		// 	console.error("Error generating explanation:", error);
		// 	explanation = null;
		// }
		
		// ${explanation ? `Explanation of data: ${explanation}` : ''}

		// 4. Generate natural language response
		try {
			// Format the results for the AI
			const formattedResults = Array.isArray(results) 
				? `Found ${results.length} results: ${JSON.stringify(results, null, 2)}` 
				: JSON.stringify(results);

			// console.log("Formatted results:", formattedResults);
			
			// Create a system message that encourages friendly, professional responses
			const systemMessage = `You are Mia, a professional and helpful shop assistant. Answer the user's question based on the data provided.
			
			FORMATTING GUIDELINES:
			- Use Markdown formatting to make your responses visually appealing and easy to read
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
			
			If the data shows no results, politely inform the user that no matching information was found.`;
			
			// Create a user message that includes the original question and the data
			const userMessage = `
			User asked: "${currentMessageContent}"
			
			Data from database: ${formattedResults}
			
			Provide a helpful response based on this data. Use natural, conversational language with some Markdown formatting to make your response visually appealing. Avoid tables and overly structured formats - respond as if you're having a friendly conversation:`;
			
			// Generate the response without streaming first
			const response = await openai.chat.completions.create({
				model: "gpt-3.5-turbo",
				messages: [
					{ role: "system", content: systemMessage },
					{ role: "user", content: userMessage }
				],
				temperature: 0.7,
				stream: false
			});

			// Get the complete response
			const responseContent = response.choices[0].message.content || "I found some information but couldn't generate a proper response.";
			
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