"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

interface AddOneTimeCostModalProps {
    shopId: string;
    onCostAdded: () => void;
    children: React.ReactNode;
}

export default function AddOneTimeCostModal({ shopId, onCostAdded, children }: AddOneTimeCostModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [costName, setCostName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Other");
    const [costDate, setCostDate] = useState(new Date().toISOString().split('T')[0]);
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
            const response = await fetch('/api/financials/one-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                throw new Error(errData.error || 'Failed to add cost');
            }

            // Reset form and close modal
            setCostName("");
            setAmount("");
            setCategory("Other");
            setCostDate(new Date().toISOString().split('T')[0]);
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
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                <DialogHeader>
                    <DialogTitle>Add One-Time Cost</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="costName">Cost Name</Label>
                        <Input id="costName" placeholder="e.g., New Equipment" value={costName} onChange={(e) => setCostName(e.target.value)} className="bg-zinc-800 border-zinc-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input id="amount" type="number" placeholder="500" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-800 border-zinc-700" />
                        </div>
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="Equipment">Equipment</SelectItem>
                                    <SelectItem value="Repairs">Repairs</SelectItem>
                                    <SelectItem value="Supplies">Supplies</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="costDate">Date</Label>
                        <Input id="costDate" type="date" value={costDate} onChange={(e) => setCostDate(e.target.value)} className="bg-zinc-800 border-zinc-700" />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? "Adding..." : "Add Cost"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 