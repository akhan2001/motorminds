'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function MiaPage() {
  const [shopId, setShopId] = useState('850e8400-e29b-41d4-a716-446655440001'); // Default shop ID
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hello! I'm Mia, your shop assistant. How can I help you today? Ask me anything about your customers, orders, or business data."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send to API
      const response = await fetch('/mia/api/retrieval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          shop_id: shopId
        }),
      });
      
      const data = await response.json();
      
      // Add assistant message
      setMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: data.message || "I couldn't process that request."
        }
      ]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message
      setMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: "Sorry, I encountered an error processing your request."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-8 text-3xl font-bold">Mia - Shop Data Assistant</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="col-span-2">
          <div className="flex h-[600px] flex-col rounded-lg border shadow-lg">
            <div className="flex-none border-b bg-gray-50 p-4">
              <h2 className="text-lg font-semibold">Ask about your shop data</h2>
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
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 shadow-sm'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div>{message.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-center p-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-500"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="flex border-t p-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your shop data..."
                className="flex-grow resize-none border-0 bg-transparent p-2 focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                Send
              </button>
            </form>
          </div>
        </div>
        
        <div className="rounded-lg border p-4 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Example Questions</h2>
          <ul className="space-y-2">
            <li>• How many customers do I have?</li>
            <li>• Show me new customers from this month</li>
            <li>• List my most recent customers</li>
            <li>• Find customer named John</li>
            <li>• What's my total revenue?</li>
            <li>• Which customers made orders this week?</li>
          </ul>
        </div>
      </div>
    </div>
  );
}