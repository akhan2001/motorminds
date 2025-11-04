import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CustomersTableLoading() {
    return (
        <main className="flex flex-col items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-row justify-between items-center mb-10">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">Customers</h1>
                        <p className="text-muted-foreground">
                            Manage your customer base and track their activity. Add new customers, edit their information, and view their activity.
                        </p>
                    </div>
                    <div className="flex flex-row gap-4">
                        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-7">
                            <PlusIcon className="w-4 h-4 mr-1" />
                            ADD CUSTOMER
                        </Button>
                    </div>
                </div>
                <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50 border-none">
                            <TableRow className="hover:bg-muted/50 border-b border-border">
                                <TableHead className="text-foreground font-medium">Name</TableHead>
                                <TableHead className="text-foreground font-medium">Email</TableHead>
                                <TableHead className="text-foreground font-medium">Phone</TableHead>
                                <TableHead className="text-foreground font-medium">Address</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array(5).fill(0).map((_, index) => (
                                <TableRow key={index} className="hover:bg-muted/50 border-b border-border">
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-60" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </main>
    )
}
