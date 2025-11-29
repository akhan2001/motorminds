"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { EmployeeService } from "@/app/(features)/employees/lib/employee-service"
import { Employee, EmployeeFormData } from "@/app/(features)/employees/types/employee"

const employeeFormSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(50, "First name is too long"),
    last_name: z.string().max(50, "Last name is too long").optional(),
    role: z.string().min(1, "Role is required").max(100, "Role is too long"),
    salary_or_wage: z.coerce.number().min(0, "Salary must be positive").max(1000000, "Salary is too high"),
    pay_frequency: z.enum(['hourly', 'weekly', 'bi-weekly', 'monthly'], {
        required_error: "Pay frequency is required"
    }),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

interface EmployeeFormProps {
    shopId: string
    employee?: Employee | null
    onSuccess: () => void
    onCancel: () => void
}

export function EmployeeForm({ shopId, employee, onSuccess, onCancel }: EmployeeFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isEditing = !!employee

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeFormSchema),
        defaultValues: {
            first_name: employee?.first_name || "",
            last_name: employee?.last_name || "",
            role: employee?.role || "",
            salary_or_wage: employee?.salary_or_wage || 0,
            pay_frequency: employee?.pay_frequency || "hourly",
        },
    })

    // Update form when employee changes
    useEffect(() => {
        if (employee) {
            form.reset({
                first_name: employee.first_name || "",
                last_name: employee.last_name || "",
                role: employee.role || "",
                salary_or_wage: employee.salary_or_wage || 0,
                pay_frequency: employee.pay_frequency || "hourly",
            })
        } else {
            form.reset({
                first_name: "",
                last_name: "",
                role: "",
                salary_or_wage: 0,
                pay_frequency: "hourly",
            })
        }
    }, [employee, form])

    const onSubmit = async (data: EmployeeFormValues) => {
        setIsSubmitting(true)
        try {
            const employeeData: EmployeeFormData = {
                first_name: data.first_name.trim(),
                last_name: data.last_name?.trim() || undefined,
                role: data.role.trim(),
                salary_or_wage: data.salary_or_wage,
                pay_frequency: data.pay_frequency,
            }

            const fullName = `${data.first_name} ${data.last_name || ''}`.trim()
            
            if (isEditing && employee) {
                await EmployeeService.updateEmployee(employee.id, employeeData)
                toast.success(`Employee "${fullName}" updated successfully`)
            } else {
                await EmployeeService.createEmployee(shopId, employeeData)
                toast.success(`Employee "${fullName}" added successfully`)
            }

            form.reset()
            onSuccess()
        } catch (error: any) {
            console.error("Error saving employee:", error)
            toast.error(error.message || "Failed to save employee")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="John"
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="last_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Doe"
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role *</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Lead Technician"
                                        className="bg-white dark:bg-background border-border text-foreground"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="salary_or_wage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Salary / Wage *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="50000"
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="pay_frequency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pay Frequency *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white dark:bg-background border-border text-foreground">
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="hourly">Hourly</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#b22222] hover:bg-[#8b1a1a] text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {isEditing ? "Updating..." : "Adding..."}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isEditing ? "Update Employee" : "Add Employee"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}

