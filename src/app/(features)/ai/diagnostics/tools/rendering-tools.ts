import { tool } from 'ai'
import { z } from 'zod'

export const getRenderingTools = () => ({
    rename_chat: tool({
        description: 'Rename the current chat session when the current chat name does not describe the conversation topic.',
        inputSchema: z.object({
            newName: z.string().describe('The new name for the chat session. Five words or less.'),
        }),
        execute: async () => {
            return { status: 'Chat rename request sent to client' }
        },
    }),

    // Add other UI-only tools here
})