"use client";

import { type Message } from "ai";
import { useChat } from "ai/react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { ChatMessageBubble } from "@/app/chat/components/ChatMessageBubble";
import { IntermediateStep } from "@/app/chat/components/IntermediateStep";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight, LoaderCircle, Paperclip, Database, CloudLightning } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatFooter from "@/app/chat/components/ChatFooter";
import { Switch } from "@/components/ui/switch"


function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  sourcesForMessages: Record<string, any>;
  aiEmoji?: string;
  className?: string;
  shopId?: string;
  onFormSubmit?: (formType: string, data: any) => void;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      {props.messages.map((m, i) => {
        if (m.role === "system") {
          return <IntermediateStep key={m.id} message={m} />;
        }

        const sourceKey = (props.messages.length - 1 - i).toString();
        return (
          <ChatMessageBubble
            key={m.id}
            message={m}
            aiEmoji={props.aiEmoji}
            sources={props.sourcesForMessages[sourceKey]}
            shopId={props.shopId}
            onFormSubmit={props.onFormSubmit}
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
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-[#f52f2f] text-white border-none hover:bg-[#d50000] hover:text-white transition-all duration-300 ease-in-out"
    >
      <ArrowDown className="w-4 h-4" />
    </Button>
  );
}

function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
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
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              props.onSubmit(e as any);
            }
          }}
        />

        <div className="flex justify-between ml-4 mr-2 mb-2">
          <div className="flex gap-3">{props.children}</div>
          <Button
            type="submit"
            className="flex items-center justify-center rounded-full bg-[#f52f2f] w-10 h-10 hover:bg-[#f52f2f]/90"
            disabled={props.loading}
          >
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

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  // scrollRef will also switch between overflow: unset to overflow: auto
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

