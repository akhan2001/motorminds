import { z } from 'zod'

export const CustomerMigrationFormSchema = z.object({
    shopId: z.string().uuid('Please select a valid shop'),
    
    // Customer data options
    concatName: z.boolean().default(false),
    concatAddress: z.boolean().default(false),
    concatPhone: z.boolean().default(false),
    
    // Name concatenation fields
    firstNameColumn: z.string().optional(),
    lastNameColumn: z.string().optional(),
    
    // Address concatenation fields
    streetColumn: z.string().optional(),
    cityColumn: z.string().optional(),
    provinceColumn: z.string().optional(),
    postalCodeColumn: z.string().optional(),
    
    // Phone concatenation fields
    areaCodeColumn: z.string().optional(),
    phoneNumberColumn: z.string().optional(),
    
    // Data validation options
    validateEmails: z.boolean().default(true),
    validatePhones: z.boolean().default(true),
    duplicateHandling: z.enum(['skip', 'overwrite', 'create_new']).default('skip'),
}).refine((data) => {
    if (data.concatName && (!data.firstNameColumn || !data.lastNameColumn)) {
        return false
    }
    return true
}, {
    message: "First name and last name columns are required when concatenating names",
    path: ["firstNameColumn"]
}).refine((data) => {
    if (data.concatAddress && (!data.streetColumn || !data.cityColumn)) {
        return false
    }
    return true
}, {
    message: "Street and city columns are required when concatenating addresses",
    path: ["streetColumn"]
}).refine((data) => {
    if (data.concatPhone && (!data.areaCodeColumn || !data.phoneNumberColumn)) {
        return false
    }
    return true
}, {
    message: "Area code and phone number columns are required when concatenating phones",
    path: ["areaCodeColumn"]
})

export type CustomerMigrationFormData = z.infer<typeof CustomerMigrationFormSchema>
