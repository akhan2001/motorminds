"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

interface EditFixedCostModalProps {
    cost: any;
    onCostUpdated: () => void;
    children: React.ReactNode;
}

export default function EditFixedCostModal({ cost, onCostUpdated, children }: EditFixedCostModalProps) {
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
            setStartDate(new Date(cost.start_date).toISOString().split('T')[0]);
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
            const response = await fetch('/api/financials/efficiency', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
                throw new Error(errData.error || 'Failed to update fixed cost');
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
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                <DialogHeader>
                    <DialogTitle>Edit Fixed Cost</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="costName">Cost Name</Label>
                        <Input id="costName" value={costName} onChange={(e) => setCostName(e.target.value)} className="bg-black"/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-black"/>
                        </div>
                        <div>
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="bg-black"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#131313] border-[#222]">
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
                                <SelectTrigger className="bg-black"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#131313] border-[#222]">
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
                           <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-black"/>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 