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
                        className="text-red-500"
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
        return <p className="text-center text-gray-400 py-4">No recurring costs have been added yet.</p>;
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Cost Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {costs.map((cost) => (
                    <TableRow key={cost.id}>
                        <TableCell>{cost.cost_name}</TableCell>
                        <TableCell>{cost.category}</TableCell>
                        <TableCell>{formatCurrency(cost.amount)}</TableCell>
                        <TableCell className="capitalize">{cost.frequency}</TableCell>
                        <TableCell>{formatDate(cost.start_date)}</TableCell>
                        <TableCell>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#131313] border-[#222] text-white">
                                    <CostActions cost={cost} onCostUpdated={onCostUpdated} onCostDeleted={onCostDeleted} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
} 