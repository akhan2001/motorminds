import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const customers = [
  {
    id: 1,
    name: "Alyssa M.",
    lifetimePoints: 12500,
    lifetimeRedemptions: 2,
  },
  {
    id: 2,
    name: "Chris L.",
    lifetimePoints: 10500,
    lifetimeRedemptions: 3,
  },
  {
    id: 3,
    name: "Eva P.",
    lifetimePoints: 9000,
    lifetimeRedemptions: 1,
  },
  {
    id: 4,
    name: "Oliver R.",
    lifetimePoints: 7500,
    lifetimeRedemptions: 5,
  },
  {
    id: 5,
    name: "Zoe H.",
    lifetimePoints: 6000,
    lifetimeRedemptions: 4,
  },
]

export function CustomersTable() {
  return (
    <div className="rounded-md border border-[#222] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#222]">
          <TableRow className="hover:bg-[#222] border-b-0">
            <TableHead className="text-white font-medium">Customer</TableHead>
            <TableHead className="text-white font-medium text-right">Lifetime points</TableHead>
            <TableHead className="text-white font-medium text-right">Lifetime redemptions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="hover:bg-[#1a1a1a] border-b border-[#222]">
              <TableCell>{customer.name}</TableCell>
              <TableCell className="text-right">{customer.lifetimePoints}</TableCell>
              <TableCell className="text-right">{customer.lifetimeRedemptions}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

