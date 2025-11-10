export const SAMPLE_DATA: any = {
    // Flat syntax (for backward compatibility)
    customer_name: 'John Smith',
    shop_name: 'Quality Auto Repair',
    shop_phone: '(555) 123-4567',
    vehicle_make: 'Toyota',
    vehicle_model: 'Camry',
    vehicle_year: '2020',
    vehicle_info: '2020 Toyota Camry',
    work_order_title: 'Oil Change & Inspection',
    service_type: 'Oil Change',
    delay_time: '1 month',
    // Nested syntax (for [vehicle.make] style templates)
    vehicle: {
        make: 'Toyota',
        model: 'Camry',
        year: '2020',
        license_plate: 'ABC-1234',
        vin: '1HGBH41JXMN109186'
    },
    customer: {
        customer_name: 'John Smith',
        customer_phone: '(555) 987-6543',
        customer_email: 'john.smith@example.com'
    },
    shop: {
        shop_name: 'Quality Auto Repair',
        shop_phone: '(555) 123-4567',
        shop_address: '123 Main St, City, State'
    },
    work_order: {
        title: 'Oil Change & Inspection',
        work_order_number: 'WO-2024-001'
    }
}