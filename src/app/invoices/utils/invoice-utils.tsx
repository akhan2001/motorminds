import { supabase } from '@/lib/supabase';

// Fetch all invoices from the database
export async function fetchAllInvoices() {
  const { data, error } = await supabase.from('invoices').select('*');
  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
  return data;
}

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