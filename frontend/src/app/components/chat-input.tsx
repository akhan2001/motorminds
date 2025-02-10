import { ArrowRight } from "lucide-react"

export function ChatInput() {
  return (
    <div className="relative mx-auto max-w-2xl">
      <input
        type="text"
        placeholder="Type your prompt here"
        className="w-full rounded-full bg-[#222222] px-6 py-4 text-white placeholder-[#616161] outline-none"
      />
      <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#f52f2f] p-2 hover:bg-[#f52f2f]/90">
        <ArrowRight className="h-5 w-5 text-white" />
      </button>
    </div>
  )
}

