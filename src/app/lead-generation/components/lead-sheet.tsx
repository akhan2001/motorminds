import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface LeadSheetProps {
    lead: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LeadSheet({ lead, isOpen, onOpenChange }: LeadSheetProps) {
    if (!lead) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="bg-[#131313] text-white border-l-1 border-l-[#222]">
                <SheetHeader>
                    <SheetTitle className="text-white">{lead.customer_name}</SheetTitle>
                    <SheetDescription className="text-gray-400">
                        View and edit lead details
                    </SheetDescription>
                </SheetHeader>
            </SheetContent>
        </Sheet>
    )
}
