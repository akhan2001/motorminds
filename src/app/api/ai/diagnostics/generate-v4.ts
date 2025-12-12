import { convertToModelMessages, type ModelMessage, stepCountIs, streamText } from 'ai'
import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'
import { IS_PLATFORM } from '@/lib/constants'

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
            const { aiOptInLevel}
        }
    }
}