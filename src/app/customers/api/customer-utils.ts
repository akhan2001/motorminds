import { supabase } from "@/lib/supabase";

/**
 * Fetch customers from the "customers" table filtered by shopId
 */
export async function getCustomers(shopId: string) {
    try {
        if (!shopId || shopId === "null") {
            console.error("Invalid shop ID:", shopId);
            return [];
        }
        
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId);
    
        if (error) {
            console.error("Supabase error:", error.message, error);
            return [];
        }
        
        return data || [];
    } catch (err) {
        console.error("Unexpected error in getCustomers:", err);
        return [];
    }
}

export async function getCustomerName(customerId: string) {
    const { data, error } = await supabase
        .from('customers')
        .select('customer_name')
        .eq('id', customerId)
        .single();

    if (error) {
        console.error('Error fetching customer name:', error);
        throw new Error('Failed to fetch customer name');
    }

    return data?.customer_name || null;
}

export async function createNewCustomer(customer: any, shopId: string) {
    console.log("Creating new customer:", customer.customer_phone, customer.customer_name, customer.customer_email);

    try {
        // First check if a customer with this phone number already exists for this shop
        const { data: existingCustomers, error: searchError } = await supabase
            .from('customers')
            .select('id, customer_name, customer_phone')
            .eq('customer_phone', customer.customer_phone)
            .eq('shop_id', shopId);
        
        if (searchError) {
            console.error('Error searching for existing customer:', searchError);
            throw new Error('Failed to check for existing customers');
        }
        
        // If customer with this phone already exists, return the existing customer
        if (existingCustomers && existingCustomers.length > 0) {
            console.log('Customer with this phone number already exists:', existingCustomers[0]);
            return existingCustomers[0];
        }
        
        // If no existing customer, create a new one
        const { data, error } = await supabase
            .from('customers')
            .insert({
                customer_name: customer.customer_name,
                customer_email: customer.customer_email,
                customer_phone: customer.customer_phone,
                customer_address: customer.customer_address || "",
                created_at: new Date().toISOString(),
                shop_id: shopId
            })
            .select();

        if (error) {
            console.error('Error creating customer:', error);
            throw new Error('Failed to create customer');
        }

        return data[0];
    } catch (error) {
        console.error('Error in createNewCustomer:', error);
        throw error;
    }
}

export async function checkCustomerExists(customerPhone: string, shopId: string) {
    const { data, error } = await supabase
        .from('customers')
        .select('id, customer_name, customer_phone')
        .eq('customer_phone', customerPhone)
        .eq('shop_id', shopId);

    if (error) {
        console.error('Error checking customer existence:', error);
        throw new Error('Failed to check customer existence');
    }

    return data && data.length > 0;
}

export async function updateCustomer(customerId: string, customerData: any) {
    try {
        // Validate inputs
        if (!customerId) {
            throw new Error('Customer ID is required');
        }

        if (!customerData.customerName?.trim()) {
            throw new Error('Customer name is required');
        }

        // Prepare update data
        const updateData = {
            customer_name: customerData.customerName.trim(),
            customer_email: customerData.customerEmail?.trim() || null,
            customer_phone: customerData.customerPhone?.trim() || null,
            customer_address: customerData.customerAddress?.trim() || null,
            updated_at: new Date().toISOString()
        };

        // Perform update
        const { data, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', customerId)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error.message);
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error updating customer:', error.message);
        } else {
            console.error('Error updating customer:', error);
        }
        return null;
    }
}

export async function deleteCustomer(customerId: string, shopId: string) {
    try {
        // Update the customer to remove shop association instead of deleting
        const { data, error } = await supabase
            .from('customers')
            .update({ 
                shop_id: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', customerId)
            .eq('shop_id', shopId)  // Make sure we're updating the correct shop's customer
            .select();

        if (error) {
            console.error('Error removing customer from shop:', error.message);
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Error updating customer:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        }
        return false;
    }
}

export async function getCustomerVehicles(customerId: string) {
    const { data, error } = await supabase
        .from('customer_vehicles')
        .select('*')
        .eq('customer_id', customerId);
    
    if (error) {
        console.error('Error fetching customer vehicles:', error);
        return [];
    }

    return data || [];
}

export async function createCustomerVehicle(customerId: string, vehicleData: any) {
    try {
        // Validate required fields
        if (!customerId) {
            throw new Error('Customer ID is required');
        }
        if (!vehicleData.year || !vehicleData.make || !vehicleData.model) {
            throw new Error('Year, make, and model are required');
        }

        const { data, error } = await supabase
            .from('customer_vehicles')
            .insert({
                customer_id: customerId,
                year: vehicleData.year,
                make: vehicleData.make,
                model: vehicleData.model,
                color: vehicleData.color || null,
                vin: vehicleData.vin || null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating customer vehicle:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error creating customer vehicle:', error);
        return null;
    }
}

export async function deleteCustomerVehicle(vehicleId: string) {
    const { error } = await supabase
        .from('customer_vehicles')
        .delete()
        .eq('id', vehicleId);

    if (error) throw error;
    return true;
}

export async function sendEmail(email: string, subject: string, body: string, recipient_name: string) {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, subject, body, recipient_name }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to send email');
        }
        
        return data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

export async function sendInvoiceEmail(email: string, emailData: any, recipient_name: string, invoiceNumber: string) {
    try {
        const subject = emailData.subject;
        const body = emailData.body;
        const attachments = emailData.attachments;
        const shopName = emailData.shopName;

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, subject, body, recipient_name, invoiceNumber, attachments, shopName }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send email');
        }

        return data;
    } catch (error) {
        console.error('Error sending invoice email:', error);
        throw error;
    }
}

// Validate phone number format with "1234567890"
export function validatePhoneNumber(phoneNumber: string) {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    return digitsOnly.length === 10;
}

export function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
