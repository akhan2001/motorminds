"use client";

import React, { FormEvent, ReactNode, useRef, useState } from "react";
import { Message as AIMessage } from "ai";
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
import { IntermediateStep } from "../chat/components/IntermediateStep";
import { Message as UIMessage } from '@ai-sdk/ui-utils';

// Update Message type definition
type Message = UIMessage & {
  tool_calls?: Array<any>;
  parts?: Array<{ type: string; text: string }>;
};

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

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
      <div className="border border-input bg-secondary rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          className="border-none outline-none bg-transparent p-4"
        />

        <div className="flex justify-between ml-4 mr-2 mb-2">
          <div className="flex gap-3">{props.children}</div>

          <Button type="submit" className="self-end" disabled={props.loading}>
            {props.loading ? (
              <span role="status" className="flex justify-center">
                <LoaderCircle className="animate-spin" />
                <span className="sr-only">Loading...</span>
              </span>
            ) : (
              <span>Send</span>
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
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(
    !!props.showIntermediateStepsToggle,
  );
  const [intermediateStepsLoading, setIntermediateStepsLoading] =
    useState(false);

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});

const chat = useChat({
    api: props.endpoint,
    onResponse(response) {
		const reader = response.body?.getReader();
		if (reader) {
			const readStream = async () => {
				while (true) {
					// console.log('Got response:', response);
					const { done, value } = await reader.read();
					if (done) break;
					// console.log('Received chunk:', new TextDecoder().decode(value));
				}
			};
			readStream().catch(console.error);
		}
    },
    onError: (e) => {
      console.error('Chat error:', e);
      toast.error(`Error while processing your request`, {
        description: e.message,
      });
    }
});

async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (chat.isLoading || intermediateStepsLoading) return;

    if (!showIntermediateSteps) {
      chat.handleSubmit(e);
      return;
    }

    // Some extra work to show intermediate steps properly
    setIntermediateStepsLoading(true);

    chat.setInput("");

	// Construct User Message
    const messagesWithUserReply = chat.messages.concat({
		id: chat.messages.length.toString(),
		content: chat.input,
		role: "user",
		parts: [{
			type: "text",
			text: chat.input,
		}],
	});
  
	// console.log(messagesWithUserReply);

    chat.setMessages(messagesWithUserReply);
	// console.log(chat.messages);

	// Send Message to Endpoint
	const response = await fetch(props.endpoint, {
		method: "POST",
		body: JSON.stringify({
			messages: messagesWithUserReply,
			show_intermediate_steps: true,
		}),
	});
    const json = await response.json();

	// console.log(json);
    setIntermediateStepsLoading(false);

	// Handle Response Errors
    if (!response.ok) {
      toast.error(`Error while processing your request`, {
        description: json.error,
      });
      return;
    }

	// Process Response Messages
    const responseMessages: Message[] = json.messages;
	// console.log(responseMessages);

    // Represent intermediate steps as system messages for display purposes
    // TODO: Add proper support for tool messages
    const toolCallMessages = responseMessages.filter(
      (responseMessage: Message) => {
        return ((responseMessage.role === "assistant" && !!responseMessage.tool_calls?.length) || responseMessage.role === "data");
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
			parts: [{
				type: "text",
				text: JSON.stringify({
					action: aiMessage.tool_calls?.[0],
					observation: toolMessage.content,
				})
			}]
		});
    }
    const newMessages = messagesWithUserReply;
	// console.log(newMessages);
    for (const message of intermediateStepMessages) {
		newMessages.push(message);
		// console.log(message);
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
        parts: [{
			type: "text",
			text: responseMessages[responseMessages.length - 1].content
		}]
      },
    ]);
  }

return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={
          chat.messages.length === 0 ? (
            <div>{props.emptyStateComponent}</div>
          ) : (
            <ChatMessages
              aiEmoji={props.emoji}
              messages={chat.messages as Message[]}
              emptyStateComponent={props.emptyStateComponent}
              sourcesForMessages={sourcesForMessages}
            />
          )
        }
        footer={
          <div className="sticky bottom-8 px-2">
            <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
				<ChatInput
					value={chat.input}
					onChange={chat.handleInputChange}
					onSubmit={sendMessage}
					loading={chat.isLoading || intermediateStepsLoading}
					placeholder={
						props.placeholder ?? "What's it like to be a pirate?"
					}
				>
            	</ChatInput>
          </div>
        }
      ></StickyToBottomContent>
    </StickToBottom>
  );
}