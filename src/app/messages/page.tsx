"use client"

import { Nav } from "@/app/components/nav"

export default function Messages() {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav />
            <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="bg-[#1a1a1a] p-8 rounded-lg border border-[#333] shadow-lg max-w-md w-full">
                    <h1 className="text-4xl font-bold text-white mb-4">Coming Soon</h1>
                    <p className="text-lg text-gray-400">
                        Our new messaging platform is under construction.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Stay tuned for updates!
                    </p>
                </div>
            </main>
        </div>
    )
}