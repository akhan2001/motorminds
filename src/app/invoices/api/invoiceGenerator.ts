import easyinvoice from 'easyinvoice';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { getShopId } from '@/utils/supabase/supabase-shop';

interface InvoiceData {
    invoiceNumber: string
    status: string
    shopName: string
    shopAddress: string
    shopEmail: string
    amount: number
    labour: string
    parts: string
    labour_cost: string
    parts_cost: string
    notes: string
    mileage: string
    description: string
    assignedTo: string
    issueDate: string
    clientName: string
    clientAddress: string
    clientEmail: string
    vehicle_information: {
        year: string
        make: string
        model: string
        vin: string
        license_plate: string
    }
}

const fetchData = async (workOrderDetailsID: any, workOrderID: any) => {
    // Get the work order details data
    const { data: detailsData, error } = await supabase
        .from('repair_order_details')
        .select('cost, labour, parts, notes, mileage, description, Assigned_to, labour_cost, parts_cost')
        .eq('id', workOrderDetailsID)

    // console.log("Amount: " + amount?.[0].cost)

    // Get the work order data
    const { data: workOrderData, error: workOrderError } = await supabase
        .from('repair_orders')
        .select('shop_id, customer_id, vehicle_id')
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

    //Grab vehicle information from vehicle_information table
    const { data: vehicleData, error: vehicleError } = await supabase
        .from('customer_vehicles')
        .select('year, make, model, vin, license_plate')
        .eq('id', workOrderData?.[0].vehicle_id)

    
    // console.log("Customer Data: " + customerData?.[0].customer_name + "\n" + customerData?.[0].customer_address + "\n" + customerData?.[0].customer_email)

    const invoiceData: InvoiceData = {
        invoiceNumber: uuidv4(),
        status: "UNPAID",
        shopName: shopData?.[0].shop_name,
        shopAddress: shopData?.[0].shop_address,
        shopEmail: shopData?.[0].shop_email,
        amount: detailsData?.[0].cost,
        labour: detailsData?.[0].labour,
        parts: detailsData?.[0].parts,
        labour_cost: detailsData?.[0].labour_cost,
        parts_cost: detailsData?.[0].parts_cost,
        notes: detailsData?.[0].notes,
        mileage: detailsData?.[0].mileage,
        description: detailsData?.[0].description,
        assignedTo: detailsData?.[0].Assigned_to,
        issueDate: new Date().toISOString(),
        clientName: customerData?.[0].customer_name,
        clientAddress: customerData?.[0].customer_address,
        clientEmail: customerData?.[0].customer_email,
        vehicle_information: {
            year: vehicleData?.[0].year,
            make: vehicleData?.[0].make,
            model: vehicleData?.[0].model,
            vin: vehicleData?.[0].vin || "",
            license_plate: vehicleData?.[0].license_plate || ""
        }
    }

    if (error) {
        console.error(error)
        return;
    }

    return invoiceData;
}

const createNewInvoice = async (invoiceData: any, workOrderID: any, shopId: string): Promise<{ invoice_number: string }[] | null> => {
    // console.log(invoiceData)

    const { data, error } = await supabase
        .from('invoices')
        .insert({
            invoice_number: invoiceData.invoiceNumber,
            workorder_id: workOrderID,
            status: invoiceData.status,
            shop_name: invoiceData.shopName,
            shop_address: invoiceData.shopAddress,
            shop_email: invoiceData.shopEmail,
            amount: invoiceData.amount,
            labour: invoiceData.labour,
            parts: invoiceData.parts,
            labour_cost: invoiceData.labour_cost,
            parts_cost: invoiceData.parts_cost,
            notes: invoiceData.notes,
            mileage: invoiceData.mileage,
            description: invoiceData.description,
            assigned_to: invoiceData.assignedTo,
            issue_date: invoiceData.issueDate,
            client_name: invoiceData.clientName,
            client_address: invoiceData.clientAddress,
            client_email: invoiceData.clientEmail,
            shop_id: shopId,
            vehicle_information: invoiceData.vehicle_information
        })
        .select('invoice_number')
        
    if (error) {
        console.error(error)
        return null;
    }

    return data;
}

export async function generateInvoice(repairOrderID: any, shopId: string) {
    // console.log("shopId: " + shopId)
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
        .eq('workorder_id', repairOrderDetailsID)
        .eq('shop_id', shopId)

    // Debug logs
    // console.log("Existing Invoice Data:", existingInvoice);
    // console.log("Check Error:", checkError);
    // console.log("Is Array Empty:", Array.isArray(existingInvoice) && existingInvoice.length === 0);

    // Check if there's an existing invoice
    if (existingInvoice && existingInvoice.length > 0) {
        console.log('Invoice already exists for this work order.');
        return false;
    }

    // If no existing invoice, proceed with insert
    // console.log("Generating invoice for work order ID: " + repairOrderID + " and repair order details ID: " + repairOrderDetailsID)
    const invoiceData = await fetchData(repairOrderDetailsID, repairOrderID)

    // console.log(invoiceData)
    const newInvoice = await createNewInvoice(invoiceData, repairOrderDetailsID, shopId)

    if (newInvoice) {
        return newInvoice;
    }

    return true;
    // const invoice = await easyinvoice.createInvoice(data);
    // return invoice;
}
