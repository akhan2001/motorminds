"use client"
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import React, { Suspense } from "react"
import Image from "next/image"
import SignupComponent from "./SignupComponent"

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-black">
            <div className="flex flex-col md:flex-row min-h-screen">
                {/* LEFT SECTION with background */}
                <div
                    className="relative flex flex-col items-center justify-center w-full md:w-[60%] lg:w-[70%] h-[40vh] md:h-screen"
                    style={{
                        backgroundImage: "url('/cars-images/mclaren-shop-form-image.jpg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <div className="absolute inset-0 bg-black opacity-80 z-0"></div>
                    <div className="relative flex flex-col items-center justify-center gap-4 w-full px-4 md:w-[70%] lg:w-[50%]">
                        <div>
                            <Image
                                src="/motorminds-logo-white (1).svg"
                                alt="Motorminds Logo"
                                width={100}
                                height={100}
                            />
                        </div>
                        <div className="flex flex-col items-center justify-center gap-2">
                            <h1 className="text-white text-2xl md:text-3xl font-bold text-center">Join Motorminds</h1>
                            <p className="text-[#AAAAAA] text-lg md:text-xl text-center">
                                Your Hub for Auto Shops & Car Enthusiasts
                                <br />– Stay Connected, Stay Tuned.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SECTION: The SignupComponent form */}
                <div className="flex flex-col items-center justify-start w-full md:w-[40%] lg:w-[30%] min-h-[60vh] md:h-screen py-4 overflow-y-auto">
                    <Suspense fallback={<div className="text-white">Loading...</div>}>
                        <SignupComponent />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
