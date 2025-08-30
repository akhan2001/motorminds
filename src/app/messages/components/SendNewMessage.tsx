"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Send, Plus, Car, Mail, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

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
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Customer search functionality with debounce
    const searchCustomers = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setShowCustomerDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.customers || []);
                setShowCustomerDropdown(true);
            }
        } catch (error) {
            console.error('Failed to search customers:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (customerSearch) {
                searchCustomers(customerSearch);
            }
        }, 300);

        return () => clearTimeout(delayedSearch);
    }, [customerSearch]);

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
                setShowCustomerDropdown(false);
                setSearchResults([]);
                setCustomerSearch('');
                
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

    const selectCustomerForNewMessage = (customer: Customer) => {
        setNewPhoneNumber(customer.customer_phone);
        setNewCustomerName(customer.customer_name);
        setShowCustomerDropdown(false);
        setSearchResults([]);
        setCustomerSearch('');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.customer-search-container')) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <Card className="bg-[#111] border-[#222]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Send New Message
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="customer-search-container">
                    <label className="text-sm font-medium text-white mb-2 block">
                        Search Customers or Enter Phone Number
                    </label>
                    
                    {/* Customer Search Dropdown */}
                    <div className="relative">
                        <div className="relative">
                            <Input
                                placeholder="Search customers by name, email, or phone..."
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    if (!e.target.value.trim()) {
                                        setShowCustomerDropdown(false);
                                        setSearchResults([]);
                                    }
                                }}
                                onFocus={() => {
                                    if (customerSearch && searchResults.length > 0) {
                                        setShowCustomerDropdown(true);
                                    }
                                }}
                                className="bg-[#222] border-[#333] text-white pr-10"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                {isSearching && (
                                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                                )}
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
                            </div>
                        </div>

                        {/* Dropdown Results */}
                        {showCustomerDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-[#222] border border-[#333] rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    <>
                                        {searchResults.map((customer) => (
                                            <div
                                                key={customer.id}
                                                className="p-3 hover:bg-[#333] cursor-pointer border-b border-[#333] last:border-b-0 transition-colors"
                                                onClick={() => selectCustomerForNewMessage(customer)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-white font-medium truncate">{customer.customer_name}</p>
                                                            {customer.license_plate && (
                                                                <span className="text-xs bg-[#444] text-gray-300 px-1.5 py-0.5 rounded">
                                                                    {customer.license_plate}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mb-1">{customer.customer_phone}</p>
                                                        {customer.customer_email && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {customer.customer_email}
                                                            </p>
                                                        )}
                                                        {customer.customer_vehicle && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                <Car className="h-3 w-3" />
                                                                {typeof customer.customer_vehicle === 'object' 
                                                                    ? `${customer.customer_vehicle.year} ${customer.customer_vehicle.make} ${customer.customer_vehicle.model}` 
                                                                    : customer.customer_vehicle
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : customerSearch && !isSearching ? (
                                    <div className="p-4 text-center text-gray-400">
                                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No customers found</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Try a different search term or enter a phone number directly below
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Manual Phone Number Entry */}
                    <div className="mt-4 pt-4 border-t border-[#333]">
                        <label className="text-sm font-medium text-white mb-2 block">
                            Or Enter Phone Number Manually
                        </label>
                        <Input
                            placeholder="+1234567890"
                            value={newPhoneNumber}
                            onChange={(e) => setNewPhoneNumber(e.target.value)}
                            className="bg-[#222] border-[#333] text-white"
                        />
                        <div className="mt-2">
                            <Input
                                placeholder="Customer name (optional)"
                                value={newCustomerName}
                                onChange={(e) => setNewCustomerName(e.target.value)}
                                className="bg-[#222] border-[#333] text-white"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Enter phone number in international format (e.g., +1234567890)
                        </p>
                    </div>
                </div>
                
                <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                        Message
                    </label>
                    <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-[#222] border-[#333] text-white min-h-[120px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendNewMessage();
                            }
                        }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {newMessage.length}/1600 characters
                    </p>
                </div>
                
                <Button
                    onClick={sendNewMessage}
                    disabled={isLoading || !newMessage.trim() || !newPhoneNumber.trim()}
                    className="w-full bg-red-600 hover:bg-red-700"
                >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                </Button>
            </CardContent>
        </Card>
    );
}
