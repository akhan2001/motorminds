"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCustomers, getCustomerVehicles } from "@/app/customers/api/customer-utils";
import { fetchShopDetails } from "../utils/contract-utils";
import { Switch } from "@/components/ui/switch";

type Contract = {
    id?: string;
    title: string;
    content: string;
    status: string;
    customer_id?: string;
    vehicle_id?: string;
};

interface ContractEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contract: any) => void;
    contract?: Contract | null;
    shopId: string;
}

export default function ContractEditor({ isOpen, onClose, onSave, contract, shopId }: ContractEditorProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [customerVehicles, setCustomerVehicles] = useState<any[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [shopDetails, setShopDetails] = useState<any>(null);

    const [aiQuestions, setAiQuestions] = useState({
        workType: '',
        includeDamageDisclaimer: true,
        authorizeWork: false,
        maxAuthAmount: '',
        informWarrantyVoid: true,
        includeNoWarrantyClause: true,
    });
    
    const handleAiQuestionChange = (key: keyof typeof aiQuestions, value: any) => {
        setAiQuestions(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (isOpen) {
            // Reset form state when dialog opens
            if (contract) {
                setTitle(contract.title || '');
                setContent(contract.content || '');
                setSelectedCustomerId(contract.customer_id || '');
                setSelectedVehicleId(contract.vehicle_id || '');
            } else {
                // Reset for new contract
                setTitle('');
                setContent('');
                setSelectedCustomerId('');
                setSelectedVehicleId('');
                setAiQuestions({
                    workType: '',
                    includeDamageDisclaimer: true,
                    authorizeWork: false,
                    maxAuthAmount: '',
                    informWarrantyVoid: true,
                    includeNoWarrantyClause: true,
                });
            }
        }
    }, [contract, isOpen]);

    useEffect(() => {
        async function fetchCustomers() {
            if (isOpen && shopId) {
                const customersData = await getCustomers(shopId);
                setCustomers(customersData || []);
            }
        }
        fetchCustomers();
    }, [isOpen, shopId]);
    
    useEffect(() => {
        async function loadShopDetails() {
            if (shopId) {
                const details = await fetchShopDetails(shopId);
                setShopDetails(details);
            }
        }
        loadShopDetails();
    }, [shopId]);

    useEffect(() => {
        async function fetchVehicles() {
            if (selectedCustomerId) {
                const vehiclesData = await getCustomerVehicles(selectedCustomerId);
                setCustomerVehicles(vehiclesData || []);
            } else {
                setCustomerVehicles([]);
            }
        }
        fetchVehicles();
    }, [selectedCustomerId]);

    const handleSave = async () => {
        if (!title || !content) {
            toast.error("Title and content are required to save a contract.");
            return;
        }

        const dataToSave: any = { 
            title, 
            content,
            status: 'draft',
            customer_id: selectedCustomerId || null,
            vehicle_id: selectedVehicleId || null,
        };

        if (contract?.id) {
            dataToSave.id = contract.id;
        }
        
        console.log("Saving contract data:", dataToSave);
        onSave(dataToSave);
        onClose();
    };

    const handleGenerate = async () => {
        const requiredQuestionsAnswered = aiQuestions.workType;
        if (!title || !requiredQuestionsAnswered) {
            toast.error("Please provide a title and the type of work to generate a contract.");
            return;
        }
        setIsGenerating(true);
        try {
            const customer = customers.find(c => c.id === selectedCustomerId);
            const vehicle = customerVehicles.find(v => v.id === selectedVehicleId);
            
            const payload = {
                shop: shopDetails,
                customer,
                vehicle,
                title,
                generationParams: aiQuestions
            };

            const response = await fetch('/api/contracts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
                throw new Error(errorData.message || "Failed to generate text from API");
            }
            
            const result = await response.json();

            if (result?.generated_text) {
                setContent(result.generated_text);
                toast.success("Contract text generated!");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(`Failed to generate contract: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-0 max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[75vw] md:max-w-[65vw] flex flex-col">
                <DialogHeader className="sticky top-0 bg-[#131313] z-10 p-4 sm:p-6 border-b border-[#222222] rounded-t-lg">
                    <DialogTitle className="text-white text-xl sm:text-2xl">
                        {contract ? 'Edit Contract' : 'Create New Contract'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs sm:text-sm">
                        Fill in the details below to create a new service contract.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">

                        <h3 className="text-lg font-medium pl-6">Client & Vehicle Information (Optional)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1A1A1A] rounded-xl p-6">
                            <div className="space-y-2">
                                <Label className="text-gray-300 text-sm font-medium mb-1 block">Customer</Label>
                                <div className="flex items-center gap-2">
                                    <Select value={selectedCustomerId} onValueChange={(value) => { if (value) { setSelectedCustomerId(value); setSelectedVehicleId(''); } }}>
                                        <SelectTrigger className="bg-[#292929] text-white border-[#626262] flex-1"><SelectValue placeholder="Select a customer (or leave blank)" /></SelectTrigger>
                                        <SelectContent 
                                            className="bg-[#292929] text-white border-[#626262]" 
                                            position="popper" 
                                            sideOffset={8}
                                            onPointerDownOutside={(e) => {
                                                const target = e.target as HTMLElement;
                                                if (target.closest('[data-radix-popper-content-wrapper]')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {selectedCustomerId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-1 h-auto text-gray-400 hover:text-white"
                                            onClick={() => {
                                                setSelectedCustomerId('');
                                                setSelectedVehicleId('');
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-300 text-sm font-medium mb-1 block">Vehicle</Label>
                                <div className="flex gap-2">
                                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} disabled={!selectedCustomerId}>
                                        <SelectTrigger className="bg-[#292929] text-white border-[#626262]"><SelectValue placeholder="Select a vehicle" /></SelectTrigger>
                                        <SelectContent 
                                            className="bg-[#292929] text-white border-[#626262]" 
                                            position="popper" 
                                            sideOffset={8}
                                            onPointerDownOutside={(e) => {
                                                const target = e.target as HTMLElement;
                                                if (target.closest('[data-radix-popper-content-wrapper]')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            {customerVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-medium pl-6">Contract Details</h3>
                         <div className="space-y-3 bg-[#1A1A1A] rounded-xl p-6">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#0000] border-[#626262]" />
                            </div>
                         </div>
                        
                        <h3 className="text-lg font-medium pl-6">AI Generation Assistant</h3>
                        <p className="text-sm text-gray-400 pl-6 -mt-2 mb-2">Answer these questions to help our AI create a detailed and accurate contract tailored to this job.</p>
                        <div className="space-y-4 bg-[#1A1A1A] rounded-xl p-6">
                            <div className="grid gap-2">
                                <Label>What type of work is being performed?</Label>
                                <Input 
                                    value={aiQuestions.workType} 
                                    onChange={(e) => handleAiQuestionChange('workType', e.target.value)}
                                    placeholder="e.g., Repair, detailing, customization, diagnostic, inspection"
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Include disclaimer for pre-existing damage?</Label>
                                <Switch 
                                    checked={aiQuestions.includeDamageDisclaimer} 
                                    onCheckedChange={(checked) => handleAiQuestionChange('includeDamageDisclaimer', checked)}
                                />
                            </div>
                             <div className="flex items-center justify-between">
                                <Label>Does customer authorize work up to a certain amount?</Label>
                                <Switch 
                                    checked={aiQuestions.authorizeWork} 
                                    onCheckedChange={(checked) => handleAiQuestionChange('authorizeWork', checked)}
                                />
                            </div>
                            {aiQuestions.authorizeWork && (
                                <div className="grid gap-2 pl-4">
                                    <Label>Maximum authorized amount ($)</Label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        step="25"
                                        value={aiQuestions.maxAuthAmount} 
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (value >= 0 || e.target.value === '') {
                                                handleAiQuestionChange('maxAuthAmount', e.target.value);
                                            }
                                        }}
                                        placeholder="Enter amount"
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <Label>Inform customer that work may void warranties?</Label>
                                <Switch 
                                    checked={aiQuestions.informWarrantyVoid} 
                                    onCheckedChange={(checked) => handleAiQuestionChange('informWarrantyVoid', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Include clause stating no warranty is provided unless specified?</Label>
                                 <Switch 
                                    checked={aiQuestions.includeNoWarrantyClause} 
                                    onCheckedChange={(checked) => handleAiQuestionChange('includeNoWarrantyClause', checked)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 bg-[#1A1A1A] rounded-xl p-6">
                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="content">Contract Text</Label>
                                    <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating || !title || !aiQuestions.workType}>
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                        Generate with AI
                                    </Button>
                                </div>
                                <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={15} className="bg-[#0000] border-[#626262]" />
                            </div>
                        </div>

                    </div>
                </div>
                
                <DialogFooter className="mt-2 sm:mt-3 flex flex-row justify-end w-full px-6 py-4 gap-2">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-[#292929]">Cancel</Button>
                    <Button onClick={handleSave} className="bg-[#22C55E] hover:bg-[#22C55E]/80">Save Contract</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 