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
import { ArrowDown, ArrowRight, LoaderCircle, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatFooter from "@/app/chat/components/ChatFooter";
import { Switch } from "@/components/ui/switch"

function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  sourcesForMessages: Record<string, any>;
  aiEmoji?: string;
  className?: string;
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
}) {
	const [lookAtDatabase, setLookAtDatabase] = useState(false);

	const handleSwitchToggle = (lookAtDatabase: boolean) => {
		setLookAtDatabase(lookAtDatabase);
		console.log("Look at database: ", lookAtDatabase);
	};

	const [showIntermediateSteps, setShowIntermediateSteps] = useState(
		!!props.showIntermediateStepsToggle
	);
	const [intermediateStepsLoading, setIntermediateStepsLoading] =
		useState(false);

	const [sourcesForMessages, setSourcesForMessages] = useState<
		Record<string, any>
	>({});

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

	async function sendMessage(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (chat.isLoading || intermediateStepsLoading) return;

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
						<Switch
						checked={lookAtDatabase}
						onCheckedChange={handleSwitchToggle}
						/>
						<span className="text-sm text-white/70">Connect to Database</span>
					</div>
					{/* <Button
						onClick={() => handleSwitchToggle(lookAtDatabase)}
						className={`px-4 py-2 rounded transition-colors duration-300 ${
						lookAtDatabase ? 'bg-red-500 text-white border-red-500' : 'bg-gray-300 text-gray-700 border-gray-300'
						}`}
					>
						Connect to Database
					</Button> */}
					</ChatInput>
					<ChatFooter />
				</div>
			}
		></StickyToBottomContent>
		</StickToBottom>
	);
}
