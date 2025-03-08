"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
Table,
TableHead,
TableHeader,
TableRow,
TableBody,
TableCell,
} from "@/components/ui/table";
import { getCustomers } from "../api/customer-utils"; // updated to accept shopId
import { CustomerSheet } from "./customer-sheet";

export function CustomerTable() {
const [customers, setCustomers] = useState<any[]>([]);
const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
const [isSheetOpen, setIsSheetOpen] = useState(false);
const router = useRouter();

// On mount, check if user is logged in, then load customers for that shop
useEffect(() => {
	checkUser();
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// 1) Check user from Supabase; if present => loadCustomers(user.id), else => push("/login")
async function checkUser() {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		await loadCustomers(user.id);
	} else {
		router.push("/login");
	}
}

// 2) Load customers for this user’s shop_id
async function loadCustomers(userId: string) {
	// get shop_id from "users" table
	const { data: userData, error: userErr } = await supabase
		.from("users")
		.select("shop_id")
		.eq("id", userId)
		.single();

	if (userErr || !userData?.shop_id) {
		console.error("No valid shop_id found or error fetching user:", userErr);
		router.push("/login");
		return;
	}

	// fetch only those customers matching this shop_id
	console.log(userData.shop_id);
	const data = await getCustomers(userData.shop_id);
	console.log(data);
	setCustomers(data);
}

// 3) When a customer row is clicked, open the sheet
const handleCustomerClick = (customer: any) => {
	setSelectedCustomer(customer);
	setIsSheetOpen(true);
};

return (
	<div className="space-y-4">
		<div className="rounded-md border border-[#222] overflow-hidden">
			<Table>
				<TableHeader className="bg-[#222] border-none">
					<TableRow className="hover:bg-[#222] border-b-1 border-[#333]">
						<TableHead className="text-white font-medium">Name</TableHead>
						<TableHead className="text-white font-medium">Email</TableHead>
						<TableHead className="text-white font-medium">Phone</TableHead>
						<TableHead className="text-white font-medium">Address</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{customers.map((customer) => (
					<TableRow
						className="hover:bg-[#1a1a1a] border-b border-[#222] cursor-pointer"
						key={customer.id}
						onClick={() => handleCustomerClick(customer)}
					>
						<TableCell className="text-[#E2E2E2]">
							{customer.customer_name}
						</TableCell>
						<TableCell className="text-[#E2E2E2]">
							{customer.customer_email}
						</TableCell>
						<TableCell className="text-[#E2E2E2]">
							{customer.customer_phone}
						</TableCell>
						<TableCell className="text-[#E2E2E2]">
							{customer.customer_address}
						</TableCell>
					</TableRow>
					))}
				</TableBody>
			</Table>

			{/* Customer detail sheet (unchanged UI) */}
			<CustomerSheet
				customer={selectedCustomer}
				isOpen={isSheetOpen}
				onOpenChange={setIsSheetOpen}
			/>
		</div>
	</div>
);
}
