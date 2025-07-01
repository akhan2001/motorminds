interface Transaction {
  id: string;
  date: string;
  description: string;
  payee: string;
  category: string;
  amount: number;
  type: 'revenue' | 'cost';
}

interface TransactionRowProps {
  transaction: Transaction;
}

export default function TransactionRow({ transaction }: TransactionRowProps) {
  const isPositive = transaction.type === 'revenue';
  
  return (
    <div className="grid grid-cols-5 gap-4 py-4 px-6 hover:bg-[#0A0A0A] transition-colors border-b border-[#1a1a1a] last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
          <span className="text-xs font-medium text-gray-300">
            {transaction.payee.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">{transaction.id}</p>
          <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-white">{transaction.description}</p>
      </div>
      
      <div>
        <p className="text-sm text-white">{transaction.payee}</p>
      </div>
      
      <div>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300">
          {transaction.category}
        </span>
      </div>
      
      <div className="text-right">
        <p className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
        </p>
      </div>
    </div>
  );
} 