import { supabase } from "@/lib/supabase";

export interface EmployeeData {
    shop_id: string;
    first_name: string;
    last_name: string;
    role: string;
    salary_or_wage: number;
    pay_frequency: 'hourly' | 'weekly' | 'bi-weekly' | 'monthly';
}

export interface EmployeeUpdateData {
    first_name?: string;
    last_name?: string;
    role?: string;
    salary_or_wage?: number;
    pay_frequency?: 'hourly' | 'weekly' | 'bi-weekly' | 'monthly';
    termination_date?: string | null;
}

/**
 * Fetches all active employees for a given shop.
 * @param shopId - The ID of the shop.
 * @returns A list of active employees.
 */
export async function getActiveEmployees(shopId: string) {
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shopId)
        .is('termination_date', null);

    if (error) {
        console.error("Error fetching employees:", error);
        throw error;
    }

    return data;
}

/**
 * Adds a new employee to the database.
 * @param employeeData - The data for the new employee.
 * @returns The newly created employee data.
 */
export async function addEmployee(employeeData: EmployeeData) {
    const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select();

    if (error) {
        console.error("Error adding employee:", error);
        throw error;
    }

    return data?.[0];
}

/**
 * Updates an existing employee's information.
 * @param employeeId - The ID of the employee to update.
 * @param updateData - An object containing the fields to update.
 * @returns The updated employee data.
 */
export async function updateEmployee(employeeId: string, updateData: EmployeeUpdateData) {
    const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', employeeId)
        .select();

    if (error) {
        console.error("Error updating employee:", error);
        throw error;
    }

    return data?.[0];
}

/**
 * Deactivates an employee by setting their termination date to the current date.
 * This marks them as inactive for payroll calculations.
 * @param employeeId - The ID of the employee to deactivate.
 * @returns The updated employee data.
 */
export async function deactivateEmployee(employeeId: string) {
    const { data, error } = await supabase
        .from('employees')
        .update({ termination_date: new Date().toISOString() })
        .eq('id', employeeId)
        .select();

    if (error) {
        console.error("Error deactivating employee:", error);
        throw error;
    }

    return data?.[0];
}

/**
 * Reactivates an employee by setting their termination date to null.
 * @param employeeId - The ID of the employee to reactivate.
 * @returns The updated employee data.
 */
export async function reactivateEmployee(employeeId: string) {
    const { data, error } = await supabase
        .from('employees')
        .update({ termination_date: null })
        .eq('id', employeeId)
        .select();

    if (error) {
        console.error("Error reactivating employee:", error);
        throw error;
    }

    return data?.[0];
} 