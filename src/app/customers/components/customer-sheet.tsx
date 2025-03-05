import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface CustomerSheetProps {
    customer: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CustomerSheet({ customer, isOpen, onOpenChange }: CustomerSheetProps) {
    if (!customer) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="bg-[#131313] text-white border-l-1 border-l-[#222]">
                <SheetHeader>
                    <SheetTitle className="text-white">{customer.customer_name}</SheetTitle>
                    <SheetDescription className="text-gray-400">
                        View and edit customer details
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-left text-gray-300">
                            Name
                        </Label>
                        <div className="col-span-3">
                            <Input id="name" value={customer.customer_name} className="col-span-3 bg-[#292929] text-white border-[#626262]" readOnly />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-left text-gray-300">
                            Email
                        </Label>
                        <Input 
                            id="email" 
                            value={customer.customer_email} 
                            className="col-span-3 bg-[#292929] text-white border-[#626262]" 
                            readOnly
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-left text-gray-300">
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            value={customer.customer_phone} className="col-span-3 bg-[#292929] text-white border-[#626262]"
                            readOnly
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-left text-gray-300">
                            Address
                        </Label>
                        <Input id="address" value={customer.customer_address} className="col-span-3 bg-[#292929] text-white border-[#626262]" readOnly />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
