#!/usr/bin/env node

/**
 * Canlube Services → Work Order Item Templates CSV
 *
 * Input:  services_canlube.txt  (1 column, like "Brake Fluid Replacement13149.99")
 * Output: output/services-canlube-templates.csv
 *
 * - Most rows become item_type = 'service'
 * - Coupon/discount rows become item_type = 'discount'
 */

const fs = require('fs');
const path = require('path');

// TODO: set to the real Supabase shop_id for this client
const SHOP_ID = 'd5e1aefa-87f4-4317-a184-d2407bf25c02';

const INPUT_FILE = path.join(__dirname, 'services_canlube.txt');
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'services-canlube-templates.csv');

const HEADERS = [
    'shop_id',
    'item_type',
    'name',
    'description',
    'quantity',
    'unit_price',
    'unit_cost',
    'part_number',
    'supplier',
    'category',
    'labor_hours',
    'warranty_period',
];

// --- Helpers ---------------------------------------------------------------

/**
 * Parse a CSV row in the format:
 * SERVICE,NO-NAME,TAX%,PRICE,ACTION
 *
 * We care about:
 * - name  = SERVICE
 * - price = PRICE
 *
 * TAX% (usually 13) is ignored.
 * For legacy odd lines without commas (e.g. "Tow Service179.99" or "Tip0"),
 * we fall back to splitting on the last numeric suffix.
 */
function parseRow(raw) {
    const line = raw.trim();
    if (!line || line.startsWith('SERVICE,')) return null; // skip header

    const parts = line.split(',');

    // Normal CSV case: name, tax, price, action...
    if (parts.length >= 3) {
        const name = parts[0].trim();
        const priceStr = (parts[2] || '').trim();
        const price = priceStr ? parseFloat(priceStr) || 0 : 0;
        return { name, price };
    }

    // Fallback for odd lines without commas, e.g. "Tow Service179.99" or "Tip0"
    const m = line.match(/^(.*?)(-?\d[\d.]*)$/);
    if (m) {
        const name = m[1].trim();
        const price = parseFloat(m[2]) || 0;
        return { name, price };
    }

    // No numeric suffix → name only, no price
    return { name: line, price: 0 };
}

function isDiscountName(name) {
    const n = name.toLowerCase();
    return (
        n.includes('coupon') ||
        n.includes('discount') ||
        n.includes('credit') ||
        n.includes('off') ||
        n.includes('estimate') ||
        n.includes('quote') ||
        n.includes('tip')
    );
}

function determineCategory(name) {
    const n = name.toLowerCase();
    if (n.includes('brake')) return 'brakes';
    if (n.includes('tire') || n.includes('wheel')) return 'tires';
    if (n.includes('oil') || n.includes('filter') || n.includes('flush')) return 'maintenance';
    if (n.includes('ac') || n.includes('a/c') || n.includes('air conditioner')) return 'air_conditioning';
    if (n.includes('exhaust') || n.includes('muffler') || n.includes('catalytic')) return 'exhaust';
    if (n.includes('alignment') || n.includes('suspension') || n.includes('strut') || n.includes('shock')) return 'suspension';
    if (n.includes('diagnostic') || n.includes('inspection') || n.includes('check engine') || n.includes('smoke test')) return 'diagnostics';
    if (n.includes('door') || n.includes('bumper') || n.includes('mirror') || n.includes('hood') || n.includes('fender')) return 'body';
    return 'general';
}

function generateDescription(name, itemType, isDiscount) {
    if (isDiscount) return `${name} - Discount/Coupon`;
    if (itemType === 'service') return `${name} - Complete service package`;
    return `${name} - Automotive service`;
}

function estimateLaborHours(name) {
    const n = name.toLowerCase();

    if (n.includes('package') || n.includes('kit') || n.includes('bundle') || n.includes('full synthetic')) {
        return 3;
    }
    if (
        n.includes('filter') ||
        n.includes('bulb') ||
        n.includes('sensor') ||
        n.includes('cap') ||
        n.includes('gasket') ||
        n.includes('wiper')
    ) {
        return 0.5;
    }
    if (
        n.includes('module') ||
        n.includes('actuator') ||
        n.includes('pump') ||
        n.includes('motor') ||
        n.includes('switch') ||
        n.includes('valve')
    ) {
        return 2;
    }
    if (
        n.includes('engine') ||
        n.includes('transmission') ||
        n.includes('timing') ||
        n.includes('swap')
    ) {
        return 5;
    }

    return 1.5;
}

function escapeCsvField(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
}

// --- Main transform --------------------------------------------------------

function parseCanlubeServices(text) {
    const lines = text.split('\n').filter((l) => l.trim());
    const services = [];

    for (const rawLine of lines) {
        const parsed = parseRow(rawLine);
        if (!parsed) continue;

        const { name, price } = parsed;
        if (!name) continue;

        const isDiscount = isDiscountName(name) || price < 0;

        const item_type = isDiscount ? 'discount' : 'service';
        const category = isDiscount ? 'discounts' : determineCategory(name);

        // Postgres numeric columns can't accept empty strings during CSV import,
        // so we always emit numeric values and let the app override them later.
        // If there is a price in the source, use it (abs for discounts); otherwise default to 0.
        let unit_price = '0';
        if (price && price !== 0) {
            unit_price = String(isDiscount ? Math.abs(price) : price);
        }

        // For templates, default cost and labor_hours to 0 (can be adjusted later in the app)
        const unit_cost = '0';
        const labor_hours = '0';
        const description = generateDescription(name, item_type, isDiscount);

        services.push({
            shop_id: SHOP_ID,
            item_type,
            name,
            description,
            quantity: 1,
            unit_price,
            unit_cost,
            part_number: '',       // we treat these as services, not parts
            supplier: '',          // no supplier for pure services
            category,
            labor_hours,
            warranty_period: '',   // can be filled later if needed
        });
    }

    return services;
}

function generateCSV(services) {
    const rows = services.map((svc) =>
        HEADERS.map((h) => escapeCsvField(svc[h] ?? '')).join(',')
    );
    return [HEADERS.join(','), ...rows].join('\n');
}

// --- Run -------------------------------------------------------------------

(function main() {
    console.log('🚗 Canlube Services → Work Order Templates');
    console.log('Input :', INPUT_FILE);
    console.log('Output:', OUTPUT_FILE);
    console.log('');

    if (!fs.existsSync(INPUT_FILE)) {
        console.error('❌ services_canlube.txt not found');
        process.exit(1);
    }

    const text = fs.readFileSync(INPUT_FILE, 'utf8');
    const services = parseCanlubeServices(text);

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const csv = generateCSV(services);
    fs.writeFileSync(OUTPUT_FILE, csv);

    console.log(`✅ Generated ${services.length} templates`);
})();