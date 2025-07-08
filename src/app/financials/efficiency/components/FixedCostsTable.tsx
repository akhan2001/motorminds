"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import EditFixedCostModal from "./EditFixedCostModal";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { formatCurrency } from "@/app/financials/utils/formatting";

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

interface FixedCostsTableProps {
    costs: any[];
    onCostUpdated: () => void;
    onCostDeleted: () => void;
}

export default function FixedCostsTable({ costs, onCostUpdated, onCostDeleted }: FixedCostsTableProps) {
    const handleDelete = async (costId: string) => {
        try {
            const response = await fetch('/api/financials/efficiency', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: costId }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to delete fixed cost');
            }

            onCostDeleted();

        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    if (!costs || costs.length === 0) {
        return <p className="text-gray-400 text-center py-8">No active fixed costs found. Add one to get started.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="border-b border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-400">Cost Name</TableHead>
                    <TableHead className="text-gray-400">Category</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Frequency</TableHead>
                    <TableHead className="text-gray-400">Start Date</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {costs.map((cost) => (
                    <TableRow key={cost.id} className="border-b border-gray-800 hover:bg-[#1a1a1a]">
                        <TableCell className="font-medium text-white">{cost.cost_name}</TableCell>
                        <TableCell className="text-gray-300">{cost.category}</TableCell>
                        <TableCell className="text-gray-300">{formatCurrency(cost.amount)}</TableCell>
                        <TableCell className="text-gray-300 capitalize">{cost.frequency}</TableCell>
                        <TableCell className="text-gray-300">{formatDate(cost.start_date)}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#131313] border-[#222] text-white">
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
                                        onConfirm={() => handleDelete(cost.id)}
                                        trigger={
                                            <DropdownMenuItem
                                                onSelect={(e) => e.preventDefault()}
                                                className="text-red-500"
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        }
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
} 