export function ChatWindow(props: {
	endpoint: string;
	emptyStateComponent: ReactNode;
	placeholder?: string;
	emoji?: string;
	showIngestForm?: boolean;
	showIntermediateStepsToggle?: boolean;
	shopId?: string;
}) {
	const [lookAtDatabase, setLookAtDatabase] = useState(false);

	const handleSwitchToggle = (lookAtDatabase: boolean) => {
		setLookAtDatabase(lookAtDatabase);
		if (lookAtDatabase) {
			toast("Looking at database...", {
				icon: "🔍",
				description: "You can now ask questions about your database.",
			});
		} else {
			toast("Not looking at database...", {
				icon: "🔍",
				description: "Click on the switch to connect to the database.",
			});
		}
	};

	const [showIntermediateSteps, setShowIntermediateSteps] = useState(
		!!props.showIntermediateStepsToggle
	);

	const [intermediateStepsLoading, setIntermediateStepsLoading] = useState(false);

	const [sourcesForMessages, setSourcesForMessages] = useState<Record<string, any>>({});

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
		onFinish(message) {
			// Check if the message contains the [CUSTOMER_FORM] tag
			if (message.content.includes('[CUSTOMER_FORM]') && props.shopId) {
				// Extract any name from the message (if present)
				const nameMatch = message.content.match(/for\s+([A-Za-z\s]+)/i);
				const customerName = nameMatch ? nameMatch[1].trim() : '';
				
				// Create an updated message that keeps the original content but adds form properties
				const updatedMessage = {
					...message,
					formType: 'customer-form',
					formData: { name: customerName }
				};
				
				// Update the messages array with the modified message
				const messages = chat.messages.slice(0, -1).concat(updatedMessage);
				chat.setMessages(messages);
			}
		},
		streamMode: "text",
		onError: (e) =>
		toast.error(`Error while processing your request`, {
			description: e.message,
		}),
		body: {
			show_intermediate_steps: showIntermediateSteps,
			look_at_database: lookAtDatabase,
		}
	});

	// Handle form submissions from chat messages
	const handleFormSubmit = (formType: string, data: any) => {
		// Add a user message acknowledging the form submission
		let userMessage, assistantMessage;
		
		if (formType === 'customer-form') {
			userMessage = {
				id: (chat.messages.length + 1).toString(),
				content: `I've completed the ${formType.replace('-', ' ')} for ${data.customer_name || 'the customer'}.`,
				role: "user" as const,
			};
			
			assistantMessage = {
				id: (chat.messages.length + 2).toString(),
				content: `Great! I've created a new customer record for ${data.customer_name}. The customer has been added to your database. Is there anything else you'd like to do with this customer?`,
				role: "assistant" as const,
			};
		} else if (formType === 'invoice-form') {
			userMessage = {
				id: (chat.messages.length + 1).toString(),
				content: `I've completed the invoice form for ${data.customer_name || 'the customer'}.`,
				role: "user" as const,
			};
			
			assistantMessage = {
				id: (chat.messages.length + 2).toString(),
				content: `Great! I've created a new invoice for ${data.customer_name} with an amount of $${parseFloat(data.amount).toFixed(2)}. The invoice has been added to your database with status "UNPAID". Would you like to do anything else with this invoice?`,
				role: "assistant" as const,
			};
		} else {
			// Default fallback for unknown form types
			userMessage = {
				id: (chat.messages.length + 1).toString(),
				content: `I've completed the form.`,
				role: "user" as const,
			};
			
			assistantMessage = {
				id: (chat.messages.length + 2).toString(),
				content: `Thank you for submitting the form. The data has been processed. Is there anything else I can help you with?`,
				role: "assistant" as const,
			};
		}

		// Update the chat messages
		chat.setMessages([...chat.messages, userMessage, assistantMessage]);
	};

	async function sendMessage(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (chat.isLoading || intermediateStepsLoading) return;

		// Check for invoice creation intent
		const invoiceCreationRegex = /create\s+(a|me|new|an|)\s*(invoice)/i;
		const invoiceMatch = chat.input.match(invoiceCreationRegex);
		
		if (invoiceMatch && props.shopId) {
			// Create a form message for invoice
			const userMessage = {
				id: chat.messages.length.toString(),
				content: chat.input,
				role: "user" as const,
			};
			
			const formMessage = {
				id: (chat.messages.length + 1).toString(),
				content: `I'll help you create a new invoice. Please fill out the form below:`,
				role: "assistant" as const,
				formType: "invoice-form",
				formData: {}
			};
			
			// Update messages and clear input
			chat.setMessages([...chat.messages, userMessage, formMessage]);
			chat.setInput("");
			return;
		}

		// Continue with normal message handling
		if (!showIntermediateSteps) {
			chat.handleSubmit(e);
			return;
		} else {
			// Some extra work to show intermediate steps properly
			setIntermediateStepsLoading(true);

			chat.setInput("");
			const messagesWithUserReply = chat.messages.concat({
				id: chat.messages.length.toString(),
				content: chat.input,
				role: "user",
			});
			chat.setMessages(messagesWithUserReply);

			const response = await fetch(props.endpoint, {
				method: "POST",
				body: JSON.stringify({
					messages: messagesWithUserReply,
					show_intermediate_steps: true,
					look_at_database: lookAtDatabase,
				}),
			});

			const json = await response.json();
			setIntermediateStepsLoading(false);

			if (!response.ok) {
				toast.error(`Error while processing your request`, {
				description: json.error,
			});
				return;
			}

			const responseMessages: Message[] = json.messages;

			// Represent intermediate steps as system messages for display purposes
			// TODO: Add proper support for tool messages
			const toolCallMessages = responseMessages.filter(
			(responseMessage: Message) => {
				return (
					(responseMessage.role === "assistant" && !!responseMessage.tool_calls?.length) || responseMessage.role === "tool"
				);
			}
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
				setTimeout(resolve, 1000 + Math.random() * 1000)
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
	}

	return (
		<StickToBottom className="h-full">
			<StickyToBottomContent
				className="bg-black"
				contentClassName="py-8 px-2"
				content={
					chat.messages.length === 0 ? (
						<div>{props.emptyStateComponent}</div>
					) : (
						<ChatMessages
							messages={chat.messages}
							emptyStateComponent={props.emptyStateComponent}
							sourcesForMessages={sourcesForMessages}
							shopId={props.shopId}
							onFormSubmit={handleFormSubmit}
						/>
					)
				}
				footer={
					<div className="sticky bottom-8 px-2">
						<ScrollToBottom />
						<ChatInput
						value={chat.input}
						onChange={chat.handleInputChange}
						onSubmit={sendMessage}
						loading={chat.isLoading || intermediateStepsLoading}
						>
						<div className="flex items-center gap-2">
							<Button
								onClick={() => handleSwitchToggle(!lookAtDatabase)}
								className={`rounded-full transition-colors duration-300 ${
									lookAtDatabase 
										? 'bg-blue-600/40 hover:bg-blue-600/60 text-white border border-blue-400/70' 
										: 'bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-600 hover:border-gray-400 hover:text-white'
								}`}
								size="sm"
							>
								<Database className={`w-4 h-4 mr-2 ${lookAtDatabase ? 'text-blue-200' : 'text-gray-400'}`} />
								Database
							</Button>
							<Button
								className={`rounded-full transition-colors duration-300 ${
									lookAtDatabase 
										? 'bg-blue-600/40 hover:bg-blue-600/60 text-white border border-blue-400/70' 
										: 'bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-600 hover:border-gray-400 hover:text-white'
								}`}
								size="sm"
							>
								<CloudLightning className={`w-4 h-4 mr-1 ${lookAtDatabase ? 'text-blue-200' : 'text-gray-400'}`} />
								Action
							</Button>
						</div>
						</ChatInput>
						<ChatFooter />
					</div>
				}
			></StickyToBottomContent>
		</StickToBottom>
	);
}
