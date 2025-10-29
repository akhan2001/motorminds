#!/usr/bin/env node

/**
 * Simple MotorMinds Services Migration Script
 * Generates a CSV file for importing services into work order item templates
 * 
 * Usage: node migrate-services.js [shop-id]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_SHOP_ID = '00000000-0000-0000-0000-000000000000';

// Simple categorization rules
const CATEGORIES = {
    'engine': ['engine', 'oil', 'coolant', 'timing', 'crankshaft', 'camshaft', 'valve', 'piston', 'gasket', 'mount'],
    'brakes': ['brake', 'caliper', 'rotor', 'pad', 'master cylinder', 'brake line', 'booster'],
    'suspension': ['shock', 'strut', 'control arm', 'ball joint', 'sway bar', 'bushing', 'spring'],
    'electrical': ['battery', 'alternator', 'starter', 'sensor', 'module', 'ecu', 'bcm', 'fuse', 'relay', 'coil'],
    'transmission': ['transmission', 'clutch', 'differential', 'axle', 'cv', 'gear', 'shifter'],
    'air_conditioning': ['a/c', 'ac', 'air conditioner', 'compressor', 'evaporator', 'condenser', 'refrigerant'],
    'exhaust': ['exhaust', 'muffler', 'catalytic', 'manifold', 'resonator', 'flex pipe'],
    'tires': ['tire', 'wheel', 'balancing', 'rotation', 'tpms', 'rim', 'stud', 'nut'],
    'body': ['bumper', 'door', 'mirror', 'headlight', 'tail light', 'fender', 'hood', 'trunk'],
    'maintenance': ['oil change', 'filter', 'fluid', 'inspection', 'tune up', 'flush'],
    'diagnostics': ['diagnostic', 'check engine', 'smoke test', 'inspection', 'scan'],
    'parts': ['part', 'component', 'assembly', 'kit', 'gasket', 'seal', 'bracket'],
    'labor': ['replacement', 'repair', 'service', 'installation', 'change', 'flush', 'adjustment'],
    'fees': ['fee', 'charge', 'service charge', 'tip', 'credit', 'discount', 'coupon', 'tow'],
    'discounts': ['discount', 'coupon', 'credit', 'off'],
    'packages': ['package', 'kit', 'bundle', 'combo', 'set', 'complete', 'full service']
};

// Item type rules
const ITEM_TYPE_RULES = {
    'labor': ['replacement', 'repair', 'service', 'installation', 'change', 'flush', 'top up', 'adjustment', 'rebuild', 'swap', 'remove', 'fix'],
    'part': ['part', 'component', 'assembly', 'kit', 'gasket', 'seal', 'filter', 'sensor', 'module', 'actuator', 'pump', 'motor', 'valve', 'switch'],
    'service': ['oil change', 'inspection', 'diagnostic', 'tune up', 'balancing', 'rotation', 'alignment', 'flush', 'top up', 'check'],
    'package': ['package', 'kit', 'bundle', 'combo', 'set', 'complete', 'full service', 'oil change package', 'synthetic oil change'],
    'fee': ['fee', 'charge', 'service charge', 'tip', 'credit', 'discount', 'coupon', 'tow', 'estimate', 'quote']
};

/**
 * Parse services data
 */
function parseServicesData(servicesText) {
    const lines = servicesText.split('\n').filter(line => line.trim());
    const services = [];
    
    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 1) continue;
        
        const serviceName = parts[0].trim();
        const taxStr = parts[1]?.trim();
        const priceStr = parts[2]?.trim();
        const itemTypeFromFile = parts[3]?.trim();
        const categoryFromFile = parts[4]?.trim();
        
        // Skip empty lines or header
        if (!serviceName || serviceName === 'SERVICE NO-NAMETAX%PRICEACTION') continue;
        
        // Parse price
        let price = 0;
        if (priceStr && !isNaN(parseFloat(priceStr))) {
            price = parseFloat(priceStr);
        }
        
        // Handle negative prices (discounts/coupons)
        const isDiscount = price < 0;
        
        // Use item type and category from file, or determine if not available
        let itemType = itemTypeFromFile || determineItemType(serviceName);
        let category = categoryFromFile || determineCategory(serviceName);
        
        // Override for discounts/coupons
        if (isDiscount) {
            itemType = 'discount';
            category = 'discounts';
            price = Math.abs(price); // Make positive for display
        }
        
        // Set default price if not provided or too low (but not for discounts)
        if (!isDiscount && price < 5) {
            price = getDefaultPrice(itemType);
        }
        
        services.push({
            shop_id: '', // Will be filled later
            item_type: itemType,
            name: serviceName,
            description: generateDescription(serviceName, itemType, isDiscount),
            quantity: 1,
            unit_price: price,
            unit_cost: isDiscount ? 0 : Math.round(price * 0.65), // No cost for discounts
            part_number: itemType === 'part' ? generatePartNumber(serviceName) : '',
            supplier: itemType === 'part' ? 'Local Supplier' : '',
            category: category,
            labor_hours: (itemType === 'labor' || itemType === 'service' || itemType === 'package') ? estimateLaborHours(serviceName) : '',
            warranty_period: itemType === 'part' ? '12 months' : ''
        });
    }
    
    return services;
}

/**
 * Determine item type
 */
