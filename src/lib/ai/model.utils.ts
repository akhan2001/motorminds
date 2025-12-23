export type ProviderName = 'openai'

export type OpenAIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo' | 'gpt-4.1-mini'

export type Model = OpenAIModel

export type ProviderModelConfig = {
    /** Optional providerOptions to attach to the system message for this model */
    promptProviderOptions?: Record<string, any>
    /** The default model for this provider (used when limited or no preferred specified) */
    default: boolean
}

export type ProviderRegistry = {
    openai: {
        models: Record<OpenAIModel, ProviderModelConfig>
        providerOptions?: Record<string, any>
    }
}

export const PROVIDERS: ProviderRegistry = {
    openai: {
        models: {
            'gpt-4': { default: false },
            'gpt-3.5-turbo': { default: false },
            'gpt-4-turbo': { default: false },
            'gpt-4.1-mini': { default: true }, // Default model with higher rate limits
        },
        providerOptions: {
            openai: {
                // Add any OpenAI-specific options here
            },
        },
    },
}

export function getDefaultModelForProvider(provider: ProviderName): Model | undefined {
    const models = PROVIDERS[provider]?.models as Record<Model, ProviderModelConfig>
    if (!models) return undefined

    return Object.keys(models).find((id) => models[id as Model]?.default) as Model | undefined
}