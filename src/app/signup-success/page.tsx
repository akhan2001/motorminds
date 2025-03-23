"use client"
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
import React from "react"
import SignupSuccessComponent from "./SignupSuccessComponent"

export default function SignupSuccessPage() {
  return (
    <div className="h-screen bg-black">
      <SignupSuccessComponent />
    </div>
  )
}