'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TextareaAutosize from 'react-textarea-autosize';

// Add LoadingCircle component
const LoadingCircle = () => (
  <div className="flex justify-center">
    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-500"></div>
  </div>
);

export default function ChatWindowComponent() {
  const [shopId, setShopId] = useState('850e8400-e29b-41d4-a716-446655440001'); // Default shop ID
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/mia/api/retrieval',
    body: {
      shop_id: shopId
    },
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your shop assistant. Ask me anything about your customers, orders, or business data."
      }
    ]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex h-[600px] flex-col rounded-lg border shadow-lg">
      <div className="flex-none border-b bg-gray-50 p-4">
        <h2 className="text-lg font-semibold">Shop Data Assistant</h2>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-4 flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-3/4 rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || ''}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && <LoadingCircle />}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="flex border-t p-2">
        <TextareaAutosize
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your shop data..."
          className="flex-grow resize-none border-0 bg-transparent p-2 focus:outline-none"
          maxRows={5}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
<<<<<<< HEAD
          disabled={isLoading || !input?.trim()}
=======
          disabled={isLoading || !input || !input.trim()}
>>>>>>> e9af15cf5eea98c8567569682b7e7581af0f9276
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          Send
        </button>
      </form>
    </div>
  );
}