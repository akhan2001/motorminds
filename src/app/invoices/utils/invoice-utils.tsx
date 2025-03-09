	import { supabase } from '@/lib/supabase';

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