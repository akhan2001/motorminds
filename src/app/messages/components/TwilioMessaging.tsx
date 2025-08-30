"use client"

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Send, Plus, MessageCircle, User, Clock, Car, Mail, ExternalLink, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import SendNewMessage from './SendNewMessage';

// Types
interface PhoneNumber {
    id: string;
    phone_number: string;
    friendly_name: string;
    status: string;
}

interface Customer {
    id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone: string;
    customer_address?: string;
    customer_vehicle?: any;
    license_plate?: string;
    notes?: string;
    tags?: string[];
}

interface Message {
    id: string;
    direction: 'inbound' | 'outbound';
    message_body: string;
    created_at: string;
    from_number: string;
    to_number: string;
    customer_id?: string;
    customer?: Customer;
}

interface Conversation {
    id: string;
    customer_phone: string;
    customer_name?: string;
    customer_id?: string;
    last_message_at: string;
    customer?: Customer;
    recent_message?: {
        message_body: string;
        direction: 'inbound' | 'outbound';
        created_at: string;
    };
}

interface TwilioMessagingProps {
    shopId: string;
}

export default function TwilioMessaging({ shopId }: TwilioMessagingProps) {
    const router = useRouter();
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedPhone, setSelectedPhone] = useState<string>('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    
    // Refs for real-time subscriptions
    const messagesChannelRef = useRef<any>(null);
    const conversationsChannelRef = useRef<any>(null);
    const supabase = createClient();

    // Load data and setup real-time subscriptions
    useEffect(() => {
        loadData();
        setupRealtimeSubscriptions();
        
        // Cleanup on unmount
        return () => {
            if (messagesChannelRef.current) {
                supabase.removeChannel(messagesChannelRef.current);
            }
            if (conversationsChannelRef.current) {
                supabase.removeChannel(conversationsChannelRef.current);
            }
        };
    }, [shopId]);

    // Load messages when phone is selected
    useEffect(() => {
        if (selectedPhone) {
            loadMessages(selectedPhone);
            // Find and set the selected customer
            const conversation = conversations.find(c => c.customer_phone === selectedPhone);
            setSelectedCustomer(conversation?.customer || null);
        }
    }, [selectedPhone, conversations]);

    // Setup real-time subscriptions for instant updates
    const setupRealtimeSubscriptions = () => {
        // Subscribe to new messages
        messagesChannelRef.current = supabase
            .channel('sms_messages_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sms_messages',
                    filter: `shop_id=eq.${shopId}`,
                },
                (payload) => {
                    console.log('Real-time message update:', payload);
                    
                    if (payload.eventType === 'INSERT') {
                        const newMessage = payload.new as Message;
                        
                        // Add to messages if it's for the currently selected phone
                        if (selectedPhone && 
                            (newMessage.from_number === selectedPhone || newMessage.to_number === selectedPhone)) {
                            setMessages(prev => [...prev, newMessage]);
                        }
                        
                        // Always refresh conversations when new message comes in
                        loadConversations();
                        
                        // Show notification for incoming messages
                        if (newMessage.direction === 'inbound') {
                            toast.success(`New message from ${newMessage.from_number}`);
                        }
                    }
                }
            )
            .subscribe();

        // Subscribe to conversation changes
        conversationsChannelRef.current = supabase
            .channel('sms_conversations_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sms_conversations',
                    filter: `shop_id=eq.${shopId}`,
                },
                () => {
                    console.log('Real-time conversation update');
                    loadConversations();
                }
            )
            .subscribe();
    };

    const loadData = async () => {
        setIsInitialLoading(true);
        try {
            await Promise.all([
                loadPhoneNumbers(),
                loadConversations()
            ]);
        } finally {
            setIsInitialLoading(false);
        }
    };

    const loadPhoneNumbers = async () => {
        try {
            const response = await fetch('/api/twilio/phone-numbers');
            if (response.ok) {
                const data = await response.json();
                setPhoneNumbers(data.phoneNumbers || []);
            }
        } catch (error) {
            console.error('Failed to load phone numbers:', error);
        }
    };

    const loadConversations = async () => {
        try {
            console.log('Loading conversations...');
            const response = await fetch('/api/twilio/conversations');
            if (response.ok) {
                const data = await response.json();
                console.log('Loaded conversations:', data.conversations?.length || 0);
                setConversations(data.conversations || []);
            } else {
                console.error('Failed to load conversations:', response.status);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const loadMessages = async (customerPhone: string) => {
        try {
            console.log('Loading messages for phone:', customerPhone);
            const response = await fetch(`/api/twilio/messages?customerPhone=${encodeURIComponent(customerPhone)}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Loaded messages:', data.messages?.length || 0);
                setMessages(data.messages || []);
            } else {
                console.error('Failed to load messages:', response.status);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };



    const sendMessage = async (phoneNumber: string, customerName?: string) => {
        if (!newMessage.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/twilio/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: phoneNumber,
                    body: newMessage,
                    customerName: customerName,
                }),
            });

            if (response.ok) {
                setNewMessage('');
                if (selectedPhone === phoneNumber) {
                    // Message will be added via real-time subscription
                }
                // Conversations will be updated via real-time subscription
                toast.success('Message sent successfully');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsLoading(false);
        }
    };



    const navigateToCustomer = (customerId: string) => {
        router.push(`/customers/${customerId}`);
    };



    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (isInitialLoading) {
        return (
            <Card className="bg-[#111] border-[#222]">
                <CardContent className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading messaging...</p>
                </CardContent>
            </Card>
        );
    }

    if (phoneNumbers.length === 0) {
        return (
            <Card className="bg-[#111] border-[#222]">
                <CardContent className="p-6 text-center">
                    <Phone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2 text-white">No SMS Phone Numbers</h3>
                    <p className="text-gray-400 mb-4">
                        You need to have a Twilio phone number assigned to start SMS messaging.
                    </p>
                    <p className="text-sm text-gray-500">
                        Contact your administrator to assign a SMS-enabled phone number to your shop.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="conversations" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#222]">
                    <TabsTrigger value="conversations" className="data-[state=active]:bg-[#333]">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Conversations
                    </TabsTrigger>
                    <TabsTrigger value="compose" className="data-[state=active]:bg-[#333]">
                        <Plus className="h-4 w-4 mr-2" />
                        New Message
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="conversations" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                        {/* Conversations List */}
                        <div className="lg:col-span-1">
                            <Card className="bg-[#111] border-[#222] h-full">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <MessageCircle className="h-5 w-5" />
                                            Conversations
                                        </CardTitle>
                                        <Button
                                            onClick={loadConversations}
                                            size="sm"
                                            variant="outline"
                                            className="text-xs text-white"
                                        >
                                            Refresh
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ScrollArea className="h-[500px]">
                                        <div className="space-y-1 p-4">
                                            {conversations.map((conversation) => (
                                                <div
                                                    key={conversation.id}
                                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                        selectedPhone === conversation.customer_phone
                                                            ? 'bg-[#222] border border-[#333]'
                                                            : 'hover:bg-[#1a1a1a]'
                                                    }`}
                                                    onClick={() => setSelectedPhone(conversation.customer_phone)}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                {conversation.customer_id ? (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigateToCustomer(conversation.customer_id!);
                                                                        }}
                                                                        className="text-white font-medium truncate block hover:text-red-400 transition-colors text-left flex items-center gap-1"
                                                                    >
                                                                        {conversation.customer?.customer_name || conversation.customer_name || conversation.customer_phone}
                                                                        <ExternalLink className="h-3 w-3 opacity-60" />
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-white font-medium truncate block">
                                                                        {conversation.customer?.customer_name || conversation.customer_name || conversation.customer_phone}
                                                                    </span>
                                                                )}
                                                                {conversation.customer?.customer_email && (
                                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                        <Mail className="h-3 w-3" />
                                                                        {conversation.customer.customer_email}
                                                                    </span>
                                                                )}
                                                                {conversation.customer?.license_plate && (
                                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                        <Car className="h-3 w-3" />
                                                                        {conversation.customer.license_plate}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-400 truncate mb-1">
                                                        {conversation.recent_message?.direction === 'outbound' && 'You: '}
                                                        {conversation.recent_message?.message_body || 'No messages yet'}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-gray-500">{conversation.customer_phone}</p>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatTime(conversation.last_message_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {conversations.length === 0 && (
                                                <div className="text-center py-8">
                                                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                                    <p className="text-gray-400 text-sm">No conversations yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Chat Area */}
                        <div className="lg:col-span-2">
                            <Card className="bg-[#111] border-[#222] h-full">
                                {selectedPhone ? (
                                    <>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {selectedCustomer?.id ? (
                                                            <button
                                                                onClick={() => navigateToCustomer(selectedCustomer.id)}
                                                                className="text-white font-bold text-lg hover:text-red-400 transition-colors flex items-center gap-2"
                                                            >
                                                                {selectedCustomer.customer_name || conversations.find(c => c.customer_phone === selectedPhone)?.customer_name || selectedPhone}
                                                                <ExternalLink className="h-4 w-4 opacity-60" />
                                                            </button>
                                                        ) : (
                                                            <CardTitle className="text-white">
                                                                {selectedCustomer?.customer_name || conversations.find(c => c.customer_phone === selectedPhone)?.customer_name || selectedPhone}
                                                            </CardTitle>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-400">{selectedPhone}</p>
                                                    {selectedCustomer && (
                                                        <div className="mt-2 space-y-1">
                                                            {selectedCustomer.customer_email && (
                                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" />
                                                                    {selectedCustomer.customer_email}
                                                                </p>
                                                            )}
                                                            {selectedCustomer.license_plate && (
                                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <Car className="h-3 w-3" />
                                                                    {selectedCustomer.license_plate}
                                                                </p>
                                                            )}
                                                            {selectedCustomer.customer_address && (
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {selectedCustomer.customer_address}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <Separator className="bg-[#222]" />
                                        <CardContent className="p-0 flex flex-col h-[450px]">
                                            {/* Messages */}
                                            <ScrollArea className="flex-1 p-4">
                                                <div className="space-y-4">
                                                    {messages.map((message) => (
                                                        <div
                                                            key={message.id}
                                                            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className={`max-w-[70%] p-3 rounded-lg ${
                                                                    message.direction === 'outbound'
                                                                        ? 'bg-red-600 text-white'
                                                                        : 'bg-[#222] text-white'
                                                                }`}
                                                            >
                                                                <p className="text-sm whitespace-pre-wrap">{message.message_body}</p>
                                                                <div className="mt-2">
                                                                    <span className={`text-xs ${
                                                                        message.direction === 'outbound' ? 'text-red-100' : 'text-gray-400'
                                                                    }`}>
                                                                        {formatTime(message.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>

                                            {/* Message Input */}
                                            <div className="p-4 border-t border-[#222]">
                                                <div className="flex gap-2">
                                                    <Textarea
                                                        placeholder="Type your message..."
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        className="bg-[#222] border-[#333] text-white resize-none"
                                                        rows={2}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                sendMessage(selectedPhone, selectedCustomer?.customer_name);
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        onClick={() => sendMessage(selectedPhone, selectedCustomer?.customer_name)}
                                                        disabled={isLoading || !newMessage.trim()}
                                                        size="sm"
                                                        className="self-end bg-red-600 hover:bg-red-700"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </>
                                ) : (
                                    <CardContent className="flex-1 flex items-center justify-center">
                                        <div className="text-center">
                                            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                            <h3 className="text-lg font-medium text-white mb-2">Select a Conversation</h3>
                                            <p className="text-gray-400">
                                                Choose a conversation from the sidebar to start messaging
                                            </p>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="compose" className="space-y-4">
                    <SendNewMessage onMessageSent={loadConversations} />
                </TabsContent>
            </Tabs>
        </div>
    );
}