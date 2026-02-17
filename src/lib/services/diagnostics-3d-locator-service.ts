import { z } from 'zod';

export const DIAGNOSTIC_COMPONENTS = [
	'battery',
	'starter',
	'alternator',
	'fuse_box',
] as const;

export type DiagnosticComponentId = (typeof DIAGNOSTIC_COMPONENTS)[number];

export const diagnosticInferenceSchema = z.object({
	component: z.enum(DIAGNOSTIC_COMPONENTS),
	confidence: z.number().min(0).max(1),
	explanation: z.string().min(1),
	possibleIssue: z.string().min(1),
});

export type DiagnosticInference = z.infer<typeof diagnosticInferenceSchema>;

const symptomRules: Array<{
	component: DiagnosticComponentId;
	keywords: string[];
	confidence: number;
	possibleIssue: string;
	explanation: string;
}> = [
	{
		component: 'starter',
		keywords: [
			'not crank',
			'no crank',
			'clicking',
			'click',
			'start',
			'won’t start',
			"won't start",
		],
		confidence: 0.82,
		possibleIssue: 'starter motor',
		explanation:
			'The starter can fail to engage when current is low, internal contacts are worn, or high-resistance wiring interrupts crank power.',
	},
	{
		component: 'battery',
		keywords: ['battery', 'dead', 'dim lights', 'slow crank', 'jump start'],
		confidence: 0.9,
		possibleIssue: 'battery',
		explanation:
			'A weak battery can cause low system voltage, which prevents proper starter engagement and can create multiple electrical symptoms.',
	},
	{
		component: 'alternator',
		keywords: [
			'dies while driving',
			'charging',
			'alternator',
			'voltage',
			'battery light',
		],
		confidence: 0.86,
		possibleIssue: 'alternator',
		explanation:
			'A failing alternator may not replenish battery charge, leading to low voltage and eventual no-start after short operation.',
	},
	{
		component: 'fuse_box',
		keywords: ['fuse', 'intermittent', 'no power', 'electrical', 'relay'],
		confidence: 0.74,
		possibleIssue: 'fuse box',
		explanation:
			'Blown fuses, relay faults, or poor fuse-box connections can interrupt starter or charging circuits and mimic major component failures.',
	},
];

function findRule(prompt: string) {
	const normalizedPrompt = prompt.toLowerCase();
	return symptomRules.find((rule) =>
		rule.keywords.some((keyword) => normalizedPrompt.includes(keyword))
	);
}

export function inferDiagnosticComponent(prompt: string): DiagnosticInference {
	const matchedRule = findRule(prompt);

	const inference: DiagnosticInference = matchedRule
		? {
				component: matchedRule.component,
				confidence: matchedRule.confidence,
				possibleIssue: matchedRule.possibleIssue,
				explanation: matchedRule.explanation,
			}
		: {
				component: 'starter',
				confidence: 0.61,
				possibleIssue: 'starter motor',
				explanation:
					'Given the symptom description, starter circuit faults are a practical first check after battery state and terminal integrity.',
			};

	return diagnosticInferenceSchema.parse(inference);
}
