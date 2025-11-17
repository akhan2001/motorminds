// src/app/(features)/ai/AIDiagnostics/lib/cost-calculator.ts

import { createClient } from '@/utils/supabase/server';
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client';

const motorClient = new MotorDaasClient({
    publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
    privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
    baseUrl: 'https://api.motor.com/v1'
});

export interface PartEstimate {
    partNumber: string;
    description: string;
    quantity: number;
    unitPrice?: number;
}

export interface CostEstimateParams {
    baseVehicleId: number;
    shopId: number;
    operation: string;
    parts?: PartEstimate[];
    laborHoursOverride?: number;
}

export interface CostEstimate {
    operation: string;
    labor: {
        hours: number;
        ratePerHour: number;
        min: number;
        max: number;
    };
    parts: {
        items: Array<{
            description: string;
            quantity: number;
            unitPrice: number;
            subtotal: number;
        }>;
        total: number;
    };
    tax: {
        rate: number;
        amount: {
            min: number;
            max: number;
        };
    };
    total: {
        min: number;
        max: number;
    };
    breakdown: string;
}

/**
 * Get shop hourly labor rate from settings
 */
async function getShopLaborRate(shopId: number): Promise<number> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('shop_settings')
        .select('hourly_labor_rate')
        .eq('shop_id', shopId)
        .single();

    if (error || !data || !data.hourly_labor_rate) {
        // Default to $100/hour if not set
        return 100.0;
    }

    return data.hourly_labor_rate;
}

/**
 * Get shop tax rate from settings
 */
async function getShopTaxRate(shopId: number): Promise<number> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('shop_settings')
        .select('tax_rate')
        .eq('shop_id', shopId)
        .single();

    if (error || !data || !data.tax_rate) {
        // Default to 8% if not set
        return 0.08;
    }

    return data.tax_rate / 100; // Convert percentage to decimal
}

/**
 * Get labor hours from MOTOR DaaS
 */
async function getLaborHours(
    baseVehicleId: number,
    operation: string
): Promise<number> {
    try {
        const workTimes = await motorClient.getEstimatedWorkTimes(baseVehicleId, operation);

        if (workTimes.workTimes.length > 0) {
            // Return the first matching work time
            return workTimes.workTimes[0].laborHours;
        }

        // If no exact match, try to get all work times and find closest match
        const allWorkTimes = await motorClient.getEstimatedWorkTimes(baseVehicleId);
        const operationLower = operation.toLowerCase();

        const match = allWorkTimes.workTimes.find(wt =>
            wt.operationDescription.toLowerCase().includes(operationLower) ||
            operationLower.includes(wt.operationDescription.toLowerCase())
        );

        if (match) {
            return match.laborHours;
        }
    } catch (error) {
        console.error('Error fetching labor hours from MOTOR:', error);
    }

    // Default estimate if not found (2 hours)
    return 2.0;
}

/**
 * Calculate repair cost estimate
 */
export async function calculateRepairCost(
    params: CostEstimateParams
): Promise<CostEstimate> {
    const { baseVehicleId, shopId, operation, parts = [], laborHoursOverride } = params;

    // Get shop rates
    const [laborRate, taxRate] = await Promise.all([
        getShopLaborRate(shopId),
        getShopTaxRate(shopId)
    ]);

    // Get labor hours
    const laborHours = laborHoursOverride || await getLaborHours(baseVehicleId, operation);

    // Calculate labor cost with 10% variance
    const laborMin = laborHours * 0.9 * laborRate;
    const laborMax = laborHours * 1.1 * laborRate;

    // Calculate parts cost
    const partsItems = parts.map(part => {
        const unitPrice = part.unitPrice || 0;
        return {
            description: part.description,
            quantity: part.quantity,
            unitPrice,
            subtotal: unitPrice * part.quantity
        };
    });

    const partsTotal = partsItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Calculate subtotals
    const subtotalMin = laborMin + partsTotal;
    const subtotalMax = laborMax + partsTotal;

    // Calculate tax (on parts only in most jurisdictions)
    const taxMin = partsTotal * taxRate;
    const taxMax = partsTotal * taxRate;

    // Calculate totals
    const totalMin = subtotalMin + taxMin;
    const totalMax = subtotalMax + taxMax;

    // Create breakdown
    const breakdown = `
Labor: ${laborHours.toFixed(1)} hours @ $${laborRate.toFixed(2)}/hr = $${laborMin.toFixed(2)} - $${laborMax.toFixed(2)}
Parts: ${partsItems.length} items = $${partsTotal.toFixed(2)}
Tax (${(taxRate * 100).toFixed(1)}%): $${taxMin.toFixed(2)} - $${taxMax.toFixed(2)}
Total: $${totalMin.toFixed(2)} - $${totalMax.toFixed(2)}
  `.trim();

    return {
        operation,
        labor: {
            hours: laborHours,
            ratePerHour: laborRate,
            min: laborMin,
            max: laborMax
        },
        parts: {
            items: partsItems,
            total: partsTotal
        },
        tax: {
            rate: taxRate,
            amount: {
                min: taxMin,
                max: taxMax
            }
        },
        total: {
            min: totalMin,
            max: totalMax
        },
        breakdown
    };
}

/**
 * Format cost estimate for display
 */
export function formatCostEstimate(estimate: CostEstimate): string {
    return `
**${estimate.operation}**

**Labor:** ${estimate.labor.hours.toFixed(1)} hours @ $${estimate.labor.ratePerHour.toFixed(2)}/hr
- Range: $${estimate.labor.min.toFixed(2)} - $${estimate.labor.max.toFixed(2)}

**Parts:** ${estimate.parts.items.length} items - $${estimate.parts.total.toFixed(2)}
${estimate.parts.items.map(item =>
        `- ${item.description}: ${item.quantity}x @ $${item.unitPrice.toFixed(2)} = $${item.subtotal.toFixed(2)}`
    ).join('\n')}

**Tax (${(estimate.tax.rate * 100).toFixed(1)}%):** $${estimate.tax.amount.min.toFixed(2)} - $${estimate.tax.amount.max.toFixed(2)}

**Total Estimate:** $${estimate.total.min.toFixed(2)} - $${estimate.total.max.toFixed(2)}
  `.trim();
}