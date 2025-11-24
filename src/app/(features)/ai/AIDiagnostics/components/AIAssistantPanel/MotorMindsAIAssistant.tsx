import { useChat } from '@ai-sdk/react'
import { useState } from 'react'
import { DefaultChatTransport } from 'ai'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { BASE_PATH } from '@/lib/constants'

export const MotorMindsAIAssistant = ({ className }: AIAssistantProps) => {
    const [activeMode, setActiveMode] = useState<'general' | 'diagnostics'>('general')
    const shop_id = getShopIdForUser()

    const generalChat = useChat({
        id: `${snap.activeChatId}-general`,
        transport: new DefaultChatTransport({
            api: `${BASE_PATH}/api/ai/chat`, //LangChain endpoint
            async prepareSendMessagesRequest({ messages, ...options }) {
                return {
                    body: {
                        messages,
                        shop_id: shop_id,
                        look_at_database: true,
                        show_intermediate_steps: true,
                    }
                }
            },
        }),
    })

    const diagnosticsChat = useChat({
        id: `${snap.activeChatId}-diagnostics`,
        transport: new DefaultChatTransport({
            api: `${BASE_PATH}/api/ai/diagnostics`, // Vercel AI SDK endpoint
            async prepareSendMessagesRequest({ messages, ...options }) {
                return {
                    body: {
                        messages,
                        selectedVehicleId: selectedVehicle?.id,
                        testShopId: shopId,
                    }
                }
            },
        }),
        onToolCall: handleDiagnosticsToolCall,
    })
}