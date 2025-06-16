// components/messages/MessagePanel.tsx
'use client'

type Conversation = {
    id: string
    name: string
    preview: string
    timestamp: string
    avatarUrl?: string
    platform: 'facebook' | 'instagram' | 'sms'
}

interface Props {
    conversation: Conversation | null
}

export default function MessagePanel({ conversation }: Props) {
    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center text-[#979797] bg-black">
                <p>Select a message to start chatting.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-black text-white p-4">
            <header className="border-b border-[#1f1f1f] pb-2 mb-4">
                <h2 className="text-xl font-semibold">{conversation.name}</h2>
                <p className="text-sm text-[#979797] capitalize">{conversation.platform}</p>
            </header>

            <div className="flex-1 overflow-y-auto mb-4">
                <div className="mb-2">
                    <div className="bg-[#1f1f1f] p-3 rounded-md w-fit mb-1 text-sm">See you later</div>
                    <div className="flex justify-end mb-4">
                        <div className="bg-[#b22222] text-white p-3 rounded-md w-fit text-sm">
                            Are you available next week?
                        </div>
                    </div>
                </div>
            </div>

            <footer>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 rounded-md bg-[#1a1a1a] border border-[#333] text-white"
                    />
                    <button className="px-4 py-2 bg-[#b22222] rounded-md hover:bg-red-700">Send</button>
                </div>
            </footer>
        </div>
    )
}
