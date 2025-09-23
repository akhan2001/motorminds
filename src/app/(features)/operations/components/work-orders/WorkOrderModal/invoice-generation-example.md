# Invoice Generation - Temporary Fix

## Overview

The invoice generation function has been updated to use the temporary invoice service that works with the legacy `invoices` table structure.

## How It Works

### 1. **Trigger**
- The "Generate Invoice" button appears in the work order modal footer when:
  - Work order status is `'completed'`
  - User has appropriate permissions

### 2. **Data Collection**
The `handleGenerateInvoice` function collects:

#### **Work Order Items**
- Fetches all work order items using `getWorkOrderItems()`
- Calculates totals using `calculateInvoiceTotals()` (excludes rejected items)

#### **Customer Information**
```typescript
client_name: workOrderDetails?.customer?.customer_name
client_email: workOrderDetails?.customer?.customer_email
client_phone: workOrderDetails?.customer?.customer_phone
client_address: workOrderDetails?.customer?.customer_address
```

#### **Vehicle Information**
```typescript
vehicle_information: {
    year: workOrderDetails.vehicle.year,
    make: workOrderDetails.vehicle.make,
    model: workOrderDetails.vehicle.model,
    color: workOrderDetails.vehicle.color,
    vin: workOrderDetails.vehicle.vin,
    license_plate: workOrderDetails.vehicle.license_plate,
    mileage: workOrderDetails.vehicle.mileage
}
```

#### **Shop Information** (Hard-coded for now)
```typescript
shop_name: 'MotorMinds Auto Shop'
shop_email: 'info@motorminds.com'
shop_phone: '(555) 123-4567'
shop_address: '123 Auto Street, City, State 12345'
```

### 3. **Invoice Creation**
- Uses `createInvoiceFromWorkOrder()` from `invoice-temp-service.ts`
- Creates record in legacy `invoices` table
- Updates work order items with `invoice_id`
- Updates work order with `invoice_id`

### 4. **User Feedback**
- Success: Shows toast with invoice number
- Error: Shows error toast
- Closes work order modal on success

## Usage

```typescript
// In WorkOrderDetailsModal component
const handleGenerateInvoice = async () => {
    // Collect work order items and calculate totals
    const workOrderItems = await getWorkOrderItems(workOrderId)
    const calculations = calculateInvoiceTotals(workOrderItems)
    
    // Prepare invoice data
    const invoiceData = {
        work_order_id: workOrderId,
        customer_id: customerId,
        vehicle_id: vehicleId,
        shop_id: shopId,
        status: 'UNPAID',
        source: 'shop_generated',
        workOrderItems: workOrderItems,
        // ... customer, vehicle, shop details
    }
    
    // Create invoice
    const invoice = await createInvoiceFromWorkOrder(invoiceData)
    
    // Show success message
    toast.success(`Invoice ${invoice.display_id} generated!`)
}
```

## Database Updates

When an invoice is generated:

1. **`invoices` table**: New record created
2. **`work_order_items` table**: `invoice_id` field updated
3. **`work_orders` table**: `invoice_id` field updated

## Next Steps

### Immediate
- ✅ Function works with legacy table structure
- ✅ Handles all required fields
- ✅ Provides user feedback

### Future Improvements
1. **Shop Settings Integration**: Replace hard-coded shop details with actual shop settings
2. **Invoice Viewing**: Create route to view generated invoices
3. **Migration**: Eventually migrate to new `invoices_table` structure
4. **Print/PDF**: Add invoice printing capabilities

## Testing

To test the invoice generation:

1. Create a work order with items
2. Complete the work order (status = 'completed')
3. Open work order details modal
4. Click "Generate Invoice" button
5. Check:
   - Toast shows success message
   - Invoice record created in database
   - Work order and items linked to invoice

## Error Handling

The function handles:
- Missing work order data
- Invalid customer/vehicle information
- Database insertion errors
- Calculation errors

All errors are logged to console and shown as toast messages to the user.
