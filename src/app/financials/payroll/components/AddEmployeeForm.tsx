"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addEmployee } from "@/app/settings/utils/settings-utils";
import { toast } from "sonner";

interface AddEmployeeFormProps {
    shopId: string;
    onAdded: () => void;
}

export default function AddEmployeeForm({ shopId, onAdded }: AddEmployeeFormProps) {
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const employeeData = {
            first_name: formData.get('first_name') as string,
            last_name: formData.get('last_name') as string,
            role: formData.get('role') as string,
            salary_or_wage: Number(formData.get('salary_or_wage')),
            pay_frequency: formData.get('pay_frequency') as 'hourly' | 'weekly' | 'bi-weekly' | 'monthly',
            shop_id: shopId,
        };

        try {
            await addEmployee(employeeData);
            toast.success("Employee added successfully!");
            onAdded();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add employee.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" name="first_name" required className="bg-zinc-800 border-zinc-700"/>
                </div>
                <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" name="last_name" required className="bg-zinc-800 border-zinc-700"/>
                </div>
            </div>
            <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" required className="bg-zinc-800 border-zinc-700"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="salary_or_wage">Salary / Wage</Label>
                    <Input id="salary_or_wage" name="salary_or_wage" type="number" required className="bg-zinc-800 border-zinc-700"/>
                </div>
                <div>
                    <Label htmlFor="pay_frequency">Pay Frequency</Label>
                    <Select name="pay_frequency" defaultValue="hourly">
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
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? 'Adding...' : 'Add Employee'}
                </Button>
            </div>
        </form>
    );
} 