'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils/currency'

/** Replace NaN and Infinity in JSON-like string so JSON.parse can handle it */
function sanitizeJsonLike(str: string): string {
	return str
		.replace(/:(\s*)NaN(\s*[,\]}])/g, ':$1null$2')
		.replace(/:(\s*)Infinity(\s*[,\]}])/g, ':$1null$2')
		.replace(/:(\s*)-Infinity(\s*[,\]}])/g, ':$1null$2')
}

/** Try to extract a JSON object from a string by unescaping and stripping wrapper quotes */
function tryParseJsonString(str: string): Record<string, unknown> | null {
	let s = str.trim()
	if (!s) return null
	const BOM = '\uFEFF'
	if (s.startsWith(BOM)) s = s.slice(BOM.length).trim()
	s = sanitizeJsonLike(s)
	for (let i = 0; i < 5; i++) {
		try {
			const parsed = JSON.parse(s) as unknown
			if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed as Record<string, unknown>
			if (typeof parsed === 'string') {
				s = sanitizeJsonLike((parsed as string).replace(/\\"/g, '"').trim())
				continue
			}
			return null
		} catch {
			break
		}
	}
	return null
}

function formatVal(v: unknown): string {
	if (v === null || v === undefined) return '—'
	if (typeof v === 'number') {
		if (Number.isNaN(v)) return '—'
		return v.toLocaleString()
	}
	if (typeof v === 'boolean') return v ? 'Yes' : 'No'
	return String(v)
}

function formatCurrencyOrNumber(v: unknown): string {
	if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
	const n = Number(v)
	return formatCurrency(n)
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
	return (
		<div className="flex gap-2 py-1 text-sm">
			<span className="text-muted-foreground dark:text-gray-400 shrink-0 w-[140px]">{label}</span>
			<span className={valueClass ?? 'text-foreground dark:text-white'}>{value}</span>
		</div>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-4 last:mb-0">
			<h4 className="text-foreground dark:text-white font-medium text-sm mb-2">{title}</h4>
			<div className="pl-2 border-l-2 border-border dark:border-[#2a2a2a]">{children}</div>
		</div>
	)
}

export function parseMigrationMetadata(raw: unknown): Record<string, unknown> | null {
	if (raw === null || raw === undefined) return null
	if (typeof raw === 'object' && !Array.isArray(raw) && raw !== null) return raw as Record<string, unknown>
	if (typeof raw !== 'string') return null

	let s = raw.trim()
	if (!s) return null
	const BOM = '\uFEFF'
	if (s.startsWith(BOM)) s = s.slice(BOM.length).trim()

	const out = tryParseJsonString(s)
	if (out) return out

	// Strip multiple layers of surrounding double-quotes (CSV-style "")
	let stripped = s
	while (stripped.length >= 2 && stripped.startsWith('"') && stripped.endsWith('"')) {
		stripped = sanitizeJsonLike(stripped.slice(1, -1).replace(/\\"/g, '"').trim())
		const next = tryParseJsonString(stripped)
		if (next) return next
	}

	// Extract substring from first "{" to last "}" (in case of junk prefix/suffix)
	const firstBrace = stripped.indexOf('{')
	const lastBrace = stripped.lastIndexOf('}')
	if (firstBrace !== -1 && lastBrace > firstBrace) {
		const slice = stripped.slice(firstBrace, lastBrace + 1)
		const unescaped = sanitizeJsonLike(slice.replace(/\\"/g, '"'))
		const next = tryParseJsonString(unescaped)
		if (next) return next
		try {
			const parsed = JSON.parse(unescaped) as unknown
			if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed as Record<string, unknown>
		} catch {
			// ignore
		}
	}

	// One more: unescape the whole thing then try
	const unescaped = sanitizeJsonLike(s.replace(/\\"/g, '"'))
	const fromUnescaped = tryParseJsonString(unescaped)
	if (fromUnescaped) return fromUnescaped
	try {
		const parsed = JSON.parse(unescaped) as unknown
		if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed as Record<string, unknown>
	} catch {
		// ignore
	}

	return null
}

const EXPENSE_RECORD_LABELS: Record<string, string> = {
	expense_date: 'Date',
	type: 'Type',
	vendor_name: 'Vendor',
	payment_status: 'Payment status',
	reference_id: 'Reference',
	payment_mode: 'Payment mode',
	advance_paid_amount: 'Advance paid',
	amount: 'Amount',
	tax_amount: 'Tax amount',
	order_id: 'Order ID',
	comment: 'Comment',
	garage_name: 'Garage',
}

const INCOME_DATA_LABELS: Record<string, string> = {
	repair_order_no: 'Repair order #',
	invoice_reference_number: 'Invoice reference',
	created_by: 'Created by',
	complaints: 'Complaints',
	odometer_reading: 'Odometer',
	tag: 'Tag',
	order_type: 'Order type',
}

export interface MigrationMetadataViewProps {
	/** Raw value from invoice (string or object) */
	migrationMetadata: unknown
	className?: string
}

export function MigrationMetadataView({ migrationMetadata, className = '' }: MigrationMetadataViewProps) {
	const [showRaw, setShowRaw] = React.useState(false)
	const data = parseMigrationMetadata(migrationMetadata)
	if (!data || Object.keys(data).length === 0) {
		if (migrationMetadata != null && typeof migrationMetadata === 'string') {
			const rawPreview = migrationMetadata.length > 1200 ? migrationMetadata.slice(0, 1200) + '…' : migrationMetadata
			return (
				<div className="space-y-2">
					<p className="text-muted-foreground dark:text-gray-400 text-sm">Could not parse migration data.</p>
					<button
						type="button"
						onClick={() => setShowRaw((v) => !v)}
						className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
					>
						{showRaw ? 'Hide raw value' : 'Show raw value'}
					</button>
					{showRaw && (
						<pre className="text-xs font-mono bg-muted dark:bg-[#1a1a1a] p-3 rounded border border-border dark:border-[#2a2a2a] overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
							{rawPreview}
						</pre>
					)}
				</div>
			)
		}
		return null
	}

	const expenseRecords = Array.isArray(data.expense_records) ? data.expense_records : []
	const expenseTotals = data.expense_totals && typeof data.expense_totals === 'object' ? (data.expense_totals as Record<string, unknown>) : null
	const incomeData = data.income_data && typeof data.income_data === 'object' ? (data.income_data as Record<string, unknown>) : null
	const migrationDate = data.migration_date != null ? formatVal(data.migration_date) : null
	const migrationSource = data.migration_source != null ? formatVal(data.migration_source) : null

	return (
		<div className={`space-y-4 text-sm ${className}`}>
			{expenseRecords.length > 0 && (
				<Section title="Expense records">
					{expenseRecords.map((record: Record<string, unknown>, index: number) => (
						<div key={index} className="mb-4 last:mb-0 p-3 rounded-md bg-muted/50 dark:bg-[#1a1a1a]">
							{Object.entries(record).map(([key, value]) => {
								const label = EXPENSE_RECORD_LABELS[key] ?? key.replace(/_/g, ' ')
								const isAmount = ['advance_paid_amount', 'amount', 'tax_amount'].includes(key)
								const valueStr = isAmount ? formatCurrencyOrNumber(value) : formatVal(value)
								if (valueStr === '—') return null
								return <Row key={key} label={label} value={valueStr} valueClass={isAmount ? 'font-medium text-foreground dark:text-white' : undefined} />
							})}
						</div>
					))}
				</Section>
			)}

			{expenseTotals && Object.keys(expenseTotals).length > 0 && (
				<Section title="Expense totals">
					{Object.entries(expenseTotals).map(([key, value]) => {
						const label = key.replace(/_/g, ' ')
						return <Row key={key} label={label} value={formatCurrencyOrNumber(value)} valueClass="font-medium" />
					})}
				</Section>
			)}

			{incomeData && Object.keys(incomeData).length > 0 && (
				<Section title="Income data">
					{Object.entries(incomeData).map(([key, value]) => {
						const label = INCOME_DATA_LABELS[key] ?? key.replace(/_/g, ' ')
						return <Row key={key} label={label} value={formatVal(value)} />
					})}
				</Section>
			)}

			{(migrationDate || migrationSource) && (
				<Section title="Migration info">
					{migrationDate && <Row label="Migration date" value={migrationDate} />}
					{migrationSource && <Row label="Source" value={migrationSource} />}
				</Section>
			)}

			{/* If we didn't render any known section, show a simple key-value list for whatever is there */}
			{!expenseRecords.length && !expenseTotals && !incomeData && !migrationDate && !migrationSource && (
				<Section title="Details">
					{Object.entries(data).map(([key, value]) => (
						<Row key={key} label={key.replace(/_/g, ' ')} value={typeof value === 'object' ? JSON.stringify(value) : formatVal(value)} />
					))}
				</Section>
			)}
		</div>
	)
}
