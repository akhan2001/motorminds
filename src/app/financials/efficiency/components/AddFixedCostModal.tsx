"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";

interface AddFixedCostModalProps {
    shopId: string;
    onCostAdded: () => void;
    children: React.ReactNode;
}

export default function AddFixedCostModal({
    shopId,
    onCostAdded,
    children,
}: AddFixedCostModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [costName, setCostName] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("monthly");
    const [category, setCategory] = useState("Utilities");
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");
        if (!costName || !amount || !frequency || !category || !startDate) {
            setError("Please fill out all fields.");
            return;
        }
        setLoading(true);

        try {
            const response = await fetch("/api/financials/efficiency", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shop_id: shopId,
                    cost_name: costName,
                    amount: parseFloat(amount),
                    frequency,
                    category,
                    start_date: startDate,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to add fixed cost");
            }

            setCostName("");
            setAmount("");
            setFrequency("monthly");
            setCategory("Utilities");
            setStartDate(new Date().toISOString().split("T")[0]);
            onCostAdded();
            setIsOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-slate-50 dark:bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Add New Fixed Cost</DialogTitle>
                    <DialogDescription className="sr-only">A dialog to add a new recurring fixed cost to your financials.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="costName" className="text-foreground">Cost Name</Label>
                        <Input
                            id="costName"
                            placeholder="e.g., Workshop Rent"
                            value={costName}
                            onChange={(e) => setCostName(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="amount" className="text-foreground">Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="1500"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground"
                            />
                        </div>
                        <div>
                            <Label htmlFor="frequency" className="text-foreground">Frequency</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="bg-white dark:bg-background border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    <SelectItem value="daily" className="hover:bg-muted">Daily</SelectItem>
                                    <SelectItem value="weekly" className="hover:bg-muted">Weekly</SelectItem>
                                    <SelectItem value="monthly" className="hover:bg-muted">Monthly</SelectItem>
                                    <SelectItem value="quarterly" className="hover:bg-muted">Quarterly</SelectItem>
                                    <SelectItem value="yearly" className="hover:bg-muted">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="category" className="text-foreground">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-white dark:bg-background border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    <SelectItem value="Rent/Mortgage" className="hover:bg-muted">Rent/Mortgage</SelectItem>
                                    <SelectItem value="Utilities" className="hover:bg-muted">Utilities</SelectItem>
                                    <SelectItem value="Software" className="hover:bg-muted">Software</SelectItem>
                                    <SelectItem value="Insurance" className="hover:bg-muted">Insurance</SelectItem>
                                    <SelectItem value="Salaries" className="hover:bg-muted">Salaries</SelectItem>
                                    <SelectItem value="Marketing" className="hover:bg-muted">Marketing</SelectItem>
                                    <SelectItem value="Other" className="hover:bg-muted">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="startDate" className="text-foreground">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? "Adding..." : "Add Cost"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 