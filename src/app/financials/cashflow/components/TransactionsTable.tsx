import TransactionRow from "./TransactionRow";

interface Transaction {
  id: string;
  date: string;
  description: string;
  payee: string;
  category: string;
  amount: number;
  type: 'revenue' | 'cost';
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1a1a1a]">
        <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 py-3 px-6 bg-[#0f0f0f] border-b border-[#1a1a1a]">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Transaction ID / Date
        </div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Description
        </div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Payee/From
        </div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Category
        </div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide text-right">
          Amount
        </div>
      </div>
      
      {/* Table Body */}
      <div className="max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No transactions found for the selected period</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>
    </div>
  );
} 