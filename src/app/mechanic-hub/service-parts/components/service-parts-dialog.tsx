import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

interface ServiceFormData {
    service_name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    type?: "labor" | "parts";
}

interface ServicePartsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    formData: ServiceFormData;
    onFormChange: (data: Partial<ServiceFormData>) => void;
    onSubmit: () => void;
}

export function ServicePartsDialog({
    isOpen,
    onOpenChange,
    formData,
    onFormChange,
    onSubmit
}: ServicePartsDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add New
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1A1A] text-white border-[#333]">
                <DialogHeader>
                    <DialogTitle>Add New Service or Part</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="type" className="text-sm font-medium">Type</label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: "labor" | "parts") => {
                                const newQuantity = value === "labor" ? undefined : 1;
                                onFormChange({ 
                                    type: value,
                                    quantity: newQuantity
                                });
                            }}
                        >
                            <SelectTrigger className="bg-[#131313] border-[#333] focus:ring-0">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#131313] border-[#333] text-white">
                                <SelectItem value="labor">Labor</SelectItem>
                                <SelectItem value="parts">Parts</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="serviceName" className="text-sm font-medium">Service/Part Name</label>
                        <Input 
                            id="serviceName"
                            value={formData.service_name}
                            onChange={(e) => onFormChange({ service_name: e.target.value })}
                            className="bg-[#131313] border-[#333] focus:ring-0"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">Description</label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => onFormChange({ description: e.target.value })}
                            className="bg-[#131313] border-[#333] focus:ring-0 min-h-24"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="price" className="text-sm font-medium">Price ($)</label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price?.toString()}
                                onChange={(e) => onFormChange({ price: parseFloat(e.target.value) || 0 })}
                                className="bg-[#131313] border-[#333] focus:ring-0"
                            />
                        </div>
                        {formData.type === "parts" && (
                            <div className="space-y-2">
                                <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={formData.quantity?.toString()}
                                    onChange={(e) => onFormChange({ quantity: parseInt(e.target.value) || 1 })}
                                    className="bg-[#131313] border-[#333] focus:ring-0"
                                />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#333] text-white">
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white">
                        Add Item
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}