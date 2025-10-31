export const mockWalkInVehicleInfo = {
    id: 'test-vehicle-id',
    year: 2020,
    make: 'Toyota',
    model: 'Camry',
    license_plate: 'ABC123',
    color: 'Silver',
    vin: '1HGBH41JXMN109186',
    mileage: 45000
}

export const mockWorkOrderData = {
    work_order_number: '',
    title: 'Oil Change',
    description: 'Regular maintenance',
    status: 'pending' as const,
    priority: 'medium' as const,
    shop_id: 'test-shop-id',
    assigned_technician_id: undefined,
    tags: [],
    attachments: [],
    notes: undefined,
}
