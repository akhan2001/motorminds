"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react";
import { getCustomers } from "@/app/customers/api/customer-utils";

interface Customer {
    id: string;
    customer_name: string;
    customer_email: string;
}

interface CustomerMentionProps {
    isOpen: boolean;
    searchTerm: string;
    customers: Customer[];
    onSelect: (customer: Customer) => void;
    position: { top: number; left: number };
}

export function CustomerMentionList({
    isOpen,
    searchTerm,
    customers,
    onSelect,
    position,
}: CustomerMentionProps) {
    if (!isOpen) return null;

    const filteredCustomers = customers.filter(
        (customer) =>
        customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredCustomers.length === 0) return null;

    return (
        <div
        className="absolute z-50 bg-[#1A1A1A] border border-[#444444] rounded-md shadow-lg overflow-y-auto w-80"
        style={{ 
            bottom: '100%',
            left: 'calc(40% - 160px)',
            marginBottom: '10px',
        }}
        >
            <ul className="py-1">
                {filteredCustomers.map((customer) => (
                <li
                    key={customer.id}
                    className="px-4 py-2 hover:bg-[#333333] cursor-pointer flex items-center gap-2"
                    onClick={() => onSelect(customer)}
                >
                    <div className="bg-[#444444] rounded-full p-1">
                    <User className="h-4 w-4 text-gray-300" />
                    </div>
                    <div>
                    <div className="text-white font-medium">{customer.customer_name}</div>
                    <div className="text-gray-400 text-sm">{customer.customer_email}</div>
                    </div>
                </li>
                ))}
            </ul>
        </div>
    );
}

interface UseMentionProps {
    shopId?: string;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function useCustomerMention({ shopId, inputRef, value, onChange }: UseMentionProps) {
    const [isMentioning, setIsMentioning] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch customers when mention is triggered
    useEffect(() => {
        async function fetchCustomers() {
            if (isMentioning && shopId) {
                setIsLoading(true);
                try {
                    const data = await getCustomers(shopId);
                    setCustomers(data);
                } catch (err) {
                    console.error("Error fetching customers:", err);
                } finally {
                    setIsLoading(false);
                }
            }
        }
        
        fetchCustomers();
    }, [isMentioning, shopId]);

    // Handle input changes to detect @ symbol
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Call the original onChange handler
        onChange(e);
        
        const newValue = e.target.value;
        
        // Get cursor position
        const cursorPosition = e.target.selectionStart || 0;
        
        // Check if @ was just typed
        if (newValue[cursorPosition - 1] === "@" && (cursorPosition === 1 || newValue[cursorPosition - 2] === " ")) {
            setIsMentioning(true);
            setMentionSearch("");
            
            // Calculate position for the mention list
            if (inputRef.current) {
                calculateMentionPosition(inputRef.current, cursorPosition);
            }
        } 
        // Update mention search term
        else if (isMentioning) {
            const lastAtPos = newValue.lastIndexOf("@", cursorPosition - 1);
            if (lastAtPos !== -1) {
                const searchText = newValue.substring(lastAtPos + 1, cursorPosition);
                setMentionSearch(searchText);
                
                // Close mention list if user types space
                if (searchText.includes(" ")) {
                    setIsMentioning(false);
                }
            } else {
                setIsMentioning(false);
            }
        }
    };

    // Calculate the position of the mention list
    const calculateMentionPosition = (element: HTMLTextAreaElement, position: number) => {
        // Get the textarea's position in the viewport
        const rect = element.getBoundingClientRect();
        
        // Get the line height
        const lineHeight = parseInt(window.getComputedStyle(element).lineHeight) || 20;
        
        // Get the text up to the cursor
        const textUpToCursor = element.value.substring(0, position);
        
        // Count how many newlines are in the text up to the cursor
        const lineCount = (textUpToCursor.match(/\n/g) || []).length;
        
        // Calculate the vertical position (top)
        // This is an approximation - for more accuracy you'd need to measure the text
        const top = rect.top + lineCount * lineHeight + 30; // 30px offset for padding
        
        // For horizontal position, we'll just use a fixed offset from the left
        const left = rect.left + 20; // 20px offset from left
        
        setMentionPosition({ top, left });
    };

    // Handle selecting a customer from the mention list
    const handleSelectCustomer = (customer: Customer) => {
        if (!inputRef.current) return;
        
        const cursorPosition = inputRef.current.selectionStart || 0;
        const lastAtPos = inputRef.current.value.lastIndexOf("@", cursorPosition - 1);
        
        if (lastAtPos !== -1) {
            // Replace @searchterm with @CustomerName
            const newValue = 
                inputRef.current.value.substring(0, lastAtPos) + 
                `@${customer.customer_name} (${customer.customer_email})` + 
                inputRef.current.value.substring(cursorPosition);
            
            // Create a synthetic event to update the input
            const syntheticEvent = {
                target: {
                    value: newValue
                }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            
            onChange(syntheticEvent);
            
            // Set cursor position after the inserted mention
            setTimeout(() => {
                if (inputRef.current) {
                    const newCursorPos = lastAtPos + customer.customer_name.length + customer.customer_email.length + 4; // +4 for "@", " (", ")"
                    inputRef.current.selectionStart = newCursorPos;
                    inputRef.current.selectionEnd = newCursorPos;
                    inputRef.current.focus();
                }
            }, 0);
        }
        
        setIsMentioning(false);
    };

    return {
        isMentioning,
        mentionSearch,
        mentionPosition,
        customers,
        isLoading,
        handleInputChange,
        handleSelectCustomer,
    };
}