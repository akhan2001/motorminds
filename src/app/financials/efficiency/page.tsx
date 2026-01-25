import { Suspense } from 'react';
import EfficiencyClient from './efficiency-client';

export default function EfficiencyPage() {
	return (
		<Suspense>
			<EfficiencyClient />
		</Suspense>
	);
} 