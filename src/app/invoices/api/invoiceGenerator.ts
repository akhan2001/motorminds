import easyinvoice from 'easyinvoice';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface InvoiceData {
    invoiceNumber: string
    status: string
    shopName: string
    shopAddress: string
    shopEmail: string
    amount: number
    issueDate: string
    clientName: string
    clientAddress: string
    clientEmail: string
}

const fetchData = async (workOrderDetailsID: any, workOrderID: any) => {
    const { data: amount, error } = await supabase
        .from('repair_order_details')
        .select('cost')
        .eq('id', workOrderDetailsID)

    // console.log("Amount: " + amount?.[0].cost)

    // Get the work order data
    const { data: workOrderData, error: workOrderError } = await supabase
        .from('repair_orders')
        .select('shop_id, customer_id')
        .eq('id', workOrderID)

    // console.log("Shop ID: " + workOrderData?.[0].shop_id + "\nCustomer ID: " + workOrderData?.[0].customer_id)

    // Grab shop name, address, and email from shop_id
    const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('shop_name, shop_address, shop_email')
        .eq('id', workOrderData?.[0].shop_id)

    // console.log("Shop Data: " + shopData?.[0].shop_name + "\n" + shopData?.[0].shop_address + "\n" + shopData?.[0].shop_email)

    // Grab customer name, address, and email from customer_id
    const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('customer_name, customer_address, customer_email')
        .eq('id', workOrderData?.[0].customer_id)
    
    // console.log("Customer Data: " + customerData?.[0].customer_name + "\n" + customerData?.[0].customer_address + "\n" + customerData?.[0].customer_email)

    const invoiceData: InvoiceData = {
        status: "UNPAID",
        shop_name: shopData?.[0].shop_name,
        shop_address: shopData?.[0].shop_address,
        shop_email: shopData?.[0].shop_email,
        amount: amount?.[0].cost,
        issueDate: new Date().toISOString(),
        client_name: customerData?.[0].customer_name,
        client_address: customerData?.[0].customer_address,
        client_email: customerData?.[0].customer_email
    }

    if (error) {
        console.error(error)
        return;
    }

    return invoiceData;
}

const createNewInvoice = async (invoiceData: any, workOrderID: any) => {
    
    const { data, error } = await supabase
        .from('invoices')
        .insert({
            invoice_number: uuidv4(),
            workorder_id: workOrderID,
            status: invoiceData.status,
            shop_name: invoiceData.shop_name,
            shop_address: invoiceData.shop_address,
            shop_email: invoiceData.shop_email,
            amount: invoiceData.amount,
            issue_date: invoiceData.issueDate,
            client_name: invoiceData.client_name,
            client_address: invoiceData.client_address,
            client_email: invoiceData.client_email
        })
        
    if (error) {
        console.error(error)
        return;
    }

    return data;
}

export async function generateInvoice(repairOrderID: any) {

    // Getting id from repair_orders table
    const { data: repair_order_details_id, error: error } = await supabase
        .from('repair_order_details')
        .select('id')
        .eq('repair_order_id', repairOrderID)
    
    if (error) {
        console.error(error)
        return;
    }

    // console.log("Repair Order ID: " + repairOrderID?.[0].id)
    const repairOrderDetailsID = repair_order_details_id?.[0].id

    const { data: existingInvoice, error: checkError } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('workorder_id', repairOrderDetailsID);

    // Debug logs
    console.log("Existing Invoice Data:", existingInvoice); // Log the full data
    console.log("Check Error:", checkError); // Log any errors
    console.log("Is Array Empty:", Array.isArray(existingInvoice) && existingInvoice.length === 0); // Check if it's an empty array

    // Check if there's an existing invoice
    if (existingInvoice && existingInvoice.length > 0) {
        console.log('Invoice already exists for this work order.');
        return false;
    }

    // If no existing invoice, proceed with insert
    console.log("Generating invoice for work order ID: " + repairOrderID + " and repair order details ID: " + repairOrderDetailsID)
    const invoiceData = await fetchData(repairOrderDetailsID, repairOrderID)

    console.log(invoiceData)
    createNewInvoice(invoiceData, repairOrderDetailsID)

    return true;
    // const invoice = await easyinvoice.createInvoice(data);
    // return invoice;
}



