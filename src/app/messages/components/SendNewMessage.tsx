"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus } from 'lucide-react';
import { toast } from 'sonner';
import CustomerSelection from '@/app/(features)/customers/components/Selection/CustomerSelection';

// Types
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

interface SendNewMessageProps {
    onMessageSent?: () => void;
}

export default function SendNewMessage({ onMessageSent }: SendNewMessageProps) {
    const [newMessage, setNewMessage] = useState('');
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const [newCustomerName, setNewCustomerName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Handle customer selection from dropdown
    const handleCustomerSelect = (customer: Customer | null) => {
        setSelectedCustomer(customer);
        if (customer) {
            setNewPhoneNumber(customer.customer_phone);
            setNewCustomerName(customer.customer_name);
        }
    };

    const sendNewMessage = async () => {
        if (!newMessage.trim() || !newPhoneNumber.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/twilio/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: newPhoneNumber,
                    body: newMessage,
                    customerName: newCustomerName,
                }),
            });

            if (response.ok) {
                // Reset form
                setNewMessage('');
                setNewPhoneNumber('');
                setNewCustomerName('');
                setSelectedCustomer(null);
                
                toast.success('Message sent successfully');
                
                // Callback to parent component
                if (onMessageSent) {
                    onMessageSent();
                }
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


    return (
        <Card className="bg-slate-50 dark:bg-card border-border">
            <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Send New Message
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Select Customer
                    </label>
                    <CustomerSelection
                        selectedCustomer={selectedCustomer}
                        onCustomerSelect={handleCustomerSelect}
                        placeholder="Search customers by name, email, or phone..."
                        className="w-full"
                    />
                </div>

                {/* Manual Phone Number Entry */}
                <div className="pt-4 border-t border-border">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Or Enter Phone Number Manually
                    </label>
                    <Input
                        placeholder="+1234567890"
                        value={newPhoneNumber}
                        onChange={(e) => {
                            setNewPhoneNumber(e.target.value);
                            // Clear selected customer if manually editing phone
                            if (selectedCustomer && e.target.value !== selectedCustomer.customer_phone) {
                                setSelectedCustomer(null);
                            }
                        }}
                        className="bg-white dark:bg-background border-border text-foreground"
                    />
                    <div className="mt-2">
                        <Input
                            placeholder="Customer name (optional)"
                            value={newCustomerName}
                            onChange={(e) => {
                                setNewCustomerName(e.target.value);
                                // Clear selected customer if manually editing name
                                if (selectedCustomer && e.target.value !== selectedCustomer.customer_name) {
                                    setSelectedCustomer(null);
                                }
                            }}
                            className="bg-white dark:bg-background border-border text-foreground"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Enter phone number in international format (e.g., +1234567890)
                    </p>
                </div>
                
                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Message
                    </label>
                    <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-white dark:bg-background border-border text-foreground min-h-[120px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendNewMessage();
                            }
                        }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        {newMessage.length}/1600 characters
                    </p>
                </div>
                
                <Button
                    onClick={sendNewMessage}
                    disabled={isLoading || !newMessage.trim() || !newPhoneNumber.trim()}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                </Button>
            </CardContent>
        </Card>
    );
}
