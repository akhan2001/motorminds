import { convertToModelMessages, type ModelMessage, stepCountIs, streamText } from 'ai'
import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'
import { IS_PLATFORM } from '@/lib/constants'
import {
    AI_DIAGNOSTICS_PROMPT,
    LIMITATIONS_PROMPT,
    COMPLIANCE_PROMPT,
    MOTOR_API_PROMPT,
    DIAGNOSTIC_WORKFLOW_PROMPT
} from '@/app/(features)/ai/AIDiagnostics/lib/prompts'

export const maxDuration = 120

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '5mb',
        },
    },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req

    switch (method) {
        case 'POST':
            return handlePost(req, res)
        default:
            res.setHeader('Allow', ['POST'])
            res.status(405).json({
                data: null,
                error: { message: `Method ${method} not allowed` },
            })
    }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
    apiWrapper(req, res, handler, { withHandler: true })

export default wrapper

// Validate request body
const requestBodySchema = z.object({
    messages: z.array(z.any()),
    projectRef: z.string(),
    workOrderId: z.string(),
    selectedVehicleId: z.number(),
    baseVehicleId: z.number(),
    vin: z.string(),
    year: z.number(),
    make: z.string(),
    model: z.string(),
    userId: z.string(),
    shopId: z.string(),
    aiModel: z.enum(['gpt-5', 'gpt-5-mini']).optional()
})


async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    const authorization = req.headers.authorization
    const accessToken = authorization?.replace('Bearer ', '')

    if (!IS_PLATFORM && !accessToken) {
        return res.status(401).json({ error: 'Authorization token is required' })   
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { data, error: parseError } = requestBodySchema.safeParse(body)

    if (parseError) {
        return res.status(400).json({ error: 'Invalid request body', details: parseError.errors })
    }

    const {
        messages,
        projectRef,
        workOrderId,
        selectedVehicleId,
        baseVehicleId,
        vin,
        year,
        make,
        model,
        userId,
        shopId,
        aiModel
    } = data

    let aiOptInLevel: AiOptInLevel = 'disabled'
    let isLimited = false

    if (!IS_PLATFORM) {
        aiOptInLevel = 'schema'
    }

    if (IS_PLATFORM && authorization) {
        try {
            
            const { result: schemas } = 
            
            const system = source`
                ${AI_DIAGNOSTICS_PROMPT}
                ${LIMITATIONS_PROMPT}
                ${COMPLIANCE_PROMPT}
                ${MOTOR_API_PROMPT}
                ${DIAGNOSTIC_WORKFLOW_PROMPT}
            `

            const coreMessages: ModelMessage[] = [
                {
                    role: 'system',
                    content: system,
                    ...AI_DIAGNOSTICS_PROMPT(promptProviderOptions && {
                        providerOptions: promptProviderOptions,
                    }),
                },
                {
                    role: 'assistant',
                    // Add any dynamic context here
                    content: `The user's current work order is ${workOrderId}. Their vailable schemas are ${schemas.join(', ')}. The current chat name is ${chatName}.`
                },
                ...convertToModelMessages(messages),
            ]

            
        }
    }
}