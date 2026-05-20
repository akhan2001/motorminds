import { supabase } from "@/lib/supabase";
import { getShopLogoUrl } from "@/app/(features)/financials/lib/pdf/logo-utils";

// Fetch all invoices from the database with improved error handling and performance
export async function fetchAllInvoices(shopId: string) {
	const { data, error } = await supabase
		.from('invoices')
		.select('*')
		.eq('shop_id', shopId)
        .order('issue_date', { ascending: false });

	if (error) {
		console.error('Error fetching invoices:', error);
		return [];
	}

	// Get shop details to add to invoices
	const shopDetails = await fetchShopBusinessDetails(shopId);
	
	// Add shop details to each invoice and ensure source field exists
	const invoicesWithShopDetails = data?.map(invoice => ({
		...invoice,
		hst_number: invoice.hst_number || shopDetails.hst_number,
		business_number: invoice.business_number || shopDetails.business_number,
		shop_tagline: shopDetails.shop_tagline,
		source: invoice.source || 'shop_generated' // Default to shop_generated for existing invoices
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

/** Generate new invoice
// export async function generateNewInvoice(shopId: string) {
//   const { data, error } = await supabase
//     .from('invoices')
//     .insert({
//       shop_id: shopId,
//       invoice_number: ,
//       created_at: new Date().toISOString(),
//     })
//     .select();
} */

// Formatting utilities moved to @/lib/utils/formatters
// Import from there: import { formatCurrency, formatDate, formatPhoneNumber } from '@/lib/utils/formatters'

// Calculate total with tax
export function calculateTotalWithTax(amount: number, taxRate: number): number {
	return amount + amount * taxRate;
}

// Function to get business details from the shops table
export async function fetchShopBusinessDetails(shopId: string) {
	if (!shopId) {
		console.error('No shop ID provided for fetchShopBusinessDetails');
		return { hst_number: '', business_number: '', shop_tagline: '', shop_logo: '', shop_name: '', shop_address: '', shop_email: '', shop_phone: '' };
	}
	
	try {
		const { data, error } = await supabase
			.from('shops')
			.select('hst_number, business_number, shop_tagline, shop_name, shop_address, shop_email, shop_phone')
			.eq('id', shopId)
			.single();

		if (error) {
			console.error('Error fetching business details:', error);
			return { hst_number: '', business_number: '', shop_tagline: '', shop_logo: '', shop_name: '', shop_address: '', shop_email: '', shop_phone: '' };
		}

		const shop_logo = (await getShopLogoUrl(shopId)) || '';

		return {
			hst_number: data?.hst_number || '',
			business_number: data?.business_number || '',
			shop_tagline: data?.shop_tagline || '',
			shop_logo,
			shop_name: data?.shop_name || '',
			shop_address: data?.shop_address || '',
			shop_email: data?.shop_email || '',
			shop_phone: data?.shop_phone || ''
		};
	} catch (err) {
		console.error('Error in fetchShopBusinessDetails:', err);
		return { hst_number: '', business_number: '', shop_tagline: '', shop_logo: '', shop_name: '', shop_address: '', shop_email: '', shop_phone: '' };
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
			labour_total_price: invoiceData.labour_total_price,
			parts: invoiceData.parts,
			parts_total_price: invoiceData.parts_total_price,
			notes: invoiceData.notes,
			mileage: invoiceData.mileage,
			description: invoiceData.description,
			assigned_to: invoiceData.assigned_to,
			po_number: invoiceData.po_number,
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
	try {
		console.log("Deleting invoice with ID:", invoiceId, "for shop:", shopId);
		
		if (!invoiceId) {
			throw new Error("Invoice ID is required");
		}
		
		if (!shopId) {
			throw new Error("Shop ID is required");
		}

		// First, check if the invoice exists
		const { data: invoiceData, error: fetchError } = await supabase
			.from('invoices')
			.select('invoice_number')
			.eq('invoice_number', invoiceId)
			.eq('shop_id', shopId)
			.single();

		if (fetchError) {
			console.error("Error fetching invoice:", fetchError);
			throw new Error(`Failed to find invoice: ${fetchError.message}`);
		}

		if (!invoiceData) {
			throw new Error("Invoice not found");
		}

		// Update work orders to remove the invoice reference
		// Note: work_orders.invoice_id stores the invoice_number, not the database ID
		const { error: workOrderError } = await supabase
			.from('work_orders')
			.update({ invoice_id: null })
			.eq('invoice_id', invoiceId);

		if (workOrderError) {
			console.error("Error updating work orders:", workOrderError);
			throw new Error(`Failed to update related work orders: ${workOrderError.message}`);
		}

		// Now delete the invoice
		const { data, error } = await supabase
			.from('invoices')
			.delete()
			.eq('invoice_number', invoiceId)
			.eq('shop_id', shopId);

		if (error) {
			console.error("Supabase delete error:", error);
			throw new Error(`Failed to delete invoice: ${error.message}`);
		}

		console.log("Invoice deleted successfully:", data);
		return data;
	} catch (error) {
		console.error("Error in deleteInvoice function:", error);
		throw error;
	}
}

export async function updateInvoice(invoiceNumber: string, invoiceData: any, shopId: string) {
	try {
		// Validate that we have an invoice number to update
		if (!invoiceNumber) {
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
			labour_total_price: invoiceData.labour_total_price,
			parts: invoiceData.parts,
			parts_total_price: invoiceData.parts_total_price,
			notes: invoiceData.notes,
			mileage: invoiceData.mileage,
			description: invoiceData.description,
			assigned_to: invoiceData.assigned_to,
			po_number: invoiceData.po_number,
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
			.eq('invoice_number', invoiceNumber)
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

export async function updateInvoiceVehicleInfo(invoiceNumber: string, vehicleInfo: any, shopId: string) {
	try {
		// Validate that we have an invoice number to update
		if (!invoiceNumber) {
			console.error("No invoice number provided for vehicle update");
			throw new Error("Invoice number is required for vehicle updates");
		}
		
		// Log update operation for debugging
		console.log(`Updating vehicle info for invoice ${invoiceNumber}`, vehicleInfo);
		
		// Execute the update operation with Supabase
		const { data, error } = await supabase
			.from('invoices')
			.update({ vehicle_information: vehicleInfo })
			.eq('invoice_number', invoiceNumber)
			.eq('shop_id', shopId) // Additional security check
			.select();
			
		if (error) {
			console.error("Supabase update error:", error);
			throw error;
		}
		
		if (!data || data.length === 0) {
			console.error("No invoice was updated - may not exist or no permission");
			throw new Error("Failed to update invoice vehicle info - not found or permission denied");
		}
		
		return data;
	} catch (error) {
		console.error("Error in updateInvoiceVehicleInfo:", error);
		throw error;
	}
}