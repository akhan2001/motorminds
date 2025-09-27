"use client"

import React from "react"
import Image from "next/image"

export default function LoadingComponent() {
    return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center">
            <div className="relative">
                <Image
                    src="/red-motorminds-logo-svg.svg"
                    alt="Motorminds Logo"
                    width={120}
                    height={120}
                    className="w-24 h-24"
                />
            </div>

            {/* <div className="mt-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Setting up your account...</h2>
                <div className="space-y-2 text-gray-300">
                    <p className="flex items-center justify-center gap-2">
                        Creating your account
                    </p>
                    <p className="flex items-center justify-center gap-2">
                        Setting up your shop profile
                    </p>
                    <p className="flex items-center justify-center gap-2">
                        Sending verification email
                    </p>
                </div>
            </div> */}
        </div>
    )
}
