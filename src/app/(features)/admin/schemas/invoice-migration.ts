import { z } from 'zod'

export const InvoiceMigrationFormSchema = z.object({
    shopId: z.string().uuid('Please select a valid shop'),
    
    referenceCustomers: z.boolean().default(false),
    customerIdColumn: z.string().optional(),
    customerMatchColumn: z.string().optional(),
    
    referenceVehicles: z.boolean().default(false),
    vehicleIdColumn: z.string().optional(),
    
    dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'auto']).default('auto'),
    currency: z.enum(['USD', 'CAD', 'EUR', 'GBP']).default('CAD'),
    duplicateHandling: z.enum(['skip', 'overwrite', 'create_new']).default('skip'),
}).refine((data) => {
    if (data.referenceCustomers && !data.customerIdColumn) {
        return false
    }
    return true
}, {
    message: "Customer ID column is required when referencing customers",
    path: ["customerIdColumn"]
}).refine((data) => {
    if (data.referenceCustomers && !data.customerMatchColumn) {
        return false
    }
    return true
}, {
    message: "Customer match column is required when referencing customers",
    path: ["customerMatchColumn"]
}).refine((data) => {
    if (data.referenceVehicles && !data.vehicleIdColumn) {
        return false
    }
    return true
}, {
    message: "Vehicle ID column is required when referencing vehicles",
    path: ["vehicleIdColumn"]
})

export type InvoiceMigrationFormData = z.infer<typeof InvoiceMigrationFormSchema>

