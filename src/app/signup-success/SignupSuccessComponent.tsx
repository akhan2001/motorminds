"use client"
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

export default function SignupSuccessComponent() {
  const router = useRouter()

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
        
        {/* RIGHT SECTION: Success message */}
        <div className="flex flex-col items-center justify-center w-full md:w-[40%] lg:w-[30%] h-[60%] md:h-full">
          <div className="w-full max-w-md px-6 py-8">
            <div className="flex flex-col items-center justify-center text-center gap-6">
              <CheckCircle size={80} className="text-green-500" strokeWidth={1.5} />
              
              <h2 className="text-2xl font-bold text-white">Signup Successful!</h2>
              
              <p className="text-gray-400">
                Your account has been created successfully. Please check your email to verify your account.
              </p>

              <div className="w-full bg-[#222222] ring-1 ring-gray-700 text-white py-3 px-4 rounded-lg text-center mt-4">
                <p>
                  We've sent a verification email to your inbox. Please verify your email address to activate your account.
                </p>
              </div>
              
              <div className="flex flex-col w-full gap-4 mt-4">
                <Link 
                  href="/login"
                  className="w-full bg-[#222222] hover:bg-[#333333] text-white font-medium py-2 px-4 rounded-lg transition duration-200 text-center ring-1 ring-gray-700"
                >
                  Go to Login
                </Link>
                

              </div>
              
              <p className="text-gray-500 text-sm">
                Didn't receive an email? Check your spam folder or{" "}
                <button className="text-gray-400 hover:text-white underline underline-offset-2">
                  resend verification email
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}