import { supabase } from "@/lib/supabase"

// Format phone number
export const formatPhoneNumber = (phone: string) => {
    if (!phone) return "N/A"
    if (phone.length === 10) {
        return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6, 10)}`
    }
    return phone
}

// Format date
export const formatDate = (dateString: string) => {
    try {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    } catch (error) {
        console.error("Error formatting date:", dateString, error)
        return "Invalid Date"
    }
}

// Set invoice status
export const setInvoiceStatus = async (invoiceId: string, status: string, shopId: string) => {
    await supabase.from("invoices").update({ status }).eq("id", invoiceId).eq("shop_id", shopId)
}

// Delete invoice
export const deleteInvoice = async (invoiceId: string, shopId: string) => {
    await supabase.from('invoices').delete().eq('id', invoiceId);
}

export const mapInvoiceToDialog = (invoice: any) => {
    return {
        invoiceNumber: invoice.invoice_number,
    }
} 