import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LeadRowProps {
    id: string
    name: string
    email: string
    phone: string
    status: string
    message: string
    onSelect: (id: string, message: string) => void
}

const statusColors = {
    "NEW": "bg-[#36612A]",
    "CONTACTED": "bg-[#322E4C]",
    "INTERESTED": "bg-[#726e19]",
    "NOT INTERESTED": "bg-[#7A1F20]",
    "FOLLOW UP": "bg-[#322E4C]",
    "CUSTOMER": "bg-[#36612A]"
}

export function LeadRow({ id, name, email, phone, status, message, onSelect }: LeadRowProps) {
    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-800 cursor-pointer overflow-hidden" onClick={() => onSelect(id, message)}>
            <div className="flex items-center gap-4 text-white">
                <Avatar>
                    <AvatarImage src="https://braverplayers.org/wp-content/uploads/2022/09/blank-pfp.png" />
                    <AvatarFallback>AK</AvatarFallback>
                </Avatar>
                <div className="w-48">
                    <p className="font-medium">{name}</p>
                </div>
                <div className="w-64">
                    <p className="text-gray-400">{email}</p>
                </div>
                <div className="w-36">
                    <p className="text-gray-400">{phone}</p>
                </div>
            </div>
            <div>
                <span className={`px-7 py-2 rounded-full text-sm text-white ${statusColors[status as keyof typeof statusColors]}`}>{status}</span>
            </div>
        </div>
    )
}

