"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/app/financials/utils/formatting";

interface Employee {
    id: string;
    full_name: string;
    role: string;
    pay_frequency: 'hourly' | 'weekly' | 'bi-weekly' | 'monthly';
    salary_or_wage: number;
}

interface EmployeeCostTableProps {
    employees: Employee[];
    onEdit: (employee: Employee) => void;
    onDeactivate: (employeeId: string) => void;
}

export default function EmployeeCostTable({ employees, onEdit, onDeactivate }: EmployeeCostTableProps) {
    if (employees.length === 0) {
        return (
            <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-10 text-center">
                <p className="text-gray-400">No active employees found.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Employee Breakdown</h3>
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-gray-700 hover:bg-transparent">
                        <TableHead className="text-gray-400">Employee</TableHead>
                        <TableHead className="text-gray-400">Role</TableHead>
                        <TableHead className="text-gray-400">Pay</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((emp) => (
                        <TableRow key={emp.id} className="border-b border-gray-800 hover:bg-[#222]">
                            <TableCell className="font-medium text-white">{emp.full_name}</TableCell>
                            <TableCell className="text-gray-300">{emp.role}</TableCell>
                            <TableCell className="text-gray-300">{`${formatCurrency(emp.salary_or_wage)} / ${emp.pay_frequency}`}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#131313] border-[#333] text-white">
                                        <DropdownMenuItem onClick={() => onEdit(emp)}>
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDeactivate(emp.id)} className="text-red-500">
                                            Deactivate
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 