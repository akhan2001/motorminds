"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Calendar, RefreshCw } from "lucide-react";
import EditFixedCostModal from "./EditFixedCostModal";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { formatDate } from "@/app/financials/utils/format-date";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value || 0);

const FREQUENCY_COLORS: Record<string, string> = {
    daily: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    weekly: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    monthly: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    quarterly: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    yearly: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

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
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default function FixedCostsTable({ costs, onCostUpdated, onCostDeleted }: FixedCostsTableProps) {
    if (!costs || costs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <RefreshCw className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No recurring costs have been added yet.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Add costs like rent, utilities, or subscriptions.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {costs.map((cost) => (
                <div 
                    key={cost.id} 
                    className="flex items-center justify-between p-4 bg-white dark:bg-background rounded-lg border border-border hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-foreground truncate">{cost.cost_name}</h4>
                            <Badge 
                                variant="secondary" 
                                className={`text-xs capitalize ${FREQUENCY_COLORS[cost.frequency] || 'bg-slate-100 text-slate-700'}`}
                            >
                                {cost.frequency}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="truncate">{cost.category}</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(cost.start_date)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-foreground whitespace-nowrap">
                            {formatCurrency(cost.amount)}
                        </span>
                        <CostActions cost={cost} onCostUpdated={onCostUpdated} onCostDeleted={onCostDeleted} />
                    </div>
                </div>
            ))}
        </div>
    );
}
