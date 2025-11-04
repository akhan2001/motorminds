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

export default function EditEmployeeModal({ employee, isOpen, onClose, onUpdated }: EditEmployeeModalProps) {
    const [formData, setFormData] = useState<EmployeeUpdateData>({});
    const [loading, setLoading] = useState(false);

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
            onClose();
        } catch (error) {
            console.error("Failed to update employee", error);
            alert("An error occurred while updating the employee.");
        } finally {
            setLoading(false);
        }
    };

    if (!employee) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-50 dark:bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Edit Employee: {employee.first_name} {employee.last_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="first_name" className="text-foreground">First Name</Label>
                            <Input id="first_name" value={formData.first_name ?? ''} onChange={handleChange} className="bg-white dark:bg-background border-border text-foreground"/>
                        </div>
                        <div>
                            <Label htmlFor="last_name" className="text-foreground">Last Name</Label>
                            <Input id="last_name" value={formData.last_name ?? ''} onChange={handleChange} className="bg-white dark:bg-background border-border text-foreground"/>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="role" className="text-foreground">Role</Label>
                        <Input id="role" value={formData.role ?? ''} onChange={handleChange} className="bg-white dark:bg-background border-border text-foreground"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="salary_or_wage" className="text-foreground">Salary / Wage</Label>
                            <Input id="salary_or_wage" type="number" value={formData.salary_or_wage ?? ''} onChange={handleChange} className="bg-white dark:bg-background border-border text-foreground"/>
                        </div>
                        <div>
                            <Label htmlFor="pay_frequency" className="text-foreground">Pay Frequency</Label>
                            <Select value={formData.pay_frequency ?? 'hourly'} onValueChange={handleSelectChange}>
                                <SelectTrigger className="bg-white dark:bg-background border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
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
                    <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 