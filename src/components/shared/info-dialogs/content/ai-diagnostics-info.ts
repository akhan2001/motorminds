import { Brain, Sparkles, Car, FileText, CheckCircle2, Zap } from 'lucide-react'
import { InfoContent } from '../types'

export const aiDiagnosticsInfo: InfoContent = {
    sections: [
        {
            title: 'What is AI Diagnostics?',
            description: 'AI Diagnostics uses artificial intelligence to analyze vehicle symptoms and provide diagnostic recommendations, helping technicians identify issues faster and more accurately.',
            icon: Brain,
        },
        {
            title: 'How It Works',
            icon: Sparkles,
            steps: [
                'Enter vehicle symptoms and error codes',
                'AI analyzes the information using diagnostic knowledge',
                'Receive prioritized diagnostic recommendations',
                'Review suggested parts and procedures',
                'Create work orders based on AI recommendations',
            ],
        },
        {
            title: 'Key Features',
            icon: Zap,
            items: [
                'Symptom-based diagnosis',
                'Error code interpretation',
                'Parts recommendation',
                'Labor time estimates',
                'Cost estimates',
                'Confidence scoring for recommendations',
            ],
        },
        {
            title: 'Vehicle Integration',
            icon: Car,
            items: [
                'Works with all vehicle makes and models',
                'Considers vehicle year and mileage',
                'Tracks diagnostic history',
                'Learns from previous repairs',
            ],
        },
        {
            title: 'Work Order Integration',
            icon: FileText,
            items: [
                'Convert AI recommendations to work order items',
                'Automatically add suggested parts',
                'Include diagnostic notes',
                'Track diagnostic accuracy over time',
            ],
        },
        {
            title: 'Best Practices',
            icon: CheckCircle2,
            items: [
                'Provide detailed symptom descriptions',
                'Include all relevant error codes',
                'Review AI recommendations before proceeding',
                'Combine AI insights with technician expertise',
                'Update diagnostic results for learning',
                'Use as a starting point, not final diagnosis',
            ],
        },
    ],
}
