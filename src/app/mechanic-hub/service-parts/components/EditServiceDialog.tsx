import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Service } from "../types";

interface EditServiceDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    service: Service | null;
    onSubmit: (id: string, updates: Partial<Service>) => void;
}

export function EditServiceDialog({ isOpen, onOpenChange, service, onSubmit }: EditServiceDialogProps) {
    const [formData, setFormData] = useState<Partial<Service>>({});

    useEffect(() => {
        if (service) {
            setFormData(service);
        }
    }, [service]);

    const handleChange = (field: keyof Service, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (service) {
            onSubmit(service.id, formData);
        }
    };

    if (!service) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1A1A] text-white border-[#333]">
                <DialogHeader>
                    <DialogTitle>Edit Service or Part</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: "labor" | "parts") => handleChange('type', value)}
                        >
                            <SelectTrigger className="bg-[#131313] border-[#333]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#131313] border-[#333] text-white">
                                <SelectItem value="labor">Labor</SelectItem>
                                <SelectItem value="parts">Parts</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Service/Part Name</label>
                        <Input value={formData.service_name} onChange={(e) => handleChange('service_name', e.target.value)} className="bg-[#131313] border-[#333]"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className="bg-[#131313] border-[#333]"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Price (Retail)</label>
                            <Input type="number" value={formData.price} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} className="bg-[#131313] border-[#333]"/>
                        </div>
                        {formData.type === "parts" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cost (COGS)</label>
                            <Input type="number" value={formData.cost || ''} onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)} className="bg-[#131313] border-[#333]"/>
                        </div>
                        )}
                    </div>
                    {formData.type === "parts" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Quantity</label>
                            <Input type="number" value={formData.quantity} onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)} className="bg-[#131313] border-[#333]"/>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#333] text-white">Cancel</Button>
                    <Button onClick={handleSubmit} className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 