import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import { invoiceTools } from '@/app/api/mia/invoices/tools'
import { INVOICE_SYSTEM_PROMPT } from '@/app/api/mia/invoices/prompts'

// Initialize OpenAI model
export function createInvoiceModel() {
    return new ChatOpenAI({
        model: 'gpt-4o-mini', // More cost-effective while still capable
        temperature: 0.1, // Low temperature for consistent, accurate responses
        maxTokens: 2000,
        openAIApiKey: process.env.OPENAI_API_KEY,
        streaming: true // Enable streaming for better UX
    })
}

// Create a simple model instance for direct use
export function createInvoiceAgent() {
    const model = createInvoiceModel()
    return model
}

// Message formatting utilities
export function formatMessagesForAgent(messages: Array<{ role: string; content: string }>): BaseMessage[] {
    const formattedMessages: BaseMessage[] = []
    
    // Add system message first
    formattedMessages.push(new SystemMessage(INVOICE_SYSTEM_PROMPT))
    
    // Convert conversation messages
    for (const msg of messages) {
        switch (msg.role) {
            case 'user':
            case 'human':
                formattedMessages.push(new HumanMessage(msg.content))
                break
            case 'assistant':
            case 'ai':
                formattedMessages.push(new AIMessage(msg.content))
                break
            case 'system':
                formattedMessages.push(new SystemMessage(msg.content))
                break
        }
    }
    
    return formattedMessages
}

// Invoice-specific agent configuration
export interface InvoiceAgentConfig {
    shop_id: string
    current_customer_id?: string
    current_vehicle_id?: string
    current_invoice_id?: string
    user_preferences?: {
        default_tax_rate?: number
        preferred_currency?: string
        default_payment_terms?: string
    }
}

// Create configured agent with context
export function createConfiguredInvoiceAgent(config: InvoiceAgentConfig) {
    const agent = createInvoiceAgent()
    
    // Create enhanced system prompt with shop-specific context
    const contextualSystemPrompt = `${INVOICE_SYSTEM_PROMPT}

## Current Context:
- Shop ID: ${config.shop_id}
${config.current_customer_id ? `- Active Customer: ${config.current_customer_id}` : ''}
${config.current_vehicle_id ? `- Active Vehicle: ${config.current_vehicle_id}` : ''}
${config.current_invoice_id ? `- Working on Invoice: ${config.current_invoice_id}` : ''}

## Shop Preferences:
- Default Tax Rate: ${config.user_preferences?.default_tax_rate || 0.13} (${(config.user_preferences?.default_tax_rate || 0.13) * 100}%)
- Currency: ${config.user_preferences?.preferred_currency || 'CAD'}
- Default Payment Terms: ${config.user_preferences?.default_payment_terms || '30 days'}

Use this context to provide more relevant and personalized assistance.`
    
    return {
        agent,
        systemPrompt: contextualSystemPrompt,
        config
    }
}

// Simple response generation without complex agent patterns
export async function generateSimpleResponse(
    model: any,
    messages: BaseMessage[]
) {
    try {
        const response = await model.invoke(messages)
        return response.content
    } catch (error) {
        console.error('Error generating response:', error)
        throw new Error(`Response generation error: ${error}`)
    }
}

// Utility to extract final response from agent stream
export async function extractFinalResponse(stream: any): Promise<string> {
    let finalContent = ''
    
    try {
        for await (const chunk of stream) {
            if (chunk.messages && chunk.messages.length > 0) {
                const lastMessage = chunk.messages[chunk.messages.length - 1]
                if (lastMessage.constructor.name === 'AIMessage' && lastMessage.content) {
                    finalContent = lastMessage.content
                }
            }
        }
        
        return finalContent || 'I apologize, but I encountered an issue processing your request. Please try again.'
    } catch (error) {
        console.error('Error extracting final response:', error)
        return 'I apologize, but I encountered an error while processing your request. Please try again.'
    }
}

// Conversation management
export interface ConversationContext {
    shop_id: string
    session_id: string
    messages: Array<{ role: string; content: string }>
    metadata?: {
        current_task?: 'invoice_creation' | 'customer_search' | 'vehicle_lookup' | 'general_inquiry'
        customer_id?: string
        vehicle_id?: string
        invoice_id?: string
    }
}

// Simplified conversation processing
export async function processSimpleConversation(context: ConversationContext): Promise<string> {
    const { systemPrompt } = createConfiguredInvoiceAgent({
        shop_id: context.shop_id,
        current_customer_id: context.metadata?.customer_id,
        current_vehicle_id: context.metadata?.vehicle_id,
        current_invoice_id: context.metadata?.invoice_id
    })
    
    const model = createInvoiceAgent()
    
    // Format messages including system prompt
    const formattedMessages = [
        new SystemMessage(systemPrompt),
        ...formatMessagesForAgent(context.messages)
    ]
    
    try {
        const response = await generateSimpleResponse(model, formattedMessages)
        return response
    } catch (error) {
        console.error('Error in conversation processing:', error)
        return 'I apologize, but I encountered an error while processing your request. Please try again.'
    }
}

// Error handling and recovery
export function handleAgentError(error: any): string {
    console.error('Agent error:', error)
    
    // Common error patterns and user-friendly responses
    if (error.message?.includes('rate limit')) {
        return 'I\'m temporarily experiencing high demand. Please wait a moment and try again.'
    }
    
    if (error.message?.includes('timeout')) {
        return 'The request took longer than expected. Please try again with a simpler query.'
    }
    
    if (error.message?.includes('database') || error.message?.includes('supabase')) {
        return 'I\'m having trouble accessing the database. Please check your connection and try again.'
    }
    
    return 'I encountered an unexpected error. Please try rephrasing your request or contact support if the issue persists.'
}

// Validate agent configuration
export function validateAgentConfig(config: Partial<InvoiceAgentConfig>): InvoiceAgentConfig | null {
    if (!config.shop_id) {
        console.error('Shop ID is required for agent configuration')
        return null
    }
    
    return {
        shop_id: config.shop_id,
        current_customer_id: config.current_customer_id,
        current_vehicle_id: config.current_vehicle_id,
        current_invoice_id: config.current_invoice_id,
        user_preferences: {
            default_tax_rate: 0.13,
            preferred_currency: 'CAD',
            default_payment_terms: '30 days',
            ...config.user_preferences
        }
    }
}
