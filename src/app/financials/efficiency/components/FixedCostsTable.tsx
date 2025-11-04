"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import EditFixedCostModal from "./EditFixedCostModal";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { formatDate } from "@/app/financials/utils/format-date";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value || 0);

interface FixedCostsTableProps {
    costs: any[];
    onCostUpdated: () => void;
    onCostDeleted: () => void;
}

const CostActions = ({ cost, onCostUpdated, onCostDeleted }: { cost: any, onCostUpdated: () => void, onCostDeleted: () => void }) => {

    const handleDelete = async () => {
        try {
            const response = await fetch("/api/financials/efficiency", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: cost.id }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to delete fixed cost");
            }

            onCostDeleted();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <>
            <EditFixedCostModal cost={cost} onCostUpdated={onCostUpdated}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit
                </DropdownMenuItem>
            </EditFixedCostModal>

            <ConfirmationDialog
                title="Are you sure?"
                description="This action will permanently delete the fixed cost and cannot be undone."
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDelete}
                trigger={
                    <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 dark:text-red-400"
                    >
                        Delete
                    </DropdownMenuItem>
                }
            />
        </>
    );
};

export default function FixedCostsTable({ costs, onCostUpdated, onCostDeleted }: FixedCostsTableProps) {
    if (!costs || costs.length === 0) {
        return <p className="text-center text-muted-foreground py-4">No recurring costs have been added yet.</p>;
    }
    return (
        <div className="overflow-x-auto max-h-96">
            <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/50">
                    <TableRow>
                        <TableHead className="text-foreground">Cost Name</TableHead>
                        <TableHead className="text-foreground">Category</TableHead>
                        <TableHead className="text-right text-foreground">Amount</TableHead>
                        <TableHead className="text-foreground">Frequency</TableHead>
                        <TableHead className="text-foreground">Start Date</TableHead>
                        <TableHead className="text-foreground">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {costs.map((cost, idx) => (
                        <TableRow key={cost.id} className={idx % 2 === 0 ? "bg-white dark:bg-background" : "bg-slate-50 dark:bg-muted/30"}>
                            <TableCell className="text-foreground">{cost.cost_name}</TableCell>
                            <TableCell className="text-foreground">{cost.category}</TableCell>
                            <TableCell className="text-right text-foreground">{formatCurrency(cost.amount)}</TableCell>
                            <TableCell className="capitalize text-foreground">{cost.frequency}</TableCell>
                            <TableCell className="text-foreground">{formatDate(cost.start_date)}</TableCell>
                            <TableCell>
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                                        <CostActions cost={cost} onCostUpdated={onCostUpdated} onCostDeleted={onCostDeleted} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 