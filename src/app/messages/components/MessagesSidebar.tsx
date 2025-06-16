'use client'

import { useState } from 'react'

type Conversation = {
    id: string
    name: string
    preview: string
    timestamp: string
    avatarUrl?: string
    platform: 'facebook' | 'instagram' | 'sms'
}

const mockConversations: Conversation[] = [
    { id: '1', name: 'Sofia Nieves', preview: 'See you later', timestamp: '1h', platform: 'facebook' },
    { id: '2', name: 'Rhys Rulz', preview: 'Are you available...', timestamp: '3h', platform: 'sms' },
    { id: '3', name: 'Danielle Tucker', preview: 'Mm that’s fine', timestamp: '1w', platform: 'instagram' },
]

interface Props {
    onSelect: (conversation: Conversation) => void
    activeId: string | null
}

export default function MessagesSidebar({ onSelect, activeId }: Props) {
    return (
        <aside className="w-[300px] border-r border-[#1f1f1f] p-4 bg-[#0d0d0d] text-white">
            <h2 className="text-xl font-semibold mb-4">Messages</h2>
            <input
                type="text"
                placeholder="Search messages"
                className="w-full px-3 py-2 mb-4 rounded-md bg-[#1a1a1a] border border-[#333] text-white"
            />
            <ul className="space-y-2">
                {mockConversations.map(convo => (
                    <li
                        key={convo.id}
                        onClick={() => onSelect(convo)}
                        className={`p-3 rounded-md cursor-pointer hover:bg-[#1f1f1f] ${activeId === convo.id ? 'bg-[#1f1f1f]' : ''}`}
                    >
                        <p className="font-medium">{convo.name}</p>
                        <p className="text-sm text-[#979797]">{convo.preview}</p>
                    </li>
                ))}
            </ul>
        </aside>
    )
}