// Mock data for MIA AI Diagnostics

export const mockVehicleData = {
	id: 1,
	year: 2017,
	make: 'Chevrolet',
	model: 'Corvette',
	trim: 'Z51',
	vin: '1G1YY2D74H5100001',
	plate: 'ABC-1234',
	mileage: 42350,
	customerName: 'John Smith',
	customerPhone: '(555) 123-4567',
	customerId: 101,
	baseVehicleId: 22124,
	activeDTCCodes: ['P0420', 'P0300']
}

export const mockWorkOrders = [
	{
		id: 'wo-001',
		number: 'WO-2024-1234',
		status: 'In Progress',
		createdDate: '2024-11-18',
		assignedTechnician: 'Mike Johnson',
		totalAmount: 875.50,
		reportedIssue: 'Check engine light on, rough idle at startup',
		lineItems: [
			{ description: 'Diagnostic fee', quantity: 1, price: 125.00 },
			{ description: 'O2 sensor replacement', quantity: 1, price: 350.50 },
			{ description: 'Spark plug replacement', quantity: 8, price: 400.00 }
		]
	},
	{
		id: 'wo-002',
		number: 'WO-2024-1189',
		status: 'Pending Parts',
		createdDate: '2024-11-15',
		assignedTechnician: 'Sarah Williams',
		totalAmount: 1250.00,
		reportedIssue: 'Brake noise when stopping',
		lineItems: [
			{ description: 'Brake pad replacement', quantity: 1, price: 450.00 },
			{ description: 'Rotor resurfacing', quantity: 1, price: 300.00 },
			{ description: 'Brake fluid flush', quantity: 1, price: 150.00 }
		]
	}
]

export const mockDTCCodes = {
	active: [
		{
			code: 'P0420',
			description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
			severity: 'Warning',
			detectedDate: '2024-11-18',
			aiSummary: 'Most likely cause: Catalytic converter degradation or exhaust leak. Recommend oxygen sensor testing and exhaust inspection.'
		},
		{
			code: 'P0300',
			description: 'Random/Multiple Cylinder Misfire Detected',
			severity: 'Critical',
			detectedDate: '2024-11-18',
			aiSummary: 'Suggests ignition system issues. Check spark plugs, coil packs, and fuel delivery system. May be related to P0420.'
		}
	],
	historical: [
		{
			code: 'P0171',
			description: 'System Too Lean (Bank 1)',
			resolvedDate: '2024-10-15',
			resolution: 'MAF sensor replaced'
		},
		{
			code: 'C0040',
			description: 'Right Front Wheel Speed Sensor Circuit',
			resolvedDate: '2024-09-22',
			resolution: 'Wheel speed sensor replaced'
		}
	]
}

export const mockParts = [
	{
		name: 'Denso Oxygen Sensor (Upstream)',
		partNumber: '234-4672',
		price: 89.99,
		availability: 'In Stock',
		supplier: 'AutoZone',
		eta: 'Same Day',
		confidence: 'High'
	},
	{
		name: 'NGK Iridium Spark Plugs (Set of 8)',
		partNumber: 'LFR6AIX',
		price: 79.92,
		availability: 'In Stock',
		supplier: "O'Reilly Auto Parts",
		eta: 'Same Day',
		confidence: 'High'
	},
	{
		name: 'ACDelco Ignition Coil Pack',
		partNumber: 'D581',
		price: 65.50,
		availability: 'Limited Stock',
		supplier: 'NAPA',
		eta: '2-3 Days',
		confidence: 'Medium'
	}
]

export const mockServiceHistory = [
	{
		date: '2024-10-15',
		type: 'Repair',
		description: 'MAF sensor replacement, air filter service',
		technician: 'Mike Johnson',
		invoiceNumber: 'INV-2024-0892',
		amount: 425.00,
		attachments: ['diagnosis-report.pdf']
	},
	{
		date: '2024-09-22',
		type: 'Repair',
		description: 'Right front wheel speed sensor replacement',
		technician: 'Sarah Williams',
		invoiceNumber: 'INV-2024-0743',
		amount: 275.00,
		attachments: []
	},
	{
		date: '2024-06-10',
		type: 'Maintenance',
		description: 'Oil change, tire rotation, multi-point inspection',
		technician: 'Mike Johnson',
		invoiceNumber: 'INV-2024-0456',
		amount: 89.95,
		attachments: []
	},
	{
		date: '2024-03-05',
		type: 'Repair',
		description: 'Brake pad replacement (front), rotor resurfacing',
		technician: 'Tom Anderson',
		invoiceNumber: 'INV-2024-0187',
		amount: 650.00,
		attachments: ['brake-inspection.pdf', 'brake-before.jpg']
	}
]

export const mockDiagrams = [
	{
		id: 1,
		type: 'Wiring Diagram',
		title: 'O2 Sensor Circuit - Bank 1',
		description: 'Upstream oxygen sensor wiring schematic',
		available: true
	},
	{
		id: 2,
		type: 'Component Location',
		title: 'Catalytic Converter Location',
		description: 'Location diagram for Bank 1 catalytic converter',
		available: true
	},
	{
		id: 3,
		type: 'Repair Procedure',
		title: 'Ignition Coil Replacement',
		description: 'Step-by-step procedure for coil pack replacement',
		available: true
	}
]

