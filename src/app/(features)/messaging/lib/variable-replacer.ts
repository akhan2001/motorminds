/**
 * Variable Replacement System for AI Messaging
 * Handles template variable replacement with support for nested data structures
 */

/**
 * Available variables documentation
 * Variables are accessed using [variable_name] syntax in templates
 */
export const AVAILABLE_VARIABLES = {
    // Customer variables
    customer: {
        customer_name: 'Customer full name',
        customer_phone: 'Customer phone number',
        customer_email: 'Customer email address',
        customer_address: 'Customer address',
    },
    // Vehicle variables
    vehicle: {
        year: 'Vehicle year',
        make: 'Vehicle make (e.g., Toyota, Ford)',
        model: 'Vehicle model',
        license_plate: 'License plate number',
        vin: 'Vehicle identification number',
        mileage: 'Current mileage',
        color: 'Vehicle color',
    },
    // Work order variables
    work_order: {
        work_order_number: 'Work order number',
        title: 'Work order title',
        status: 'Work order status',
        completed_at: 'Completion date and time',
        total_amount: 'Total amount charged',
    },
    // Appointment variables
    appointment: {
        appointment_date: 'Appointment date',
        appointment_time: 'Appointment time',
        start_time: 'Appointment start time',
        service_type: 'Service type',
        confirmation_code: 'Appointment confirmation code',
    },
    // Shop variables
    shop: {
        shop_name: 'Shop name',
        shop_phone: 'Shop phone number',
        shop_address: 'Shop address',
        shop_email: 'Shop email',
    },
    // Service variables
    service: {
        service_type: 'Type of service performed',
        service_date: 'Date service was performed',
        service_amount: 'Amount charged for service',
    },
} as const

/**
 * Get nested value from object using dot notation
 * Example: getNestedValue(data, 'customer.customer_name')
 */
function getNestedValue(obj: any, path: string): string | null {
    if (!obj || !path) return null
    
    const keys = path.split('.')
    let value = obj
    
    for (const key of keys) {
        if (value === null || value === undefined) return null
        value = value[key]
    }
    
    return value !== null && value !== undefined ? String(value) : null
}

/**
 * Format date value based on common date field names
 */
function formatDateValue(value: string | null, fieldName: string): string {
    if (!value) return ''
    
    try {
        const date = new Date(value)
        if (isNaN(date.getTime())) return value
        
        // Format based on field type
        if (fieldName.includes('date') && !fieldName.includes('time')) {
            // Date only
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } else if (fieldName.includes('time') && !fieldName.includes('date')) {
            // Time only
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        } else {
            // Date and time
            return date.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        }
    } catch {
        return value
    }
}

/**
 * Format currency value
 */
function formatCurrencyValue(value: string | number | null): string {
    if (value === null || value === undefined) return ''
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return String(value)
    
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD'
    }).format(numValue)
}

/**
 * Replace variables in template string with actual values
 * 
 * @param template - Template string with [variable_name] placeholders
 * @param data - Data object containing values (can be nested)
 * @param options - Options for replacement behavior
 * @returns Processed string with variables replaced
 * 
 * @example
 * replaceVariables(
 *   "Hi [customer_name], your [vehicle.make] [vehicle.model] service is complete!",
 *   {
 *     customer_name: "John Doe",
 *     vehicle: { make: "Toyota", model: "Camry" }
 *   }
 * )
 * // Returns: "Hi John Doe, your Toyota Camry service is complete!"
 */
