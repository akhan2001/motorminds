"use client";

import React, { useRef, useState } from "react";
import { ArrowRight } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { oneLine, stripIndents } from "common-tags";
import { PiSealQuestionThin } from "react-icons/pi";
import Image from "next/image";

export function ChatInput() {
	const supabase = createClientComponentClient();
	const inputRef = useRef() as React.MutableRefObject<HTMLInputElement>;
	const [question, setQuestion] = useState<string[]>([]);
	const [answer, setAnswer] = useState<string[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	const toastError = (message: string) => {
	alert(message);
	};

	// Determine the match count based on the query
	async function determineMatchCount(query: string) {
		const generalKeywords = ["all", "list", "total", "how many"];
		const isGeneralQuery = generalKeywords.some(keyword => query.toLowerCase().includes(keyword));

		if (isGeneralQuery) {
			const totalCount = await getTotalCount();
			return totalCount; // Use the total count for general queries
		} else {
			return 3; // Lower match count for specific queries
		}
	}

	const handleSearch = async () => {
		setLoading(true);
		const searchText = inputRef.current.value;

		if (searchText && searchText.trim()) {
			setQuestion(currentQuestions => [...currentQuestions, searchText]);
			const res = await fetch(location.origin + "/embedding", {
				method: "POST",
				body: JSON.stringify({ text: searchText.replace(/\n/g, " ") }),
			});

			if (res.status !== 200) {
				toastError("Error embedding");
			} else {
				const data = await res.json();
				const match_count = await determineMatchCount(searchText);
				const { data: documents } = await supabase.rpc("match_documents", {
					match_count: match_count,
					match_threshold: 0.3,
					query_embedding: data.embedding,
				});

				let tokenCount = 0;
				let contextText = "";
				
				for (let i = 0; i < documents.length; i++) {
					const document = documents[i];
					const content = document.content;
					tokenCount += document.token;

					if (tokenCount > 1000) {
						break;
					}
					contextText += `${content}\n---\n`;
				}

				if (contextText) {
					const prompt = generatePrompt(searchText, contextText);
					await generateAnswer(prompt);
				} else {
					const genericPrompt = generateGenericPrompt(searchText);
					await generateAnswer(genericPrompt);
				}
			}
		}
		inputRef.current.value = "";
		setLoading(false);
	};

	const generateGenericPrompt = (searchText: string) => {
		const prompt = stripIndents`${oneLine`
			You are Mia, an AI assistant specializing in automotive-related topics. You assist with vehicle maintenance, repairs, customer service, and shop operations. Your goal is to provide clear, friendly, and actionable responses while keeping the conversation focused on automotive topics.`}

			**User Question:**  
			${searchText}

			**Response Guidelines:**  
			- Respond directly, naturally, and conversationally—avoid prefixing with "User:" or "Mia:".  
			- When answering maintenance or repair questions, include standard recommendations, warning signs, and best practices.  
			- If applicable, suggest the next steps, such as scheduling a service or checking the owner's manual.  
			- If the request is unclear, ask for clarification while keeping the focus on automotive topics.  
			- If the input is unrelated to automotive topics, politely redirect the user back to relevant subjects.  

			**Example Responses:**  
			- **Question:** "When should I replace my timing belt?"  
			- **Response:** "Timing belts usually need replacement every 60,000 to 100,000 miles, but it varies by vehicle. Have you noticed any squeaking, rough idling, or difficulty starting? I can help you determine if it's time for a replacement!"  
			- **Question:** "Hey, how's your day?"
			- **Response:** "Hey there! I'm always running at full speed! Need help with a car issue?"  
			- **Question:** "Tell me a joke."  
			- **Response:** "Of course! Why did the mechanic bring a ladder to work? Because they were always aiming high! Need help with anything car-related?"  
			- **Question:** "Can you book me a flight?"  
			- **Response:** "I specialize in automotive assistance, but if you need a ride to the airport, I can suggest a good local transport service!"  

			Ensure responses are **direct, conversational, and formatted as natural speech** without unnecessary labels.
			`;
		
		return prompt;
	};

	const generateAnswer = async (prompt: string) => {
		const res = await fetch(location.origin + "/chat", {
			method: "POST",
			body: JSON.stringify({ prompt }),
		});

		if (res.status !== 200) {
			toastError("Error generating answer");
		} else {
			const data = await res.json();
			console.log(data);
			setAnswer(currentAnswers => [...currentAnswers, data.choices[0].message.content]);
			console.log(data.choices[0].message.content);
		}
	}

	const generatePrompt = (searchText: string, contextText: string) => {
		const prompt = stripIndents`${oneLine`
			You are Mia, an AI assistant for mechanics. You provide details on customers, vehicles, and shop operations.
			If data is missing, suggest alternatives or state it's unavailable. Ignore non-automotive topics.`}
		
			**Context:**
			${contextText}
		
			**Question:**
			${searchText}
		
			**Response Rules:**
			- If customer data is missing, suggest checking the CRM.
			- If vehicle info is incomplete, recommend a VIN check.
			- If a part is unavailable, suggest ordering.
			- Redirect non-relevant questions to automotive topics.
			- Responses should be friendly and conversational, providing extra details where possible.
			- At the end of each response, classify the prompt type using the format: **{prompt_type}**
		
			**Prompt Types:**
			1. **Action** – Mia performs a CRM-related action.
				- Example: "Contact all owners with a BMW." → **{action}**
		
			2. **Request** – Mia handles customer-related requests.
				- Example: "Schedule an appointment for an oil change." → **{request}**
		
			3. **Info Retrieval** – Mia fetches information for admins, customers, or shop owners.
				- Example: "Show me the customer's last service record." → **{info_retrieval}**
		
			4. **Question** – User asks a question.
				- Example: "What's the recommended tire pressure for my car?" → **{question}**
		
			5. **Irrelevant** – Mia detects an off-topic or unsupported request.
				- Example: "Tell me a joke." → **{irrelevant}**
		
			6. **Confirmation** – Mia verifies before proceeding with an action.
				- Example: "Are you sure you want to order the brake pads?" → **{confirmation}**
		
			7. **Recommendation** – Mia suggests actions or services based on best practices or history.
				- Example: "I recommend a transmission fluid change soon." → **{recommendation}**
		
			8. **Error Handling** – Mia responds when there's an issue with input, missing data, or system errors.
				- Example: "I couldn't find your vehicle. Can you provide the VIN?" → **{error_handling}**
		
			9. **System Command** – User interacts with Mia's settings or system-related functions.
				- Example: "Change my notification preference to text messages." → **{system_command}**
		
			10. **Small Talk** – Casual conversation that doesn't relate to Mia's core functions.
				- Example: "Hey Mia, how's your day?" → **{small_talk}**
		
			**Example Responses:**
			- "What's John Doe's car?" → "John Doe drives a Toyota. Let me know if you need service history or any maintenance recommendations!" **{info_retrieval}**
			- "What color is John Doe's car?" → "John Doe's car is blue! If you're looking to match paint for a repair, I can help with that too." **{info_retrieval}**
			- "Does John Doe need an oil change?" → "I don't have recent service data, but if it's been over 5,000 km since the last oil change, it's a good idea to check. I can help schedule one!" **{recommendation}**
		`;
		
		return prompt;
	};

	async function getTotalCount() {
		const { count, error } = await supabase
			.from('customers') // Replace with your table name
			.select('*', { count: 'exact', head: true });

		if (error) {
			console.error('Error fetching total count:', error);
			return 0;
		}

		return count;
	}

	// async function fetchDocuments() {
	//   const { data, error } = await supabase.from('documents').select('*');

	//   if (error) {
	//     console.error('Error fetching documents:', error);
	//   } else {
	//     console.log('Documents:', data);
	//   }
	// }

	// // Call the function to fetch and print documents
	// fetchDocuments().catch(console.error);

	return (
		// Mia AI
		<div className="h-screen bg-[#131313] flex flex-col justify-between">
			<div></div>
			<main className="flex justify-center">
				<div className="mx-auto text-center relative mx-auto max-w-3xl">
					<div className="mb-8 flex justify-center">
						<Image src="/motorminds-logo-black_background.svg" alt="Mia AI" width={75} height={75} />
					</div>
					<div className="flex flex-col gap-5">
						<h1 className="mb-4 text-5xl font-medium text-white">
							How Can I Assist You?
						</h1>
						<p className="mb-12 text-lg text-[#979797] w-[75%] mx-auto">
							I&apos;m MIA, your Motorminds mechanic assistant! I can help with
							repairs and diagnostics. I&apos;m still in beta, so more features
							are on the way. Stay tuned for updates!
						</p>
					</div>
				</div>
			</main>
			<div className="w-full px-2 py-2 text-center text-sm text-[#616161] space-y-[2rem]">
				<div>
					<div className="relative mx-auto max-w-2xl">
					{question.map((q, index) => {
						const currentAnswer = answer[index];
						console.log(currentAnswer);
						const isLoading = loading && !currentAnswer;

						return (
						<div className="space-y-3" key={index}>
							<div className="flex items-center gap-2 text-500">
								<PiSealQuestionThin className="text-primaryWhite text-500 text-2xl w-5 h-5"/>
								<h1 className="text-500 text-primaryWhite text-1xl font-medium">{q}</h1>
							</div>
							{isLoading ? (
								<div className="flex items-center gap-2 text-500">
									<PiSealQuestionThin className="text-primaryWhite text-500 text-2xl w-5 h-5"/>
									<h1 className="text-500 text-primaryWhite text-sm font-medium">Loading...</h1>
								</div>
							) : (
								<h1 className="text-500 text-primaryWhite text-sm font-medium">{currentAnswer}</h1>
							)}
						</div>
						);
					})}
						<div className="flex items-center gap-2 text-500">
							<input
								ref={inputRef}
								type="text"
								placeholder="Ask anything about your car"
								className="w-full rounded-full bg-[#222222] px-6 py-4 text-white placeholder-[#616161] outline-none"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleSearch();
									}
								}}
							/>
							{/* <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#f52f2f] p-2 hover:bg-[#f52f2f]/90" onClick={handleSearch}>
								<ArrowRight className="h-5 w-5 text-white" />
							</button> */}
						</div>
					</div>
				</div>
				<div className="min-h-4">
					<p>MIA may not be perfect. Please verify important information.</p>
				</div>
			</div>
		</div>
	);
}

