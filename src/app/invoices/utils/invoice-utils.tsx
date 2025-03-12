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

	return data || [];
}

// Fetch invoice data by ID
export async function getInvoiceData(id: string) {
const { data, error } = await supabase.from('invoices').select('*').eq('invoice_number', id);

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
export function formatCurrency(amount: number): string {
return `$${amount.toFixed(2)}`;
}

// Format date
export function formatDate(dateString: string): string {
const date = new Date(dateString);
return date.toLocaleDateString();
}

// Calculate total with tax
export function calculateTotalWithTax(amount: number, taxRate: number): number {
return amount + amount * taxRate;
}

export async function setInvoiceStatus(invoiceId: string, status: string) {
	const { data, error } = await supabase
	.from('invoices')
	.update({ status: status })
	.eq('id', invoiceId);

	if (error) {
		throw error
	}

	return data
}

export async function createNewInvoice(invoiceData: any, shopId: string) {
	try {
		console.log("Creating invoice with data:", invoiceData);
		
		// Ensure all required fields are present
		const dataToInsert = {
			invoice_number: invoiceData.invoice_number,
			shop_id: shopId,
			status: invoiceData.status || "UNPAID",
			shop_name: invoiceData.shop_name,
			shop_address: invoiceData.shop_address,
			shop_email: invoiceData.shop_email,
			client_name: invoiceData.client_name,
			client_address: invoiceData.client_address,
			client_email: invoiceData.client_email,
			amount: invoiceData.amount,
			issue_date: invoiceData.issue_date,
			labour: invoiceData.labour,
			parts: invoiceData.parts,
			notes: invoiceData.notes,
			mileage: invoiceData.mileage,
			description: invoiceData.description,
			assigned_to: invoiceData.assigned_to,
			customer_id: invoiceData.customer_id
		};
		
		// Log the final data being sent to the database
		console.log("Final data to insert:", dataToInsert);
		
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
