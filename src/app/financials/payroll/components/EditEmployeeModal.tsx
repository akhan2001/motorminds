"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmployeeUpdateData, updateEmployee } from "../utils/employee-management";

interface EditEmployeeModalProps {
    employee: any | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

export default function EditEmployeeModal({ employee: initialEmployee, isOpen, onClose, onUpdated }: EditEmployeeModalProps) {
    const [formData, setFormData] = useState<EmployeeUpdateData>({});
    const [loading, setLoading] = useState(false);
    const employee = initialEmployee;

    useEffect(() => {
        if (employee) {
            setFormData({
                first_name: employee.first_name,
                last_name: employee.last_name,
                role: employee.role,
                salary_or_wage: employee.salary_or_wage,
                pay_frequency: employee.pay_frequency,
            });
        }
    }, [employee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, pay_frequency: value as any }));
    };

    const handleSubmit = async () => {
        if (!employee) return;
        setLoading(true);

        const updateData: EmployeeUpdateData = {
            ...formData,
            salary_or_wage: formData.salary_or_wage ? Number(formData.salary_or_wage) : undefined,
        }

        try {
            await updateEmployee(employee.id, updateData);
            onUpdated();
        } catch (error) {
            console.error("Failed to update employee", error);
            alert("An error occurred while updating the employee.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50">
                <DialogHeader>
                    <DialogTitle>Edit Employee: {employee?.first_name} {employee?.last_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="first_name">First Name</Label>
                            <Input id="first_name" value={formData.first_name ?? ''} onChange={handleChange} className="bg-zinc-800 border-zinc-700"/>
                        </div>
                        <div>
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input id="last_name" value={formData.last_name ?? ''} onChange={handleChange} className="bg-zinc-800 border-zinc-700"/>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" value={formData.role ?? ''} onChange={handleChange} className="bg-zinc-800 border-zinc-700"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="salary_or_wage">Salary / Wage</Label>
                            <Input id="salary_or_wage" type="number" value={formData.salary_or_wage ?? ''} onChange={handleChange} className="bg-zinc-800 border-zinc-700"/>
                        </div>
                        <div>
                            <Label htmlFor="pay_frequency">Pay Frequency</Label>
                            <Select value={formData.pay_frequency ?? 'hourly'} onValueChange={handleSelectChange}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="hourly">Hourly</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 