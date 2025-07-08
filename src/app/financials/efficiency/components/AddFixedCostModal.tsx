"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

interface AddFixedCostModalProps {
    shopId: string;
    onCostAdded: () => void;
    children: React.ReactNode;
}

export default function AddFixedCostModal({ shopId, onCostAdded, children }: AddFixedCostModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [costName, setCostName] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("monthly");
    const [category, setCategory] = useState("Utilities");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
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
            const response = await fetch('/api/financials/efficiency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                throw new Error(errData.error || 'Failed to add fixed cost');
            }
            
            // Reset form and close modal
            setCostName("");
            setAmount("");
            setFrequency("monthly");
            setCategory("Utilities");
            setStartDate(new Date().toISOString().split('T')[0]);
            onCostAdded(); // This will refetch the data on the parent page
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
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50">
                <DialogHeader>
                    <DialogTitle>Add New Fixed Cost</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="costName">Cost Name</Label>
                        <Input id="costName" placeholder="e.g., Workshop Rent" value={costName} onChange={(e) => setCostName(e.target.value)} className="bg-zinc-800 border-zinc-700"/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input id="amount" type="number" placeholder="1500" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-800 border-zinc-700"/>
                        </div>
                        <div>
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="category">Category</Label>
                             <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="Rent/Mortgage">Rent/Mortgage</SelectItem>
                                    <SelectItem value="Utilities">Utilities</SelectItem>
                                    <SelectItem value="Software">Software</SelectItem>
                                    <SelectItem value="Insurance">Insurance</SelectItem>
                                    <SelectItem value="Salaries">Salaries</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                           <Label htmlFor="startDate">Start Date</Label>
                           <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-zinc-800 border-zinc-700"/>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? "Adding..." : "Add Cost"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 