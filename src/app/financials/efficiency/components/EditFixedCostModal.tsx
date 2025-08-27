"use client";

import { useState, useEffect } from "react";
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

interface EditFixedCostModalProps {
    cost: any;
    onCostUpdated: () => void;
    children: React.ReactNode;
}

export default function EditFixedCostModal({
    cost,
    onCostUpdated,
    children,
}: EditFixedCostModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [costName, setCostName] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("");
    const [category, setCategory] = useState("");
    const [startDate, setStartDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (cost) {
            setCostName(cost.cost_name);
            setAmount(String(cost.amount));
            setFrequency(cost.frequency);
            setCategory(cost.category);
            setStartDate(new Date(cost.start_date).toISOString().split("T")[0]);
        }
    }, [cost]);

    const handleSubmit = async () => {
        setError("");
        if (!costName || !amount || !frequency || !category || !startDate) {
            setError("Please fill out all fields.");
            return;
        }
        setLoading(true);

        try {
            const response = await fetch("/api/financials/efficiency", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: cost.id,
                    cost_name: costName,
                    amount: parseFloat(amount),
                    frequency,
                    category,
                    start_date: startDate,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to update fixed cost");
            }

            onCostUpdated();
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
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50">
                <DialogHeader>
                    <DialogTitle>Edit Fixed Cost</DialogTitle>
                    <DialogDescription className="sr-only">A dialog to edit an existing recurring fixed cost in your financials.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="costName">Cost Name</Label>
                        <Input
                            id="costName"
                            value={costName}
                            onChange={(e) => setCostName(e.target.value)}
                            className="bg-zinc-800 border-zinc-700"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div>
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="daily" className="hover:bg-zinc-800">Daily</SelectItem>
                                    <SelectItem value="weekly" className="hover:bg-zinc-800">Weekly</SelectItem>
                                    <SelectItem value="monthly" className="hover:bg-zinc-800">Monthly</SelectItem>
                                    <SelectItem value="quarterly" className="hover:bg-zinc-800">Quarterly</SelectItem>
                                    <SelectItem value="yearly" className="hover:bg-zinc-800">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="Rent/Mortgage" className="hover:bg-zinc-800">Rent/Mortgage</SelectItem>
                                    <SelectItem value="Utilities" className="hover:bg-zinc-800">Utilities</SelectItem>
                                    <SelectItem value="Software" className="hover:bg-zinc-800">Software</SelectItem>
                                    <SelectItem value="Insurance" className="hover:bg-zinc-800">Insurance</SelectItem>
                                    <SelectItem value="Salaries" className="hover:bg-zinc-800">Salaries</SelectItem>
                                    <SelectItem value="Marketing" className="hover:bg-zinc-800">Marketing</SelectItem>
                                    <SelectItem value="Other" className="hover:bg-zinc-800">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 