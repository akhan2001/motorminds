import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface BreakdownDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    data: any[]
    columns: { key: string; header: string; render?: (value: any, item: any) => React.ReactNode }[]
}

export function BreakdownDialog({ open, onOpenChange, title, data, columns }: BreakdownDialogProps) {
    const router = useRouter();

    const handleRowClick = (item: any) => {
        let link: string | null = null;
        if (item.invoice_number) {
            link = `/invoices?invoiceId=${item.invoice_number}`;
        } else if (item.source === 'Fixed Cost') {
            link = '/financials/efficiency#fixed-costs';
        } else if (item.source === 'One-Time Cost') {
            link = '/financials/efficiency#one-time-costs';
        }
        
        if (link) {
            router.push(link);
            onOpenChange(false); // Close dialog on navigation
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl bg-[#131313] border-zinc-800 text-white shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        A detailed breakdown of the items contributing to this metric.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[450px] border border-zinc-800 rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b-zinc-800">
                                {columns.map((col) => (
                                    <TableHead key={col.key} className="bg-[#1a1a1a] text-zinc-300 font-semibold sticky top-0 z-10">
                                        {col.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data && data.length > 0 ? (
                                data.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        className="border-b-zinc-800 hover:bg-zinc-800 transition-colors"
                                        onClick={() => handleRowClick(item)}
                                    >
                                        {columns.map((col) => (
                                            <TableCell key={col.key} className="py-3">
                                                {col.render ? col.render(item[col.key], item) : item[col.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-center text-zinc-500 py-8">
                                        No breakdown data available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <DialogFooter className="mt-4">
                    <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 