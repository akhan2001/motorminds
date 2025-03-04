import { Table, TableHeader, TableHead, TableRow } from "@/components/ui/table";

export function CustomerTable() {
    return (
        <section>
            <Table>
                <TableHeader>
                    <TableRow>  
                        <TableHead>
                            Name
                        </TableHead>
                        <TableHead>
                            Email
                        </TableHead>
                        <TableHead>
                            Phone
                        </TableHead>
                        <TableHead>
                            Points
                        </TableHead>
                        <TableHead>
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
            </Table>
        </section>
    )
}
