import { Nav } from "./components/nav"
import { ChatInput } from "./components/chat-input"
import Image from "next/image"

export default function Page() {
  return (
    <div className="min-h-screen bg-[#131313]">
      <Nav />
      <main className="container mx-auto px-4 pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-black p-4">
              
            </div>
          </div>
          <h1 className="mb-4 text-5xl font-bold text-white">How Can I Assist You?</h1>
          <p className="mb-12 text-lg text-[#616161]">
            I&apos;m MIA, your Motorminds mechanic assistant! I can help with repairs and diagnostics. I&apos;m still in
            beta, so more features are on the way. Stay tuned for updates!
          </p>
          <ChatInput />

          <p className="mt-8 text-sm text-[#616161]">MIA may not be perfect. Please verify important information.</p>
        </div>
      </main>
    </div>
  )
}

