interface Invoice {
    invoice_number: string;
    display_id?: string;
    client_name: string;
    amount: number;
    issue_date: string;
}

interface AgingScheduleTableProps {
    invoices: Invoice[];
}

function getStatus(issueDate: string): { text: string; color: string; days: number } {
    const today = new Date();
    const date = new Date(issueDate);
    const daysOverdue = Math.floor((today.getTime() - date.getTime()) / (1000 * 3600 * 24));

    if (daysOverdue <= 30) return { text: "Current", color: "bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400", days: daysOverdue };
    if (daysOverdue <= 60) return { text: "31-60 Days", color: "bg-yellow-50 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400", days: daysOverdue };
    if (daysOverdue <= 90) return { text: "61-90 Days", color: "bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400", days: daysOverdue };
    return { text: "90+ Days", color: "bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400", days: daysOverdue };
}

export default function AgingScheduleTable({ invoices }: AgingScheduleTableProps) {
    if (invoices.length === 0) {
        return (
            <div className="bg-slate-50 dark:bg-card border border-border rounded-xl p-10 text-center">
                <p className="text-muted-foreground">No unpaid invoices found.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-50 dark:bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Accounts Receivable Aging</h2>
            </div>
          
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 py-3 px-6 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div>Invoice #</div>
                <div>Client Name</div>
                <div className="text-right">Amount</div>
                <div className="text-center">Days Overdue</div>
                <div className="text-center">Aging Bucket</div>
            </div>
          
            {/* Table Body */}
            <div className="max-h-96 overflow-y-auto">
                {invoices.map((invoice) => {
                    const status = getStatus(invoice.issue_date);
                    return (
                        <div key={invoice.invoice_number} className="grid grid-cols-5 gap-4 py-4 px-6 text-sm hover:bg-muted/50 transition-colors border-b border-border last:border-b-0">
                            <div className="font-medium text-foreground">{invoice.display_id || invoice.invoice_number}</div>
                            <div className="text-muted-foreground">{invoice.client_name}</div>
                            <div className="text-right font-mono text-foreground">${invoice.amount.toFixed(2)}</div>
                            <div className="text-center text-foreground">{status.days}</div>
                            <div className="flex justify-center items-center">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                                    {status.text}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 