import { supabase } from "@/lib/supabase";

// Fetch all invoices from the database with improved error handling and performance
export async function fetchAllInvoices(shopId: string) {
	const { data, error } = await supabase
		.from('invoices')
		.select('*')
		.eq('shop_id', shopId);

	if (error) {
		console.error('Error fetching invoices:', error);
		return [];
	}

	// Get shop details to add to invoices
	const shopDetails = await fetchShopBusinessDetails(shopId);
	
	// Add shop details to each invoice
	const invoicesWithShopDetails = data?.map(invoice => ({
		...invoice,
		hst_number: invoice.hst_number || shopDetails.hst_number,
		business_number: invoice.business_number || shopDetails.business_number
	})) || [];
	
	return invoicesWithShopDetails;
}

// Fetch invoice data by ID
export async function getInvoiceData(id: string) {
	const { data, error } = await supabase
		.from('invoices')
		.select('*')
		.eq('invoice_number', id);

	if (error) {
		console.error('Error fetching invoice:', error);
		return null;
	}
	return data;
}

// Generate new invoice
// export async function generateNewInvoice(shopId: string) {
//   const { data, error } = await supabase
//     .from('invoices')
//     .insert({
//       shop_id: shopId,
//       invoice_number: ,
//       created_at: new Date().toISOString(),
//     })
//     .select();

// }

// Format currency
export function formatCurrency(amount: number | null | undefined): string {
	if (amount === null || amount === undefined) {
		return '$0.00';
	}
	return `$${Number(amount).toFixed(2)}`;
}

// Format date
export function formatDate(dateString: string): string {
	if (dateString === null || dateString === undefined) {
		return '';
	}
	const date = new Date(dateString);
	return date.toLocaleDateString();
}

// Format phone number
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
	if (!phoneNumber) return '';
	
	// Remove all non-numeric characters
	const cleaned = phoneNumber.replace(/\D/g, '');
	
	// Check if we have enough digits
	if (cleaned.length < 10) return phoneNumber;
	
	// Format as (XXX) XXX-XXXX
	const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
	if (match) {
		return `(${match[1]}) ${match[2]}-${match[3]}`;
	}
	
	// Return original if we couldn't format it
	return phoneNumber;
}

// Calculate total with tax
export function calculateTotalWithTax(amount: number, taxRate: number): number {
	return amount + amount * taxRate;
}

// Function to get business details from the shops table
export async function fetchShopBusinessDetails(shopId: string) {
	if (!shopId) {
		console.error('No shop ID provided for fetchShopBusinessDetails');
		return { hst_number: '', business_number: '' };
	}
	
	try {
		const { data, error } = await supabase
			.from('shops')
			.select('hst_number, business_number')
			.eq('id', shopId)
			.single();
		
		if (error) {
			console.error('Error fetching business details:', error);
			return { hst_number: '', business_number: '' };
		}
		
		return {
			hst_number: data?.hst_number || '',
			business_number: data?.business_number || ''
		};
	} catch (err) {
		console.error('Error in fetchShopBusinessDetails:', err);
		return { hst_number: '', business_number: '' };
	}
}

export async function setInvoiceStatus(invoiceId: string, status: string, shopId: string) {
	const updateData: { status: string; paid_at?: string | null } = { status: status };

    if (status === "PAID") {
        updateData.paid_at = new Date().toISOString();
    } else {
        updateData.paid_at = null;
    }

	const { data, error } = await supabase
	.from('invoices')
	.update(updateData)
	.eq('invoice_number', invoiceId)
	.eq('shop_id', shopId);

	if (error) {
		throw error
	}

	return data
}

