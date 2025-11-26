import { convertToModelMessages, type ModelMessage, stepCountIs, streamText } from 'ai'
import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

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

    const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
        apiWrapper(req, req, res, handler, { withHandler: true })

    export default wrapper

    // Validate request body
    /*
    const requestBodySchema = z.object({
        messages: z.array(z.any({
        projectRef: z.string()

        */

    
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    // Extract vehicle context from body
    const { vehicleId, baseVehicleId, vin, year, make, model, ...rest } = req.body

    const session = await getOrCreateDiagnosticsSession({
        vehicleId,
        baseVehicleId,
        vin,
        year,
        make,
        model,
        userId: req.user?.id,
        shopId: req.shop?.id,
    })

    // Get diagnostic-specific tools (Motor DaaS wrappers)

    const tools = await getDiagnosticTools(session.diagnosticId)
    
}