function determineItemType(serviceName) {
    const name = serviceName.toLowerCase();
    
    for (const [type, patterns] of Object.entries(ITEM_TYPE_RULES)) {
        for (const pattern of patterns) {
            if (name.includes(pattern)) {
                return type;
            }
        }
    }
    
    // Special cases
    if (name.includes('oil change') || name.includes('inspection') || name.includes('diagnostic')) {
        return 'service';
    }
    
    if (name.includes('coupon') || name.includes('discount') || name.includes('credit')) {
        return 'fee';
    }
    
    return 'service';
}

/**
 * Determine category
 */
function determineCategory(serviceName) {
    const name = serviceName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
        for (const keyword of keywords) {
            if (name.includes(keyword)) {
                return category;
            }
        }
    }
    
    return 'general';
}

/**
 * Generate description
 */
function generateDescription(serviceName, itemType, isDiscount = false) {
    if (isDiscount) {
        return `${serviceName} - Discount/Coupon`;
    }
    
    const descriptions = {
        'labor': `Professional ${serviceName.toLowerCase()} service`,
        'part': `${serviceName} - Quality automotive part`,
        'service': `${serviceName} - Complete service package`,
        'package': `${serviceName} - Service package with multiple components`,
        'fee': `${serviceName} - Service fee`
    };
    
    return descriptions[itemType] || `${serviceName} - Automotive service`;
}

/**
 * Get default price
 */
function getDefaultPrice(itemType) {
    const defaults = {
        'labor': 150,
        'part': 100,
        'service': 80,
        'package': 200,
        'fee': 25
    };
    
    return defaults[itemType] || 50;
}

/**
 * Generate part number for parts
 */
function generatePartNumber(serviceName) {
    // Create a simple part number based on service name
    const cleanName = serviceName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 8);
    
    return `PN-${cleanName.toUpperCase()}`;
}

/**
 * Estimate labor hours
 */
function estimateLaborHours(serviceName) {
    const name = serviceName.toLowerCase();
    
    // Package services typically take longer
    if (name.includes('package') || name.includes('kit') || name.includes('bundle') || 
        name.includes('complete') || name.includes('full service')) {
        return 3;
    }
    
    if (name.includes('filter') || name.includes('fluid') || name.includes('bulb') || 
        name.includes('sensor') || name.includes('cap') || name.includes('gasket')) {
        return 0.5;
    }
    
    if (name.includes('module') || name.includes('actuator') || name.includes('pump') ||
        name.includes('motor') || name.includes('switch') || name.includes('valve')) {
        return 2;
    }
    
    if (name.includes('engine') || name.includes('transmission') || name.includes('timing') ||
        name.includes('assembly') || name.includes('swap')) {
        return 5;
    }
    
    return 1.5;
}

/**
 * Escape CSV field
 */
function escapeCsvField(value) {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
}

/**
 * Generate CSV
 */
function generateCSV(services, shopId) {
    const headers = [
        'shop_id', 'item_type', 'name', 'description', 'quantity',
        'unit_price', 'unit_cost', 'part_number', 'supplier', 'category',
        'labor_hours', 'warranty_period'
    ];
    
    // Add shop_id to all services
    services.forEach(service => {
        service.shop_id = shopId;
    });
    
    // Generate CSV rows
    const rows = services.map(service => 
        headers.map(header => escapeCsvField(service[header] || ''))
    );
    
    // Combine headers and rows
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);
    const shopId = args[0] || DEFAULT_SHOP_ID;
    
    console.log('🚀 MotorMinds Services Migration');
    console.log('===============================');
    console.log(`Shop ID: ${shopId}`);
    console.log('');
    
    // Read services data
    const servicesDataPath = path.join(__dirname, 'services.txt');
    
    if (!fs.existsSync(servicesDataPath)) {
        console.error('❌ Error: services.txt file not found');
        console.log('Please ensure services.txt exists in the same directory');
        process.exit(1);
    }
    
    const servicesText = fs.readFileSync(servicesDataPath, 'utf8');
    const services = parseServicesData(servicesText);
    
    console.log(`📊 Parsed ${services.length} services`);
    
    // Generate CSV
    const csvContent = generateCSV(services, shopId);
    
    // Create output directory
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write CSV file
    const csvFile = path.join(outputDir, 'work-order-templates.csv');
    fs.writeFileSync(csvFile, csvContent);
    
    console.log(`📄 CSV file generated: ${csvFile}`);
    
    // Generate summary
    const summary = {
        total: services.length,
        byType: {},
        byCategory: {}
    };
    
    services.forEach(service => {
        summary.byType[service.item_type] = (summary.byType[service.item_type] || 0) + 1;
        summary.byCategory[service.category] = (summary.byCategory[service.category] || 0) + 1;
    });
    
    console.log('');
    console.log('📈 Summary:');
    console.log(`Total Services: ${summary.total}`);
    console.log('');
    console.log('By Type:');
    for (const [type, count] of Object.entries(summary.byType)) {
        console.log(`  ${type}: ${count}`);
    }
    console.log('');
    console.log('By Category:');
    for (const [category, count] of Object.entries(summary.byCategory)) {
        console.log(`  ${category}: ${count}`);
    }
    console.log('');
    console.log('✅ CSV file ready for import!');
}

// Run the script
if (require.main === module) {
    main();
}
