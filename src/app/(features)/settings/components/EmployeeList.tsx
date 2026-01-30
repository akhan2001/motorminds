"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Edit, Trash2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { EmployeeService } from "@/app/(features)/employees/lib/employee-service"
import { Employee, EmployeeStatus } from "@/app/(features)/employees/types/employee"
import { TechnicianWorkOrdersModal } from "./TechnicianWorkOrdersModal"
import { formatCurrency } from "@/lib/utils/currency"

interface EmployeeListProps {
    shopId: string
    onAddNew: () => void
    onEdit: (employee: Employee) => void
}

export function EmployeeList({ shopId, onAddNew, onEdit }: EmployeeListProps) {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
    const [statusFilter, setStatusFilter] = useState<EmployeeStatus>("all")
    const [isLoading, setIsLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [selectedTechnician, setSelectedTechnician] = useState<Employee | null>(null)
    const [isWorkOrdersModalOpen, setIsWorkOrdersModalOpen] = useState(false)

    const loadEmployees = async () => {
        setIsLoading(true)
        try {
            const data = await EmployeeService.getEmployees(shopId, false)
            setEmployees(data)
        } catch (error: any) {
            console.error("Error loading employees:", error)
            toast.error(error.message || "Failed to load employees")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (shopId) {
            loadEmployees()
        }
    }, [shopId])

    useEffect(() => {
        let filtered = employees

        if (statusFilter === "active") {
            filtered = employees.filter(emp => !emp.termination_date)
        } else if (statusFilter === "terminated") {
            filtered = employees.filter(emp => emp.termination_date)
        }

        setFilteredEmployees(filtered)
    }, [employees, statusFilter])

    const handleDelete = async (employee: Employee) => {
        if (!confirm(`Are you sure you want to terminate ${employee.first_name} ${employee.last_name || ''}?`)) {
            return
        }

        setDeletingId(employee.id)
        try {
            await EmployeeService.deleteEmployee(employee.id)
            toast.success(`Employee "${employee.first_name} ${employee.last_name || ''}" terminated`)
            loadEmployees()
        } catch (error: any) {
            console.error("Error deleting employee:", error)
            toast.error(error.message || "Failed to terminate employee")
        } finally {
            setDeletingId(null)
        }
    }

    const handleReactivate = async (employee: Employee) => {
        setDeletingId(employee.id)
        try {
            await EmployeeService.reactivateEmployee(employee.id)
            toast.success(`Employee "${employee.first_name} ${employee.last_name || ''}" reactivated`)
            loadEmployees()
        } catch (error: any) {
            console.error("Error reactivating employee:", error)
            toast.error(error.message || "Failed to reactivate employee")
        } finally {
            setDeletingId(null)
        }
    }

    const formatPayFrequency = (frequency: string) => {
        return frequency.charAt(0).toUpperCase() + frequency.slice(1).replace("-", "-")
    }

    const handleRowClick = (employee: Employee, e: React.MouseEvent) => {
        // Don't trigger if clicking on action buttons
        const target = e.target as HTMLElement
        if (target.closest('button')) {
            return
        }
        
        setSelectedTechnician(employee)
        setIsWorkOrdersModalOpen(true)
    }

    const handleCloseWorkOrdersModal = () => {
        setIsWorkOrdersModalOpen(false)
        setSelectedTechnician(null)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium text-foreground">Employees</h3>
                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EmployeeStatus)}>
                        <SelectTrigger className="w-[180px] bg-white dark:bg-background border-border text-foreground">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            <SelectItem value="active">Active Only</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={onAddNew}
                        className="bg-[#b22222] hover:bg-[#8b1a1a] text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                    </Button>
                </div>
            </div>

            {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 border border-border rounded-lg bg-slate-50 dark:bg-[#1A1A1A]">
                    <p className="text-muted-foreground">
                        {statusFilter === "all"
                            ? "No employees found. Add your first employee to get started."
                            : statusFilter === "active"
                            ? "No active employees found."
                            : "No terminated employees found."}
                    </p>
                </div>
            ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Salary / Wage</TableHead>
                                <TableHead>Pay Frequency</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map((employee) => {
                                const isActive = !employee.termination_date
                                const fullName = `${employee.first_name} ${employee.last_name || ''}`.trim()

                                return (
                                    <TableRow 
                                        key={employee.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={(e) => handleRowClick(employee, e)}
                                    >
                                        <TableCell className="font-medium">{fullName}</TableCell>
                                        <TableCell>{employee.role}</TableCell>
                                        <TableCell>{formatCurrency(employee.salary_or_wage)}</TableCell>
                                        <TableCell>{formatPayFrequency(employee.pay_frequency)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={isActive ? "default" : "secondary"}
                                                className={isActive ? "bg-green-600" : ""}
                                            >
                                                {isActive ? "Active" : "Terminated"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onEdit(employee)
                                                    }}
                                                    disabled={deletingId === employee.id}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {isActive ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDelete(employee)
                                                        }}
                                                        disabled={deletingId === employee.id}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        {deletingId === employee.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleReactivate(employee)
                                                        }}
                                                        disabled={deletingId === employee.id}
                                                        className="text-green-600 hover:text-green-700"
                                                    >
                                                        {deletingId === employee.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <RotateCcw className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {selectedTechnician && (
                <TechnicianWorkOrdersModal
                    technicianId={selectedTechnician.id}
                    technicianName={`${selectedTechnician.first_name} ${selectedTechnician.last_name || ''}`.trim()}
                    shopId={shopId}
                    isOpen={isWorkOrdersModalOpen}
                    onClose={handleCloseWorkOrdersModal}
                />
            )}
        </div>
    )
}

