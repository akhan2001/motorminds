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
import { ChatMessageBubble } from "../chat/components/ChatMessageBubble";
import { toast } from 'sonner';

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
		<div className="border border-[#444444] bg-[#222222] rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
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
	const [intermediateStepsLoading, setIntermediateStepsLoading] = useState(false);
	const [showIntermediateSteps, setShowIntermediateSteps] = useState(false);
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
			console.log("Reached here");
			toastError(e.message)
		}
	});

	async function sendMessage(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
	
		if (!showIntermediateSteps) {
		  chat.handleSubmit(e);
		  return;
		}
	
		// Some extra work to show intermediate steps properly
		// setIntermediateStepsLoading(true);
	
		console.log("Reached here");
		chat.setInput("");
		const messagesWithUserReply = chat.messages.concat
		({
		  	id: chat.messages.length.toString(),
		  	content: chat.input,
		  	role: "user",
			parts: [{ type: "text", text: chat.input } as TextUIPart]
		});
		chat.setMessages(messagesWithUserReply);
		
		console.log("Reached here");
		const response = await fetch(props.endpoint, {
			method: "POST",
			body: JSON.stringify({
				messages: messagesWithUserReply,
				show_intermediate_steps: true,
			}),
		});
		const json = await response.json();
		setIntermediateStepsLoading(false);
	
		console.log("Reached here");
		if (!response.ok) {
		  toast.error(`Error while processing your request`, {
			description: json.error,
		  });
		  return;
		}
	
		console.log("Reached here");
		const responseMessages: Message[] = json.messages;
	
		// Represent intermediate steps as system messages for display purposes
		// TODO: Add proper support for tool messages
		const toolCallMessages = responseMessages.filter(
		  (responseMessage: Message) => {
			return (
			  (responseMessage.role === "assistant" &&
				!!responseMessage.tool_calls?.length) ||
			  responseMessage.role === "tool"
			);
		  },
		);
	
		const intermediateStepMessages = [];
		for (let i = 0; i < toolCallMessages.length; i += 2) {
		  const aiMessage = toolCallMessages[i];
		  const toolMessage = toolCallMessages[i + 1];
		  intermediateStepMessages.push({
			id: (messagesWithUserReply.length + i / 2).toString(),
			role: "system" as const,
			content: JSON.stringify({
			  action: aiMessage.tool_calls?.[0],
			  observation: toolMessage.content,
			}),
		  });
		}
		const newMessages = messagesWithUserReply;
		for (const message of intermediateStepMessages) {
		  newMessages.push(message);
		  chat.setMessages([...newMessages]);
		  await new Promise((resolve) =>
			setTimeout(resolve, 1000 + Math.random() * 1000),
		  );
		}
	
		chat.setMessages([
		  ...newMessages,
		  {
			id: newMessages.length.toString(),
			content: responseMessages[responseMessages.length - 1].content,
			role: "assistant",
		  },
		]);
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
						onSubmit={sendMessage}
						loading={chat.isLoading || intermediateStepsLoading}
					>
					</InputForm>
					<ChatFooter />
				</div>
			}
			/>
		</StickToBottom>
	);
}
