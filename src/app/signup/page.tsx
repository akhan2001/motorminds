// Sign Up Page
"use client"
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
import React from "react"
import Image from "next/image"
import SignUpComponent from "./SignUpComponent"

export default function SignUpPage() {
  return (
    <div className="h-screen bg-black">
      <div className="flex flex-col md:flex-row h-full">
        {/* LEFT SECTION with background */}
        <div
          className="relative flex flex-col items-center justify-center w-full md:w-[60%] lg:w-[70%] h-[40%] md:h-full"
          style={{
            backgroundImage: "url('/shop-auto-repair.jpg')",
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
              <h1 className="text-white text-2xl md:text-3xl font-bold text-center">Welcome to Motorminds</h1>
              <p className="text-[#AAAAAA] text-lg md:text-xl text-center">
                Your Hub for Auto Shops &amp; Car Enthusiasts
                <br />– Stay Connected, Stay Tuned.
              </p>
            </div>
          </div>
        </div>
        {/* RIGHT SECTION: The SignUpComponent form */}
        <div className="flex flex-col items-center justify-center w-full md:w-[40%] lg:w-[30%] h-[60%] md:h-full">
          <SignUpComponent />
        </div>
      </div>
    </div>
  )
}