import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// Types for the integration
interface InvoiceFinancialData {
  invoice_id: string;
  shop_id: string;
  amount: number;
  labour_cost: number;
  parts_cost: number;
  issue_date: string;
  status: "PAID" | "UNPAID";
  description?: string;
  invoice_number: string;
}

// Function to create revenue entry from paid invoice
async function createRevenueFromInvoice(invoiceData: InvoiceFinancialData) {
  const { data, error } = await supabase
    .from("revenue")
    .insert({
      date: invoiceData.issue_date.split('T')[0], // Extract date part
      amount: invoiceData.amount,
      source: `Invoice ${invoiceData.invoice_number}`,
      notes: `Revenue from completed work order - ${invoiceData.description || 'Service completed'}`,
      shop_id: invoiceData.shop_id,
      invoice_id: invoiceData.invoice_id
    })
    .select();

  if (error) throw error;
  return data;
}

// Function to create cost entries from invoice breakdown
async function createCostsFromInvoice(invoiceData: InvoiceFinancialData) {
  const costs = [];

  // Create parts cost entry if exists
  if (invoiceData.parts_cost && invoiceData.parts_cost > 0) {
    const { data: partsCost, error: partsError } = await supabase
      .from("cost")
      .insert({
        date: invoiceData.issue_date.split('T')[0],
        amount: invoiceData.parts_cost,
        type: "inventory",
        notes: `Parts cost for Invoice ${invoiceData.invoice_number}`,
        shop_id: invoiceData.shop_id,
        invoice_id: invoiceData.invoice_id
      })
      .select();

    if (partsError) throw partsError;
    costs.push(...(partsCost || []));
  }

  // Create labour cost entry if exists (this represents the cost to the shop, not revenue)
  if (invoiceData.labour_cost && invoiceData.labour_cost > 0) {
    const { data: labourCost, error: labourError } = await supabase
      .from("cost")
      .insert({
        date: invoiceData.issue_date.split('T')[0],
        amount: invoiceData.labour_cost * 0.4, // Assume 40% of labour charge is actual cost (wages, overhead)
        type: "other",
        notes: `Labour cost for Invoice ${invoiceData.invoice_number}`,
        shop_id: invoiceData.shop_id,
        invoice_id: invoiceData.invoice_id
      })
      .select();

    if (labourError) throw labourError;
    costs.push(...(labourCost || []));
  }

  return costs;
}

// POST endpoint to process invoice payment and create financial entries
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice_id, shop_id } = body;

    if (!invoice_id || !shop_id) {
      return NextResponse.json(
        { error: "Missing invoice_id or shop_id" },
        { status: 400 }
      );
    }

    // Fetch invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .eq("shop_id", shop_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Only process if invoice is PAID
    if (invoice.status !== "PAID") {
      return NextResponse.json(
        { error: "Invoice must be paid to process financial integration" },
        { status: 400 }
      );
    }

    // Check if already processed
    const { data: existingRevenue } = await supabase
      .from("revenue")
      .select("id")
      .eq("invoice_id", invoice_id)
      .limit(1);

    if (existingRevenue && existingRevenue.length > 0) {
      return NextResponse.json(
        { message: "Invoice already processed for financial integration" },
        { status: 200 }
      );
    }

    const invoiceFinancialData: InvoiceFinancialData = {
      invoice_id: invoice.id,
      shop_id: invoice.shop_id,
      amount: invoice.amount,
      labour_cost: invoice.labour_cost || 0,
      parts_cost: invoice.parts_cost || 0,
      issue_date: invoice.issue_date,
      status: invoice.status,
      description: invoice.description,
      invoice_number: invoice.invoice_number
    };

    // Create revenue entry
    const revenueData = await createRevenueFromInvoice(invoiceFinancialData);

    // Create cost entries
    const costData = await createCostsFromInvoice(invoiceFinancialData);

    return NextResponse.json({
      success: true,
      message: "Invoice successfully integrated with financial system",
      data: {
        revenue: revenueData,
        costs: costData
      }
    });

  } catch (error: any) {
    console.error("Error in invoice financial integration:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check integration status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoice_id = searchParams.get("invoice_id");
    const shop_id = searchParams.get("shop_id");

    if (!invoice_id || !shop_id) {
      return NextResponse.json(
        { error: "Missing invoice_id or shop_id" },
        { status: 400 }
      );
    }

    // Check if invoice has been integrated
    const { data: revenueEntry } = await supabase
      .from("revenue")
      .select("id, amount, date")
      .eq("invoice_id", invoice_id)
      .limit(1);

    const { data: costEntries } = await supabase
      .from("cost")
      .select("id, amount, type, date")
      .eq("invoice_id", invoice_id);

    const isIntegrated = revenueEntry && revenueEntry.length > 0;

    return NextResponse.json({
      integrated: isIntegrated,
      revenue_entry: revenueEntry?.[0] || null,
      cost_entries: costEntries || []
    });

  } catch (error: any) {
    console.error("Error checking integration status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 