"use client";

import { useState, useEffect, CSSProperties, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface WidgetConfig {
    primaryColor: string;
    headerText: string;
    logoUrl?: string;
    welcomeMessage?: string;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export default function WidgetPage() {
    const [config, setConfig] = useState<WidgetConfig | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const shopId = searchParams ? searchParams.get("shopId") : null;
    const domain = searchParams ? searchParams.get("domain") : null;
    const conversationId = useRef<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (shopId && domain) {
            fetch(`/api/widget/config/${shopId}`)
                .then(res => res.json())
                .then(setConfig);

            fetch("/api/widget/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shopId, domain }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    setToken(data.token);
                    setIsAuthenticated(true);
                }
            })
            .catch(console.error);
        }
    }, [shopId, domain]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !isAuthenticated) return;

        const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        const res = await fetch('/api/widget/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ messages: [...messages, userMessage], conversation_id: conversationId.current })
        });

        setIsLoading(false);
        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const assistantMessageId = crypto.randomUUID();
        if (!conversationId.current) conversationId.current = assistantMessageId;
        
        setMessages(prev => [...prev, {id: assistantMessageId, role: 'assistant', content: ''}]);

        let assistantResponse = "";
        while(true) {
            const { done, value } = await reader.read();
            if (done) break;
            assistantResponse += decoder.decode(value);
            setMessages(prev => prev.map(m => m.id === assistantMessageId ? {...m, content: assistantResponse} : m));
        }
    };

    if (!config) {
        return <div style={styles.container}><p>Loading...</p></div>;
    }

    return (
        <div style={styles.container}>
            <div style={{ ...styles.header, backgroundColor: config.primaryColor }}>
                {config.logoUrl && <img src={config.logoUrl} alt="Shop Logo" style={styles.logo} />}
                <h3 style={styles.headerText}>{config.headerText}</h3>
            </div>
            <div style={styles.messageArea}>
                {messages.length === 0 && config.welcomeMessage && (
                    <div style={styles.aiMessage}><p style={styles.messageText}>{config.welcomeMessage}</p></div>
                )}
                {messages.map((m) => (
                    <div key={m.id} style={m.role === 'user' ? styles.userMessage(config) : styles.aiMessage}>
                        <p style={styles.messageText}>{m.content}</p>
                    </div>
                ))}
                {isLoading && <div style={styles.aiMessage}><p style={styles.typingIndicator}>Typing...</p></div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleFormSubmit} style={styles.inputArea}>
                <input
                    style={styles.input}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isAuthenticated ? "Type a message..." : "Authenticating..."}
                    disabled={isLoading || !isAuthenticated}
                />
                <button type="submit" style={{ ...styles.button, backgroundColor: config.primaryColor }} disabled={isLoading || !isAuthenticated}>
                    {isLoading ? "..." : "Send"}
                </button>
            </form>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#f4f7f9",
    } as CSSProperties,
    header: {
        padding: "1rem",
        color: "white",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    } as CSSProperties,
    logo: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        marginRight: "1rem",
    } as CSSProperties,
    headerText: {
        margin: 0,
        fontSize: "1.2rem",
        fontWeight: "600",
    } as CSSProperties,
    messageArea: {
        flex: 1,
        padding: "1rem",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
    } as CSSProperties,
    userMessage: (config: WidgetConfig) => ({
        alignSelf: "flex-end",
        backgroundColor: config.primaryColor,
        color: "white",
        borderRadius: "1.25rem 0.5rem 1.25rem 1.25rem",
        padding: "0.75rem 1.25rem",
        maxWidth: "80%",
    } as CSSProperties),
    aiMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#ffffff",
        color: "#333",
        borderRadius: "0.5rem 1.25rem 1.25rem 1.25rem",
        padding: "0.75rem 1.25rem",
        maxWidth: "80%",
        border: "1px solid #e5e7eb",
    } as CSSProperties,
    typingIndicator: {
        margin: 0,
        fontStyle: "italic",
        color: "#666",
    } as CSSProperties,
    messageText: {
        margin: 0,
        whiteSpace: "pre-wrap",
    } as CSSProperties,
    inputArea: {
        display: "flex",
        padding: "1rem",
        borderTop: "1px solid #e0e0e0",
        backgroundColor: "#ffffff",
    } as CSSProperties,
    input: {
        flex: 1,
        padding: "0.75rem",
        border: "1px solid #ccc",
        borderRadius: "0.5rem",
        marginRight: "0.5rem",
        fontSize: "1rem",
    } as CSSProperties,
    button: {
        padding: "0.75rem 1.5rem",
        border: "none",
        color: "white",
        borderRadius: "0.5rem",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: "600",
        transition: "background-color 0.2s",
    } as CSSProperties,
};
