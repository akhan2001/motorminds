"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Nav } from '@/app/components/nav';
import BreadcrumbNav from './components/BreadcrumbNav';
import { generateIncomeStatementPDF } from './components/IncomeStatementPDF';
import { checkUser } from '@/utils/supabase/supabase-auth';
import { getShopId } from '@/utils/supabase/supabase-shop';

const ReportsPage = () => {
	const [shopId, setShopId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		async function fetchUserData() {
			setIsLoading(true);
			try {
				const user = await checkUser();
				if (user) {
					const shop = await getShopId(user.id);
					setShopId(shop);
				} else {
					router.push('/login');
				}
			} catch (error) {
				console.error('Error fetching user data:', error);
				router.push('/login');
			} finally {
				setIsLoading(false);
			}
		}

		fetchUserData();
	}, [router]);

	const handleGenerateReport = async () => {
		if (!shopId) {
			alert('Shop information not found. Unable to generate report.');
			return;
		}

		const to = new Date();
		const from = new Date(to.getFullYear(), to.getMonth(), 1);

		try {
			const response = await fetch(`/api/financials/reports/income-statement?startDate=${from.toISOString()}&endDate=${to.toISOString()}&shopId=${shopId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch income statement data');
			}
			const data = await response.json();
			generateIncomeStatementPDF(data, shopId, data.statementId);
		} catch (error) {
			console.error('Error generating report:', error);
			alert('Failed to generate report. See console for details.');
		}
	};

	const Header = () => (
		<div className="flex items-center justify-between my-8">
			<div>
				<h1 className="text-3xl font-bold text-foreground mb-2">Financial Reports</h1>
				<p className="text-muted-foreground">Generate and review your shop's financial statements.</p>
			</div>
		</div>
	);

	if (isLoading) {
		return (
			<div className="flex flex-col min-h-screen bg-background text-foreground">
				<Nav />
				<main className="flex-1 p-8 max-w-7xl mx-auto w-full">
					<BreadcrumbNav />
					<p className="text-muted-foreground">Loading...</p>
				</main>
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-screen bg-background text-foreground">
			<Nav />
			<main className="flex-1 p-8 max-w-7xl mx-auto w-full">
				<BreadcrumbNav />
				<Header />
				<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
					<h2 className="text-xl font-semibold mb-4 text-foreground">Generate Statement</h2>
					<Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleGenerateReport}>
						Generate Current Month Income Statement
					</Button>
				</div>
			</main>
		</div>
	);
};

export default ReportsPage; 