export function replaceVariables(
    template: string,
    data: Record<string, any>,
    options: {
        missingVariableBehavior?: 'empty' | 'placeholder' | 'keep'
    } = {}
): string {
    const { missingVariableBehavior = 'empty' } = options
    
    if (!template || typeof template !== 'string') {
        return ''
    }
    
    // Match [variable_name] or [nested.path] patterns
    const variablePattern = /\[([^\]]+)\]/g
    
    return template.replace(variablePattern, (match, variablePath) => {
        // Trim whitespace from variable path
        const path = variablePath.trim()
        
        // Get value from data (supports nested paths like "customer.customer_name")
        let value = getNestedValue(data, path)
        
        // If not found, try common aliases
        if (value === null) {
            value = tryCommonAliases(data, path)
        }
        
        // Format value based on field type
        if (value !== null) {
            value = formatValue(value, path)
        }
        
        // Handle missing variables
        if (value === null || value === '') {
            switch (missingVariableBehavior) {
                case 'placeholder':
                    return `[${path}]`
                case 'keep':
                    return match
                case 'empty':
                default:
                    return ''
            }
        }
        
        return value
    })
}

/**
 * Try common aliases for variable names
 * Handles variations like customer_name vs customerName
 */
function tryCommonAliases(data: Record<string, any>, path: string): string | null {
    // Common alias mappings
    const aliases: Record<string, string[]> = {
        'customer_name': ['customerName', 'name', 'customer.name'],
        'customer_phone': ['customerPhone', 'phone', 'customer.phone'],
        'customer_email': ['customerEmail', 'email', 'customer.email'],
        'vehicle.make': ['vehicleMake', 'make', 'vehicleMake'],
        'vehicle.model': ['vehicleModel', 'model', 'vehicleModel'],
        'vehicle.year': ['vehicleYear', 'year', 'vehicleYear'],
        'shop_name': ['shopName', 'shop.name'],
        'shop_phone': ['shopPhone', 'shop.phone'],
        'work_order_number': ['workOrderNumber', 'orderNumber', 'woNumber'],
    }
    
    // Check if path has aliases
    const pathAliases = aliases[path]
    if (pathAliases) {
        for (const alias of pathAliases) {
            const value = getNestedValue(data, alias)
            if (value !== null) return value
        }
    }
    
    // Try direct access if path contains underscores
    if (path.includes('_')) {
        const camelCase = path.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        const value = getNestedValue(data, camelCase)
        if (value !== null) return value
    }
    
    return null
}

/**
 * Format value based on field name patterns
 */
function formatValue(value: string | number, fieldName: string): string {
    if (value === null || value === undefined) return ''
    
    const strValue = String(value)
    
    // Format dates
    if (fieldName.includes('date') || fieldName.includes('time') || fieldName.includes('_at')) {
        return formatDateValue(strValue, fieldName)
    }
    
    // Format currency
    if (fieldName.includes('amount') || fieldName.includes('price') || fieldName.includes('cost') || fieldName.includes('total')) {
        return formatCurrencyValue(value)
    }
    
    return strValue
}

/**
 * Extract all variables from a template
 * Useful for validation and preview
 */
export function extractVariables(template: string): string[] {
    if (!template || typeof template !== 'string') {
        return []
    }
    
    const variablePattern = /\[([^\]]+)\]/g
    const variables: string[] = []
    let match
    
    while ((match = variablePattern.exec(template)) !== null) {
        const variable = match[1].trim()
        if (variable && !variables.includes(variable)) {
            variables.push(variable)
        }
    }
    
    return variables
}

/**
 * Validate that all variables in template have corresponding data
 * Returns array of missing variables
 */
export function validateVariables(
    template: string,
    data: Record<string, any>
): string[] {
    const variables = extractVariables(template)
    const missing: string[] = []
    
    for (const variable of variables) {
        const value = getNestedValue(data, variable)
        if (value === null) {
            // Try aliases
            const aliasValue = tryCommonAliases(data, variable)
            if (aliasValue === null) {
                missing.push(variable)
            }
        }
    }
    
    return missing
}

/**
 * Get a flattened list of all available variables for UI display
 */
export function getAvailableVariablesList(): Array<{ path: string; description: string }> {
    const list: Array<{ path: string; description: string }> = []
    
    for (const [category, vars] of Object.entries(AVAILABLE_VARIABLES)) {
        for (const [key, description] of Object.entries(vars)) {
            list.push({
                path: category === 'customer' || category === 'shop' 
                    ? key 
                    : `${category}.${key}`,
                description
            })
        }
    }
    
    return list
}
