# Financial Integration Backend Architecture

## Overview

The MotorMinds financial system integrates invoices, work orders, and service parts to provide comprehensive financial tracking and analytics. This document outlines the backend functionality and data flow.

## Database Schema

### Core Financial Tables

#### `revenue` Table
Tracks all income sources for the shop.

```sql
- id: Primary key
- date: Date of revenue
- amount: Revenue amount
- source: Source description (e.g., "Invoice INV-001")
- notes: Additional details
- shop_id: Reference to shop
- invoice_id: Reference to invoice (optional)
- work_order_id: Reference to work order (optional)
```

#### `cost` Table
Tracks all expenses and costs.

```sql
- id: Primary key
- date: Date of expense
- amount: Cost amount
- type: 'inventory', 'fixed', 'other'
- notes: Description of cost
- shop_id: Reference to shop
- invoice_id: Reference to invoice (optional)
- work_order_id: Reference to work order (optional)
```

### Service & Inventory Tables

#### `shop_services` Table (Existing)
Stores all services and parts offered by the shop.

```sql
- id: Primary key
- shop_id: Reference to shop
- service_name: Name of service/part
- description: Detailed description
- price: Unit price
- quantity: Current inventory (for parts only)
- type: 'labor' or 'parts'
- created_at: Creation timestamp
```

#### `service_usage` Table (New)
Tracks when services/parts are used in work orders.

```sql
- id: Primary key
- shop_id: Reference to shop
- service_id: Reference to shop_services
- work_order_id: Reference to repair_orders
- quantity_used: Amount used
- cost_per_unit: Price at time of use
- total_cost: quantity_used * cost_per_unit
- usage_date: When service was used
```

#### `inventory_movements` Table (New)
Tracks all inventory changes for parts.

```sql
- id: Primary key
- shop_id: Reference to shop
- service_id: Reference to shop_services
- work_order_id: Reference to work order (optional)
- quantity_change: Positive for additions, negative for usage
- reason: Description of movement
- previous_quantity: Quantity before change
- new_quantity: Quantity after change
- movement_date: When movement occurred
```

## API Endpoints

### 1. Invoice Financial Integration

**Endpoint:** `/api/financials/invoice-integration`

#### POST - Process Paid Invoice
Automatically creates revenue and cost entries when an invoice is marked as PAID.

**Request Body:**
```json
{
  "invoice_id": "uuid",
  "shop_id": "uuid"
}
```

**Process:**
1. Validates invoice exists and is PAID
2. Creates revenue entry for full invoice amount
3. Creates cost entry for parts (actual parts cost)
4. Creates cost entry for labor (40% of labor charge as shop cost)

#### GET - Check Integration Status
Check if an invoice has been integrated with the financial system.

**Query Parameters:**
- `invoice_id`: Invoice UUID
- `shop_id`: Shop UUID

**Response:**
```json
{
  "integrated": true,
  "revenue_entry": { "id": "uuid", "amount": 250.00, "date": "2024-01-15" },
  "cost_entries": [
    { "id": "uuid", "amount": 50.00, "type": "inventory", "date": "2024-01-15" }
  ]
}
```

### 2. Service Parts Integration

**Endpoint:** `/api/financials/service-parts-integration`

#### POST - Record Service Usage
Records when services/parts are used in work orders and updates inventory.

**Request Body:**
```json
{
  "shop_id": "uuid",
  "work_order_id": "uuid",
  "services_used": [
    {
      "service_id": "uuid",
      "quantity_used": 2
    }
  ]
}
```

**Process:**
1. Records service usage in `service_usage` table
2. Updates inventory quantities for parts
3. Creates cost entries for parts usage
4. Records inventory movements

#### GET - Retrieve Work Order Service Usage
Get all services used in a specific work order.

**Query Parameters:**
- `work_order_id`: Work Order UUID
- `shop_id`: Shop UUID

**Response:**
```json
{
  "service_usage": [...],
  "inventory_movements": [...],
  "totals": {
    "labor": 150.00,
    "parts": 75.00,
    "total": 225.00
  }
}
```

#### PUT - Restock Inventory
Add inventory to parts and record the cost.

**Request Body:**
```json
{
  "shop_id": "uuid",
  "service_id": "uuid",
  "quantity_added": 10,
  "cost_per_unit": 15.00
}
```

## Data Flow

### 1. Work Order Creation
1. Work order created in `repair_orders` table
2. Work order details added to `repair_order_details` table
3. Services/parts usage recorded via API calls
4. Inventory automatically updated

### 2. Invoice Generation
1. Invoice generated from completed work order
2. Invoice includes labor and parts costs from service usage
3. Invoice stored in `invoices` table

### 3. Payment Processing
1. Invoice status updated to "PAID"
2. Database trigger automatically creates:
   - Revenue entry for full invoice amount
   - Cost entries for parts and labor
3. Financial analytics immediately reflect the transaction

### 4. Inventory Management
1. Parts usage automatically decreases inventory
2. Restocking increases inventory and creates cost entries
3. All movements tracked in `inventory_movements` table

## Database Views

### `work_order_financial_summary`
Provides complete financial overview of each work order:
- Total labor costs
- Total parts costs
- Invoice amount
- Invoice status

### `inventory_status`
Shows current inventory status for all parts:
- Current quantity
- Total used
- Total restocked
- Work orders used in

## Automatic Triggers

### Invoice Payment Trigger
When an invoice status changes to "PAID":
1. Creates revenue entry
2. Creates parts cost entry (if applicable)
3. Creates labor cost entry (40% of labor charge)

This ensures financial data is always up-to-date without manual intervention.

## Integration Points

### With Existing Systems

1. **Invoices System**: Automatically integrates when invoices are paid
2. **Work Orders**: Service usage tracked throughout work order lifecycle
3. **Inventory**: Real-time inventory updates with cost tracking
4. **Financial Analytics**: All data flows into revenue/cost tables for dashboard

### Cost Calculation Logic

#### Revenue
- Full invoice amount when paid

#### Parts Costs
- Actual cost of parts used (from service usage)
- Inventory restocking costs

#### Labor Costs
- 40% of labor charges (representing wages, overhead, etc.)
- Adjustable percentage based on shop's actual cost structure

## Error Handling

1. **Duplicate Processing**: Checks prevent duplicate financial entries
2. **Invalid Data**: Validation ensures data integrity
3. **Missing References**: Foreign key constraints prevent orphaned records
4. **Negative Inventory**: Constraints prevent negative inventory quantities

## Performance Considerations

1. **Indexes**: All foreign keys and date columns indexed
2. **Views**: Pre-calculated summaries for common queries
3. **Triggers**: Minimal processing in triggers for performance
4. **Batch Processing**: Service usage can be recorded in batches

## Future Enhancements

1. **Automated Inventory Reordering**: Alerts when parts are low
2. **Cost Center Tracking**: More granular cost categorization
3. **Profit Margin Analysis**: Real-time profitability by service type
4. **Vendor Integration**: Direct integration with parts suppliers
5. **Tax Calculation**: Automatic tax handling for different jurisdictions 