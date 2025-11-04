"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

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

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function EmployeeCostTable({ employees, onEdit, onDeactivate }: EmployeeCostTableProps) {
    if (employees.length === 0) {
        return (
            <div className="bg-slate-50 dark:bg-card border border-border rounded-xl p-10 text-center">
                <p className="text-muted-foreground">No active employees found.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-50 dark:bg-card rounded-xl p-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Employee Breakdown</h3>
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Employee</TableHead>
                        <TableHead className="text-muted-foreground">Role</TableHead>
                        <TableHead className="text-muted-foreground">Pay</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((emp) => (
                        <TableRow key={emp.id} className="border-b border-border hover:bg-muted/50">
                            <TableCell className="font-medium text-foreground">{emp.full_name}</TableCell>
                            <TableCell className="text-muted-foreground">{emp.role}</TableCell>
                            <TableCell className="text-muted-foreground">{`${formatCurrency(emp.salary_or_wage)} / ${emp.pay_frequency}`}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                                        <DropdownMenuItem onClick={() => onEdit(emp)}>
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDeactivate(emp.id)} className="text-red-600 dark:text-red-400">
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