import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'
import {
    Model,
    OpenAIModel,
    PROVIDERS,
    ProviderModelConfig,
    ProviderName,
    getDefaultModelForProvider,
} from './model.utils'

type PromptProviderOptions = Record<string, any>
type ProviderOptions = Record<string, any>

type ModelSuccess = {
    model: LanguageModel
    promptProviderOptions?: PromptProviderOptions
    providerOptions?: ProviderOptions
    error?: never
}

export type ModelError = {
    model?: never
    promptProviderOptions?: never
    providerOptions?: never
    error: Error
}

type ModelResponse = ModelSuccess | ModelError

export const ModelErrorMessage = 'No valid AI model available. OPENAI_API_KEY is required.'

export type GetModelParams = {
    provider?: ProviderName
    model?: Model
    routingKey: string
    isLimited?: boolean
}

/**
 * Retrieves a LanguageModel from OpenAI.
 * - If model not specified, uses the default model (gpt-3.5-turbo).
 * - If isLimited is true, uses the default model regardless of requested model.
 * - Returns promptProviderOptions that callers can attach to the system message.
 */
export async function getModel({
    provider = 'openai',
    model,
    routingKey,
    isLimited = false,
}: GetModelParams): Promise<ModelResponse> {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY

    if (!hasOpenAIKey) {
        return { error: new Error(ModelErrorMessage) }
    }

    const providerRegistry = PROVIDERS[provider]
    if (!providerRegistry) {
        return { error: new Error(`Unknown provider: ${provider}`) }
    }

    const models = providerRegistry.models as Record<Model, ProviderModelConfig>

    // Use default model if limited, throttled, or model not specified/invalid
    const useDefault = isLimited || !model || !models[model]

    const chosenModelId = useDefault ? getDefaultModelForProvider(provider) : model

    if (!chosenModelId) {
        return { error: new Error(`No default model found for provider: ${provider}`) }
    }

    if (provider === 'openai') {
        return {
            model: openai(chosenModelId as OpenAIModel),
            promptProviderOptions: models[chosenModelId as OpenAIModel]?.promptProviderOptions,
            providerOptions: providerRegistry.providerOptions,
        }
    }

    return { error: new Error(`Unsupported provider: ${provider}`) }
}