"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface DataPoint {
	period: string;
	revenue: number;
	cogs: number;
}

export default function RevenueChart({ data }: { data: DataPoint[] }) {
	if (!data || data.length === 0) return (
		<div className="text-muted-foreground">No data</div>
	);

	return (
		<ResponsiveContainer width="100%" height={250}>
			<LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
				<CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
				<XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
				<YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
				<Tooltip formatter={(v) => `$${v}`} />
				<Legend />
				<Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" />
				<Line type="monotone" dataKey="cogs" stroke="#ef4444" name="COGS" />
			</LineChart>
		</ResponsiveContainer>
	);
} 