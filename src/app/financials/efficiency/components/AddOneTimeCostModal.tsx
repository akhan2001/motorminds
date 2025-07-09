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

interface AddOneTimeCostModalProps {
    shopId: string;
    onCostAdded: () => void;
    children: React.ReactNode;
}

export default function AddOneTimeCostModal({
    shopId,
    onCostAdded,
    children,
}: AddOneTimeCostModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [costName, setCostName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Tools/Equipment");
    const [costDate, setCostDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");
        if (!costName || !amount || !category || !costDate) {
            setError("Please fill out all fields.");
            return;
        }
        setLoading(true);

        try {
            const response = await fetch("/api/financials/one-time", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shop_id: shopId,
                    cost_name: costName,
                    amount: parseFloat(amount),
                    category,
                    cost_date: costDate,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to add one-time cost");
            }

            setCostName("");
            setAmount("");
            setCategory("Tools/Equipment");
            setCostDate(new Date().toISOString().split("T")[0]);
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
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50">
                <DialogHeader>
                    <DialogTitle>Add New One-Time Cost</DialogTitle>
                    <DialogDescription className="sr-only">A dialog to add a new one-time cost to your financials.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="costName">Cost Name</Label>
                        <Input
                            id="costName"
                            placeholder="e.g., New Wrench Set"
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
                                placeholder="350"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="Tools/Equipment" className="hover:bg-zinc-800">
                                        Tools/Equipment
                                    </SelectItem>
                                    <SelectItem value="Repairs/Maintenance" className="hover:bg-zinc-800">
                                        Repairs/Maintenance
                                    </SelectItem>
                                    <SelectItem value="Training/Certification" className="hover:bg-zinc-800">
                                        Training/Certification
                                    </SelectItem>
                                    <SelectItem value="Marketing/Advertising" className="hover:bg-zinc-800">
                                        Marketing/Advertising
                                    </SelectItem>
                                    <SelectItem value="Legal/Consulting" className="hover:bg-zinc-800">
                                        Legal/Consulting
                                    </SelectItem>
                                    <SelectItem value="Office Supplies" className="hover:bg-zinc-800">
                                        Office Supplies
                                    </SelectItem>
                                    <SelectItem value="Other" className="hover:bg-zinc-800">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="costDate">Date of Cost</Label>
                        <Input
                            id="costDate"
                            type="date"
                            value={costDate}
                            onChange={(e) => setCostDate(e.target.value)}
                            className="bg-zinc-800 border-zinc-700"
                        />
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
                        {loading ? "Adding..." : "Add Cost"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 