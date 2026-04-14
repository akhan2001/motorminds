export interface CreditRefundItem {
	id: string;
	supplier: string;
	reason: string;
	amount: number;
	refund_date: string;
	status: string;
	notes: string;
}

export interface ExpenseReportData {
	generalExpenses: GeneralExpense[];
	workOrderExpenses: WorkOrderExpense[];
	partsExpenses: PartsExpense[];
	creditsRefunds?: CreditRefundItem[];
	summary: {
		generalExpenses: { count: number; total: number; tax: number };
		workOrderExpenses: { count: number; total: number; tax: number };
		partsExpenses: { count: number; totalCost: number; totalProfit: number };
		creditsRefunds?: { count: number; total: number };
		grandTotal: number;
		netExpenses?: number;
	};
	startDate: string;
	endDate: string;
}

export interface GeneralExpense {
	id: string;
	type: 'general_expense';
	source_type: 'general' | 'invoice';
	description: string;
	vendor: string;
	invoice_number: string;
	date: string;
	amount: number;
	tax: number;
	category: string;
	payment_method: string;
	notes: string;
	refund_amount: number | null;
	resolution_type: string | null;
	invoice_id: string | null;
}

export interface WorkOrderExpense {
	id: string;
	type: 'work_order_expense';
	description: string;
	vendor: string;
	invoice_number: string;
	date: string;
	amount: number;
	tax: number;
	payment_method: string;
	work_order_id: string;
	work_order_title: string;
	work_order_status: string | null;
	vehicle: string | null;
	license_plate: string | null;
	refund_amount: number | null;
	resolution_type: string | null;
}

export interface PartsExpense {
	id: string;
	type: 'parts_cost';
	description: string;
	part_number: string;
	supplier: string;
	date: string;
	quantity: number;
	unit_cost: number;
	total_cost: number;
	sale_price: number;
	profit: number;
	work_order_id: string;
	work_order_title: string;
	work_order_status: string | null;
	vehicle: string | null;
	license_plate: string | null;
}

export type AllExpenseRow =
	| (GeneralExpense & { _tab: 'general' })
	| (WorkOrderExpense & { _tab: 'work_order' })
	| (PartsExpense & { _tab: 'parts' })
	| (CreditRefundItem & { _tab: 'credits' });
