"use client";

import React, { FormEvent, useRef, useState } from "react";
import { type Message } from "ai";
import { useChat } from '@ai-sdk/react'
import { ArrowDown, ArrowRight, LoaderCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { oneLine, stripIndents } from "common-tags";
import ChatStart from "../chat/components/ChatStart";
import ChatFooter from "../chat/components/ChatFooter";
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { streamText } from 'ai';
import { ChatMessageBubble } from "../chat/components/ChatMessageBubble";

interface TextUIPart {
	type: 'text';
	text: string;
}

function ChatMessages(props: {
	messages: Message[];
	emptyStateComponent: React.ReactNode;
	sourcesForMessages: Record<string, any>;
	className?: string;
}) {
	return (
		<div className="flex flex-col max-w-[750px] mx-auto pb-12 w-full">
			{props.messages.map((m, i) => {
				const sourceKey = (props.messages.length - 1 - i).toString();
				return (
					<ChatMessageBubble
					key={m.id}
					message={m}
					sources={props.sourcesForMessages[sourceKey]}
					/>
				);
			})}
		</div>
	);
}

function ScrollToBottom() {
	const { isAtBottom, scrollToBottom } = useStickToBottomContext();

	if (isAtBottom) return null;
	return (
		<Button
			variant="outline"
			onClick={() => scrollToBottom()}
			className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-[#fff] text-black"
		>
			<ArrowDown className="w-4 h-4" />
		</Button>
	)
}

function StickyToBottomContent(props: {
	content: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
	contentClassName?: string;
}) {
	const context = useStickToBottomContext();

	return (
		<div
			ref={context.scrollRef}
			style={{ width: "100%", height: "100%" }}
			className={cn("grid grid-rows-[1fr,auto]", props.className)}
		>
			<div ref={context.contentRef} className={props.contentClassName}>
			{props.content}
			</div>

			{props.footer}
		</div>
	);
}

function InputForm(props: {
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	loading?: boolean;
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<form
			onSubmit={(e) => {
				e.stopPropagation();
				e.preventDefault();
				props.onSubmit(e);
			}}
			className={cn("flex w-full flex-col", props.className)}
		>
		<div className="border border-input border-[#555555] bg-[#222222] rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
			<textarea
				value={props.value}
				placeholder="Ask anything related to your shop..."
				onChange={props.onChange}
				className="border-none outline-none bg-transparent p-4 resize-none text-white placeholder-white/70"
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						props.onSubmit(e as any);
					}
				}}
			/>

			<div className="flex justify-between ml-4 mr-2 mb-2">
				<div className="flex gap-3">{props.children}</div>

				<Button type="submit" className="flex items-center justify-center rounded-full bg-[#f52f2f] w-10 h-10 hover:bg-[#f52f2f]/90" disabled={props.loading}>
					{props.loading ? (
						<span role="status" className="flex justify-center">
						<LoaderCircle className="animate-spin" />
						{/* <span className="sr-only">Loading...</span> */}
						</span>
					) : (
						<ArrowRight className="h-5 w-5 text-white" />
					)}
				</Button>
			</div>
		</div>
		</form>
	);
}

export function ChatInput(props: {
	endpoint: string;
	placeholder: string;
}) {
	const supabase = createClientComponentClient();
	const [answer, setAnswer] = useState<string[]>([]);
	const [sourcesForMessages, setSourcesForMessages] = useState<Record<string, any>>({});
	// const inputRef = useRef<HTMLTextAreaElement>(null);
	// const [question, setQuestion] = useState<string[]>([]);
	// const [loading, setLoading] = useState<boolean>(false);
	// const [isStarted, setIsStarted] = useState<boolean>(false);

	const toastError = (message: string) => {
		alert(message);
	};

	const chat = useChat({
		api: props.endpoint,
		onResponse(response) {
		  const sourcesHeader = response.headers.get("x-sources");
		  const sources = sourcesHeader
			? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
			: [];
	
		  const messageIndexHeader = response.headers.get("x-message-index");
		  if (sources.length && messageIndexHeader !== null) {
			setSourcesForMessages({
			  ...sourcesForMessages,
			  [messageIndexHeader]: sources,
			});
		  }
		},
		onError: (e) => {
			toastError("Error embedding")
		}
	});

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
	};

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

	async function handleSearch(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		// Store the input before clearing it
		const currentInput = chat.input;
		chat.setInput("");

		// Add user message first
		const messagesWithUserReply = chat.messages.concat({
			id: chat.messages.length.toString(),
			content: currentInput,
			role: "user",
			parts: [{ type: "text", text: currentInput } as TextUIPart]
		});
		chat.setMessages(messagesWithUserReply);

		try {
			// Get embeddings
			const response = await fetch("/embedding", {
				method: "POST",
				body: JSON.stringify({ text: messagesWithUserReply.map(message => message.content).join("\n") }),
			});

			if (!response.ok || response.status !== 200) {
				throw new Error("Error processing request");
			}

			// Get context
			const data = await response.json();
			const { data: documents } = await supabase.rpc("match_documents", {
				query_embedding: data.embedding,
				match_threshold: 0.78,
				match_count: 3
			});
			
			// Build context
			let contextText = documents
				.slice(0, documents.reduce((acc: number, doc: any) => acc + doc.token > 1000 ? acc : acc + 1, 0))
				.map((doc: any) => doc.content)
				.join("\n---\n");

			// Generate and get AI response
			const prompt = generatePrompt(currentInput, contextText);
			await generateAnswer(prompt);

			// Add AI response to messages
			if (answer.length > 0) {
				chat.setMessages([
					...messagesWithUserReply,
					{
						id: messagesWithUserReply.length.toString(),
						content: answer[answer.length - 1],
						role: "assistant",
						parts: [{ type: "text", text: answer[answer.length - 1] } as TextUIPart]
					}
				]);
			}
		} catch (error) {
			toastError(error instanceof Error ? error.message : "Error processing request");
		}
	}

	return (
		<StickToBottom className="h-full">
			<StickyToBottomContent
				className="bg-black"
				contentClassName="py-8 px-2"
				content={
				chat.messages.length === 0 ? (
					<div>
						<ChatStart />
					</div>
				) : (
					<ChatMessages
						messages={chat.messages}
						sourcesForMessages={sourcesForMessages}
						emptyStateComponent={<div><ChatStart /></div>}
					/>
				)
			}
			footer={
				<div className="sticky bottom-8 px-2">
					<ScrollToBottom />
					<InputForm
						value={chat.input}
						onChange={chat.handleInputChange}
						onSubmit={handleSearch}
					>
					</InputForm>
					<ChatFooter />
				</div>
			}
			/>
		</StickToBottom>
	);
}
