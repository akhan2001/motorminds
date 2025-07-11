"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, PlusIcon, MinusIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCustomers, getCustomerVehicles } from "@/app/customers/api/customer-utils";
import { generateContractText } from "../utils/contract-utils";

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
    
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [clientInfo, setClientInfo] = useState({ customer_name: '', customer_phone: '', customer_address: '', customer_email: '' });
    
    const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
    const [manualVehicleInfo, setManualVehicleInfo] = useState({ year: '', make: '', model: '' });

    useEffect(() => {
        if (isOpen) {
            // Reset form state when dialog opens
            if (contract) {
                setTitle(contract.title || '');
                setContent(contract.content || '');
                setSelectedCustomerId(contract.customer_id || '');
                setSelectedVehicleId(contract.vehicle_id || '');
            } else {
                setTitle('');
                setContent('');
                setSelectedCustomerId('');
                setSelectedVehicleId('');
                setShowNewClientForm(false);
                setClientInfo({ customer_name: '', customer_phone: '', customer_address: '', customer_email: '' });
                setShowNewVehicleForm(false);
                setManualVehicleInfo({ year: '', make: '', model: '' });
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
        // This functionality needs to be implemented fully later.
        if (showNewClientForm || showNewVehicleForm) {
            toast.error("Creating new customers or vehicles from this form is not yet supported.");
            return;
        }

        if (!selectedCustomerId || !selectedVehicleId) {
            toast.error("Please select a customer and a vehicle.");
            return;
        }
        
        const dataToSave: any = { 
            title, 
            content,
            customer_id: selectedCustomerId,
            vehicle_id: selectedVehicleId,
        };
        if (contract?.id) {
            dataToSave.id = contract.id;
        }
        onSave(dataToSave);
        onClose();
    };

    const handleGenerate = async () => {
        if (!selectedCustomerId || !selectedVehicleId) {
            toast.error("Please select a customer and vehicle first.");
            return;
        }
        setIsGenerating(true);
        try {
            const customer = customers.find(c => c.id === selectedCustomerId);
            const vehicle = customerVehicles.find(v => v.id === selectedVehicleId);

            if (!customer || !vehicle) {
                toast.error("Could not find customer or vehicle details.");
                setIsGenerating(false);
                return;
            }

            const payload = { 
                shopId,
                customer: {
                    customer_name: customer.customer_name,
                    customer_address: customer.customer_address,
                    customer_email: customer.customer_email,
                    customer_phone: customer.customer_phone,
                },
                vehicle: { 
                    make: vehicle.make, 
                    model: vehicle.model, 
                    year: vehicle.year, 
                    vin: vehicle.vin || 'N/A' 
                },
                contract_details: { title: title }
             };
            const result = await generateContractText(payload);
            if (result?.generated_text) {
                setContent(result.generated_text);
                toast.success("Contract text generated!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate contract text.");
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

                        <h3 className="text-lg font-medium pl-6">Client & Vehicle Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1A1A1A] rounded-xl p-6">
                            <div className="space-y-2">
                                <Label className="text-gray-300 text-sm font-medium mb-1 block">Customer</Label>
                                <div className="flex gap-2">
                                    <Select value={selectedCustomerId} onValueChange={(value) => { setSelectedCustomerId(value); setSelectedVehicleId(''); }} disabled={showNewClientForm}>
                                        <SelectTrigger className="bg-[#292929] text-white border-[#626262]"><SelectValue placeholder="Select a customer" /></SelectTrigger>
                                        <SelectContent className="bg-[#292929] text-white border-[#626262]" position="popper" sideOffset={8}>
                                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button className="bg-[#292929] hover:bg-[#363636] text-white border border-[#626262] h-10 w-10 p-0" onClick={() => setShowNewClientForm(!showNewClientForm)}>
                                        {showNewClientForm ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {showNewClientForm && (
                                    <div className="space-y-2 mt-2 p-3 border border-[#626262] rounded-md">
                                        <Input className="bg-[#292929]" placeholder="Client Name" value={clientInfo.customer_name} onChange={(e) => setClientInfo({...clientInfo, customer_name: e.target.value})} />
                                        <Input className="bg-[#292929]" placeholder="Client Phone" value={clientInfo.customer_phone} onChange={(e) => setClientInfo({...clientInfo, customer_phone: e.target.value})} />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-300 text-sm font-medium mb-1 block">Vehicle</Label>
                                <div className="flex gap-2">
                                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} disabled={!selectedCustomerId || showNewVehicleForm}>
                                        <SelectTrigger className="bg-[#292929] text-white border-[#626262]"><SelectValue placeholder="Select a vehicle" /></SelectTrigger>
                                        <SelectContent className="bg-[#292929] text-white border-[#626262]" position="popper" sideOffset={8}>
                                            {customerVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button className="bg-[#292929] hover:bg-[#363636] text-white border border-[#626262] h-10 w-10 p-0" onClick={() => setShowNewVehicleForm(!showNewVehicleForm)} disabled={!selectedCustomerId}>
                                        {showNewVehicleForm ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {showNewVehicleForm && (
                                    <div className="space-y-2 mt-2 p-3 border border-[#626262] rounded-md">
                                        <Input className="bg-[#292929]" placeholder="Year" value={manualVehicleInfo.year} onChange={(e) => setManualVehicleInfo({...manualVehicleInfo, year: e.target.value})} />
                                        <Input className="bg-[#292929]" placeholder="Make" value={manualVehicleInfo.make} onChange={(e) => setManualVehicleInfo({...manualVehicleInfo, make: e.target.value})} />
                                        <Input className="bg-[#292929]" placeholder="Model" value={manualVehicleInfo.model} onChange={(e) => setManualVehicleInfo({...manualVehicleInfo, model: e.target.value})} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="text-lg font-medium pl-6">Contract Details</h3>
                        <div className="space-y-3 bg-[#1A1A1A] rounded-xl p-6">
                             <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#0000] border-[#626262]" />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="content">Contract Text</Label>
                                    <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
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