"use client"

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus, Paperclip, X, Loader2, Image } from 'lucide-react';
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

interface UploadedMedia {
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    storagePath: string;
}

interface SendNewMessageProps {
    onMessageSent?: () => void;
}

// Media upload preview component
function MediaUploadPreview({ 
    media, 
    onRemove, 
    isUploading 
}: { 
    media: UploadedMedia[]; 
    onRemove: (index: number) => void;
    isUploading: boolean;
}) {
    if (media.length === 0 && !isUploading) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
            {media.map((item, index) => (
                <div key={index} className="relative group">
                    <img
                        src={item.url}
                        alt={item.fileName}
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                    />
                    <button
                        onClick={() => onRemove(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate rounded-b-lg">
                        {item.fileName}
                    </span>
                </div>
            ))}
            {isUploading && (
                <div className="w-20 h-20 flex items-center justify-center bg-muted rounded-lg border border-border">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}

export default function SendNewMessage({ onMessageSent }: SendNewMessageProps) {
    const [newMessage, setNewMessage] = useState('');
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const [newCustomerName, setNewCustomerName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    
    // Media upload state
    const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle customer selection from dropdown
    const handleCustomerSelect = (customer: Customer | null) => {
        setSelectedCustomer(customer);
        if (customer) {
            setNewPhoneNumber(customer.customer_phone);
            setNewCustomerName(customer.customer_name);
        }
    };

    // Handle file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // Check total media count
        if (uploadedMedia.length + files.length > 10) {
            toast.error('Maximum 10 media attachments allowed');
            return;
        }

        setIsUploading(true);

        for (const file of Array.from(files)) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Maximum size is 5MB`);
                continue;
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                toast.error(`${file.name} has unsupported format. Use JPG, PNG, or GIF`);
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/twilio/media/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    setUploadedMedia(prev => [...prev, {
                        url: data.url,
                        fileName: data.fileName,
                        fileSize: data.fileSize,
                        fileType: data.fileType,
                        storagePath: data.storagePath,
                    }]);
                } else {
                    const error = await response.json();
                    toast.error(error.error || `Failed to upload ${file.name}`);
                }
            } catch (error) {
                console.error('Upload error:', error);
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Remove uploaded media
    const removeMedia = async (index: number) => {
        const media = uploadedMedia[index];
        
        try {
            // Delete from storage
            await fetch(`/api/twilio/media/upload?path=${encodeURIComponent(media.storagePath)}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Failed to delete media:', error);
        }

        setUploadedMedia(prev => prev.filter((_, i) => i !== index));
    };

    const sendNewMessage = async () => {
        // Allow sending if there's text or media, and a phone number
        if ((!newMessage.trim() && uploadedMedia.length === 0) || !newPhoneNumber.trim()) return;

        setIsLoading(true);
        try {
            const mediaUrls = uploadedMedia.map(m => m.url);
            
            const response = await fetch('/api/twilio/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: newPhoneNumber,
                    body: newMessage,
                    customerName: newCustomerName,
                    mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
                }),
            });

            if (response.ok) {
                // Reset form
                setNewMessage('');
                setNewPhoneNumber('');
                setNewCustomerName('');
                setSelectedCustomer(null);
                setUploadedMedia([]);
                
                const messageType = mediaUrls.length > 0 ? 'MMS' : 'Message';
                toast.success(`${messageType} sent successfully`);
                
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

    const canSend = newPhoneNumber.trim() && (newMessage.trim() || uploadedMedia.length > 0);

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
                
                {/* Media upload section */}
                <div className="pt-4 border-t border-border">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Attachments (optional)
                    </label>
                    
                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        multiple
                        className="hidden"
                    />
                    
                    {/* Media preview */}
                    <MediaUploadPreview 
                        media={uploadedMedia} 
                        onRemove={removeMedia}
                        isUploading={isUploading}
                    />
                    
                    {/* Upload button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || uploadedMedia.length >= 10}
                        className="w-full"
                    >
                        <Paperclip className="h-4 w-4 mr-2" />
                        {uploadedMedia.length > 0 
                            ? `Add More Images (${uploadedMedia.length}/10)`
                            : 'Attach Images'
                        }
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                        Supported: JPG, PNG, GIF. Max 5MB each, up to 10 images.
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
                                if (canSend) {
                                    sendNewMessage();
                                }
                            }
                        }}
                    />
                    <div className="flex justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                            {newMessage.length}/1600 characters
                        </p>
                        {uploadedMedia.length > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Image className="h-3 w-3" />
                                {uploadedMedia.length} attachment{uploadedMedia.length > 1 ? 's' : ''} (MMS)
                            </p>
                        )}
                    </div>
                </div>
                
                <Button
                    onClick={sendNewMessage}
                    disabled={isLoading || !canSend}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4 mr-2" />
                            {uploadedMedia.length > 0 ? 'Send MMS' : 'Send Message'}
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
