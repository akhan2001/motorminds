"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmployeeList } from "./EmployeeList"
import { EmployeeForm } from "./EmployeeForm"
import { Employee } from "@/app/(features)/employees/types/employee"

interface EmployeesTabProps {
    shopId: string
}

export function EmployeesTab({ shopId }: EmployeesTabProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
    const refreshTriggerRef = useRef(0)

    const handleAddNew = () => {
        setEditingEmployee(null)
        setIsModalOpen(true)
    }

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee)
        setIsModalOpen(true)
    }

    const handleFormSuccess = () => {
        setIsModalOpen(false)
        setEditingEmployee(null)
        // Trigger refresh of employee list
        refreshTriggerRef.current += 1
    }

    const handleFormCancel = () => {
        setIsModalOpen(false)
        setEditingEmployee(null)
    }

    return (
        <div className="space-y-6">
            <EmployeeList
                key={refreshTriggerRef.current}
                shopId={shopId}
                onAddNew={handleAddNew}
                onEdit={handleEdit}
            />

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-white dark:bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEmployee ? "Edit Employee" : "Add New Employee"}
                        </DialogTitle>
                    </DialogHeader>
                    <EmployeeForm
                        shopId={shopId}
                        employee={editingEmployee}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

