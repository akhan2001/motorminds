import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getShopInfo } from "@/utils/supabase/supabase-shop";

export default function InvoiceForm({ onClose, shopId, isOpen }: { onClose: () => void, shopId: string, isOpen: boolean }) {

    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [shopName, setShopName] = useState("");
    const [shopAddress, setShopAddress] = useState("");
    const [shopEmail, setShopEmail] = useState("");
    
    useEffect(() => {
        const fetchShopInfo = async () => {
            const shopInfo = await getShopInfo(shopId);
            setShopName(shopInfo.shop_name);
            setShopAddress(shopInfo.shop_address);
            setShopEmail(shopInfo.shop_email);
        }
        fetchShopInfo();
    }, [shopId]);


    // Generate new invoice number with UUID
    const generateInvoiceNumber = async () => {
        const newInvoiceNumber = uuidv4();
        setInvoiceNumber(newInvoiceNumber);
    }
    
    useEffect(() => {
        generateInvoiceNumber();
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-6">
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-white">Create New Invoice</DialogTitle>
                    <DialogDescription className="text-gray-400 text-sm">
                        Add a new invoice for a work order. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <label className="text-gray-300 text-sm">Invoice Number: <span className="text-gray-400 text-xs">{invoiceNumber}</span></label>
                </div>

                {/** Shop information */}
                <div>
                    <label className="text-gray-300 text-sm">Shop Name</label>
                    {/** Shop name */}
                    <Input
                        className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                        placeholder={shopName}
                        disabled
                    />
                    {/** Shop Address */}
                    <Input
                        className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                        placeholder={shopAddress}
                        disabled
                    />
                    {/** Shop Email */}
                    <Input
                        className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                        placeholder={shopEmail}
                        disabled
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <label className="text-gray-300 text-sm">Customer Information</label>
                    <Select>
                        <SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1">
                            <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                    </Select>
                </div>
            </DialogContent>
        </Dialog>
    )
}