export async function createNewInvoice(invoiceData: any, shopId: string) {
	try {
		// console.log("Creating invoice with data:", invoiceData);
		
		// Ensure all required fields are present
		const dataToInsert = {
			invoice_number: invoiceData.invoice_number,
			shop_id: shopId,
			status: invoiceData.status || "UNPAID",
			shop_name: invoiceData.shop_name,
			shop_address: invoiceData.shop_address,
			shop_email: invoiceData.shop_email,
			shop_phone: invoiceData.shop_phone,
			client_name: invoiceData.client_name,
			client_address: invoiceData.client_address,
			client_email: invoiceData.client_email,
			client_phone: invoiceData.client_phone,
			amount: invoiceData.amount,
			issue_date: invoiceData.issue_date,
			labour: invoiceData.labour,
			labour_cost: invoiceData.labour_cost,
			parts: invoiceData.parts,
			parts_cost: invoiceData.parts_cost,
			notes: invoiceData.notes,
			mileage: invoiceData.mileage,
			description: invoiceData.description,
			assigned_to: invoiceData.assigned_to,
			customer_id: invoiceData.customer_id,
			vehicle_information: invoiceData.vehicle_info,
			labour_items: invoiceData.labour_items || [],
			parts_items: invoiceData.parts_items || []
		};

		// console.log(invoiceData.vehicle_info)
		
		// Log the final data being sent to the database
		// console.log("Final data to insert:", dataToInsert);
		
		const { data, error } = await supabase
			.from('invoices')
			.insert(dataToInsert)
			.select();
			
		if (error) {
			console.error("Supabase error:", error);
			throw error;
		}
		
		return data;
	} catch (error) {
		console.error("Error in createNewInvoice:", error);
		throw error;
	}
}

export async function deleteInvoice(invoiceId: string, shopId: string) {
	const { data, error } = await supabase
		.from('invoices')
		.delete()
		.eq('invoice_number', invoiceId)
		.eq('shop_id', shopId);

	if (error) {
		throw error;
	}

	return data;
}

export async function updateInvoice(invoiceData: any, shopId: string) {
	try {
		// Validate that we have an invoice number to update
		if (!invoiceData.invoice_number) {
			console.error("No invoice number provided for update");
			throw new Error("Invoice number is required for updates");
		}
		
		// Prepare the data structure for update
		const dataToUpdate = {
			shop_id: shopId,
			status: invoiceData.status || "UNPAID",
			shop_name: invoiceData.shop_name,
			shop_address: invoiceData.shop_address,
			shop_email: invoiceData.shop_email,
			shop_phone: invoiceData.shop_phone,
			client_name: invoiceData.client_name,
			client_address: invoiceData.client_address,
			client_email: invoiceData.client_email,
			client_phone: invoiceData.client_phone,
			amount: invoiceData.amount,
			issue_date: invoiceData.issue_date,
			labour: invoiceData.labour,
			labour_cost: invoiceData.labour_cost,
			parts: invoiceData.parts,
			parts_cost: invoiceData.parts_cost,
			notes: invoiceData.notes,
			mileage: invoiceData.mileage,
			description: invoiceData.description,
			assigned_to: invoiceData.assigned_to,
			customer_id: invoiceData.customer_id,
			vehicle_information: invoiceData.vehicle_info,
			labour_items: invoiceData.labour_items || [],
			parts_items: invoiceData.parts_items || []
		};
		
		// Log update operation for debugging
		console.log(`Updating invoice ${invoiceData.invoice_number}`);
		
		// Execute the update operation with Supabase
		const { data, error } = await supabase
			.from('invoices')
			.update(dataToUpdate)
			.eq('invoice_number', invoiceData.invoice_number)
			.eq('shop_id', shopId) // Additional security check
			.select();
			
		if (error) {
			console.error("Supabase update error:", error);
			throw error;
		}
		
		if (!data || data.length === 0) {
			console.error("No invoice was updated - may not exist or no permission");
			throw new Error("Failed to update invoice - not found or permission denied");
		}
		
		return data;
	} catch (error) {
		console.error("Error in updateInvoice:", error);
		throw error;
	}
}