	"use client";

	import React, { useRef } from "react";
	import { ArrowRight } from "lucide-react"
	import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
	import { oneLine, stripIndents } from "common-tags";

	export function ChatInput() {
	const supabase = createClientComponentClient();
	const inputRef = useRef() as React.MutableRefObject<HTMLInputElement>;

	const toastError = (message: string) => {
		alert(message);
	};

	const handleSearch = async () => {
		const searchText = inputRef.current.value;

		if (searchText && searchText.trim()) {
			const res = await fetch(location.origin + "/embedding", {
				method: "POST",
				body: JSON.stringify({ text: searchText.replace(/\n/g, " ") }),
			});

			if (res.status !== 200) {
				toastError("Error embedding");
			} else {
				const data = await res.json();
				const { data: documents } = await supabase.rpc("match_documents", {
					match_count: 3,
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
					toastError("No context found");
				}
			}
		}
	}

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
		
			**Example Responses:**
			- "What's John Doe's car?" → "John Doe drives a Toyota. Let me know if you need service history or any maintenance recommendations!"
			- "What color is John Doe's car?" → "John Doe's car is blue! If you're looking to match paint for a repair, I can help with that too."
			- "Does John Doe need an oil change?" → "I don't have recent service data, but if its been over 5,000 km since the last oil change, its a good idea to check. I can help schedule one!"
		`;		
	
		return prompt;
	};

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
		<div className="relative mx-auto max-w-2xl">
		<input
			ref={inputRef}
			type="text"
			placeholder="Type your prompt here"
			className="w-full rounded-full bg-[#222222] px-6 py-4 text-white placeholder-[#616161] outline-none"
			onKeyDown={(e) => {
			if (e.key === "Enter") {
				handleSearch();
			}
			}}
		/>
		<button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#f52f2f] p-2 hover:bg-[#f52f2f]/90" onClick={handleSearch}>
			<ArrowRight className="h-5 w-5 text-white" />
		</button>
		</div>
	)
	}

