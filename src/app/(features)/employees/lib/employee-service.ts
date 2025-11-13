// Employee service for API interactions
import { Employee, EmployeeFormData, EmployeeUpdateData } from '../types/employee'

export class EmployeeService {
    /**
     * Get all employees for a specific shop
     */
    static async getEmployees(shopId: string, activeOnly: boolean = false): Promise<Employee[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        const params = new URLSearchParams({
            shop_id: shopId,
            ...(activeOnly && { active_only: 'true' })
        })

        const response = await fetch(`/api/employees?${params.toString()}`)
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to fetch employees' }))
            throw new Error(error.error || 'Failed to fetch employees')
        }

        const data = await response.json()
        return data.employees || []
    }

    /**
     * Get active employees only (no termination_date)
     */
    static async getActiveEmployees(shopId: string): Promise<Employee[]> {
        return this.getEmployees(shopId, true)
    }

    /**
     * Create a new employee
     */
    static async createEmployee(shopId: string, employeeData: EmployeeFormData): Promise<Employee> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                shop_id: shopId,
                ...employeeData
            }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to create employee' }))
            throw new Error(error.error || 'Failed to create employee')
        }

        const data = await response.json()
        return data.employee
    }

    /**
     * Update an existing employee
     */
    static async updateEmployee(employeeId: string, updateData: EmployeeUpdateData): Promise<Employee> {
        if (!employeeId) {
            throw new Error('Employee ID is required')
        }

        const response = await fetch(`/api/employees/${employeeId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to update employee' }))
            throw new Error(error.error || 'Failed to update employee')
        }

        const data = await response.json()
        return data.employee
    }

    /**
     * Delete (terminate) an employee by setting termination_date
     */
    static async deleteEmployee(employeeId: string): Promise<void> {
        if (!employeeId) {
            throw new Error('Employee ID is required')
        }

        const response = await fetch(`/api/employees/${employeeId}`, {
            method: 'DELETE',
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to delete employee' }))
            throw new Error(error.error || 'Failed to delete employee')
        }
    }

    /**
     * Reactivate a terminated employee by clearing termination_date
     */
    static async reactivateEmployee(employeeId: string): Promise<Employee> {
        return this.updateEmployee(employeeId, { termination_date: null })
    }
}

