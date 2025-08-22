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
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isBookingMode, setIsBookingMode] = useState(false);
    const [appointmentCreated, setAppointmentCreated] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [showTimeSlots, setShowTimeSlots] = useState(false);
    const searchParams = useSearchParams();
    const shopId = searchParams ? searchParams.get("shopId") : null;
    const conversationId = useRef<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        if (shopId) {
            fetch(`/api/widget/config/${shopId}`)
                .then(res => res.json())
                .then(setConfig);
        }
    }, [shopId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleBookAppointment = () => {
        setIsBookingMode(true);
        const bookingMessage: Message = { 
            id: crypto.randomUUID(), 
            role: "assistant", 
            content: "I'd love to help you book an appointment! Let me gather some information from you. What service do you need?" 
        };
        setMessages([bookingMessage]);
        setInput("");
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading || isLocked) return;

        const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        const res = await fetch('/api/widget/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [...messages, userMessage], 
                conversation_id: conversationId.current,
                shopId: shopId,
                isBookingMode: isBookingMode
            })
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
            
            // Check if appointment was successfully created
            if (assistantResponse.includes('✅ Perfect! Your appointment has been confirmed')) {
                setAppointmentCreated(true);
                setIsLocked(true); // Lock the chat input
            }
        }
    };

    const fetchAvailableSlots = async (date: string, serviceType: string = "") => {
        if (!shopId || !date) return;
        
        try {
            const response = await fetch(`/api/widget/availability/${shopId}?date=${date}&service_type=${serviceType}`);
            if (response.ok) {
                const data = await response.json();
                setAvailableSlots(data.availableSlots || []);
                setShowTimeSlots(true);
            } else {
                console.error('Failed to fetch available slots');
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error('Error fetching available slots:', error);
            setAvailableSlots([]);
        }
    };

    const handleTimeSlotSelect = (slot: any) => {
        const timeSlotMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: slot.display_time
        };
        setMessages(prev => [...prev, timeSlotMessage]);
        setShowTimeSlots(false);
        setAvailableSlots([]);
        
        // Continue with the booking process
        // The AI will see this time selection and proceed to book
        handleChatContinuation(slot.display_time);
    };

    const handleChatContinuation = async (selectedTime: string) => {
        setIsLoading(true);
        
        const allMessages = [...messages, { id: crypto.randomUUID(), role: "user", content: selectedTime }];
        
        const res = await fetch('/api/widget/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: allMessages,
                conversation_id: conversationId.current,
                shopId: shopId,
                isBookingMode: isBookingMode
            })
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
            
            // Check if appointment was successfully created
            if (assistantResponse.includes('✅ Perfect! Your appointment has been confirmed')) {
                setAppointmentCreated(true);
                setIsLocked(true); // Lock the chat input
            }
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
                {messages.length === 0 && !appointmentCreated && (
                    <div style={styles.welcomeContainer}>
                        {config.welcomeMessage && (
                            <div style={styles.aiMessage}>
                                <p style={styles.messageText}>{config.welcomeMessage}</p>
                            </div>
                        )}
                        <div style={styles.bookingPrompt}>
                            <p style={styles.promptText}>Need to schedule a service appointment?</p>
                            <button 
                                onClick={handleBookAppointment}
                                style={{ ...styles.bookingButton, backgroundColor: config.primaryColor }}
                                disabled={isLoading}
                            >
                                📅 Book an Appointment
                            </button>
                            <p style={styles.promptSubtext}>Or ask me any questions about our services!</p>
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} style={m.role === 'user' ? styles.userMessage(config) : styles.aiMessage}>
                        <p style={styles.messageText}>{m.content}</p>
                    </div>
                ))}
                
                {/* Time Slot Selection */}
                {showTimeSlots && availableSlots.length > 0 && (
                    <div style={styles.timeSlotsContainer}>
                        <p style={styles.timeSlotsTitle}>Available time slots:</p>
                        <div style={styles.timeSlotsGrid}>
                            {availableSlots.map((slot, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleTimeSlotSelect(slot)}
                                    style={{...styles.timeSlotButton, backgroundColor: config.primaryColor}}
                                    disabled={isLoading}
                                >
                                    {slot.display_time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {isLoading && <div style={styles.aiMessage}><p style={styles.typingIndicator}>Typing...</p></div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleFormSubmit} style={styles.inputArea}>
                <input
                    style={{...styles.input, opacity: isLocked ? 0.6 : 1}}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isLocked ? "Chat completed - appointment confirmed!" : "Type a message..."}
                    disabled={isLoading || isLocked}
                />
                <button 
                    type="submit" 
                    style={{ 
                        ...styles.button, 
                        backgroundColor: isLocked ? '#6b7280' : config.primaryColor,
                        opacity: isLocked ? 0.6 : 1
                    }} 
                    disabled={isLoading || isLocked}
                >
                    {isLoading ? "..." : isLocked ? "Locked" : "Send"}
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
    welcomeContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    } as CSSProperties,
    bookingPrompt: {
        backgroundColor: "#ffffff",
        padding: "1.5rem",
        borderRadius: "0.75rem",
        textAlign: "center",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    } as CSSProperties,
    promptText: {
        margin: "0 0 1rem 0",
        fontSize: "1.1rem",
        fontWeight: "600",
        color: "#333",
    } as CSSProperties,
    promptSubtext: {
        margin: "1rem 0 0 0",
        fontSize: "0.9rem",
        color: "#666",
    } as CSSProperties,
    bookingButton: {
        padding: "0.75rem 1.5rem",
        border: "none",
        borderRadius: "0.5rem",
        color: "white",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
        transform: "scale(1)",
    } as CSSProperties,
    successMessage: {
        backgroundColor: "#f0f9ff",
        padding: "2rem 1.5rem",
        borderRadius: "0.75rem",
        textAlign: "center",
        border: "1px solid #0ea5e9",
    } as CSSProperties,
    successText: {
        margin: "0 0 0.5rem 0",
        fontSize: "1.2rem",
        fontWeight: "600",
        color: "#0369a1",
    } as CSSProperties,
    successSubtext: {
        margin: "0",
        fontSize: "0.9rem",
        color: "#0284c7",
    } as CSSProperties,
    timeSlotsContainer: {
        backgroundColor: "#ffffff",
        padding: "1rem",
        borderRadius: "0.75rem",
        border: "1px solid #e5e7eb",
        margin: "0.5rem 0",
    } as CSSProperties,
    timeSlotsTitle: {
        margin: "0 0 1rem 0",
        fontSize: "1rem",
        fontWeight: "600",
        color: "#333",
    } as CSSProperties,
    timeSlotsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
        gap: "0.5rem",
    } as CSSProperties,
    timeSlotButton: {
        padding: "0.5rem 1rem",
        border: "none",
        borderRadius: "0.375rem",
        color: "white",
        fontSize: "0.875rem",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s",
        opacity: "1",
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

