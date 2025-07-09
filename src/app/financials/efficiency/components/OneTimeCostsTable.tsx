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
import { useState } from "react";
import EditOneTimeCostModal from "./EditOneTimeCostModal";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { formatDate } from "@/app/financials/utils/format-date";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value || 0);

interface OneTimeCostsTableProps {
    costs: any[];
    onCostUpdated: () => void;
    onCostDeleted: () => void;
}

const CostActions = ({ cost, onCostUpdated, onCostDeleted }: { cost: any, onCostUpdated: () => void, onCostDeleted: () => void }) => {
    const handleDelete = async () => {
        try {
            const response = await fetch('/api/financials/one-time', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: cost.id }),
            });
            if (!response.ok) throw new Error('Failed to delete');
            onCostDeleted();
        } catch (error) {
            console.error(error);
            alert("Failed to delete cost.");
        }
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#131313] border-[#222] text-white">
                <EditOneTimeCostModal cost={cost} onCostUpdated={onCostUpdated}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditOneTimeCostModal>
                <ConfirmationDialog
                    title="Are you sure?"
                    description="This action will permanently delete the one-time cost and cannot be undone."
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export default function OneTimeCostsTable({ costs, onCostUpdated, onCostDeleted }: OneTimeCostsTableProps) {
    if (!costs || costs.length === 0) {
        return <p className="text-center text-gray-400 py-4">No one-time costs have been added yet.</p>;
    }
    return (
        <div className="overflow-x-auto max-h-96">
            <Table>
                <TableHeader className="sticky top-0 z-10 bg-[#0A0A0A]">
                    <TableRow>
                        <TableHead>Cost Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {costs.map((cost, idx) => (
                        <TableRow key={cost.id} className={idx % 2 === 0 ? "bg-[#0F0F0F]" : "bg-[#131313]"}>
                            <TableCell>{cost.cost_name}</TableCell>
                            <TableCell>{cost.category}</TableCell>
                            <TableCell className="text-right">{formatCurrency(cost.amount)}</TableCell>
                            <TableCell>{formatDate(cost.cost_date)}</TableCell>
                            <TableCell>
                                <CostActions cost={cost} onCostUpdated={onCostUpdated} onCostDeleted={onCostDeleted} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 