"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordComponent() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      // Show success message
      setIsSubmitted(true)
    } catch (err: any) {
      setError(err?.message || "An unknown error occurred")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-[400px]">
        <h2 className="mb-6 md:mb-8 text-xl sm:text-2xl font-medium text-white text-center">Reset Password</h2>

        {isSubmitted ? (
          <div className="text-center">
            <p className="text-green-400 mb-4">Reset password link has been sent to your email.</p>
            <p className="text-gray-400 text-sm">Please check your inbox and follow the instructions to reset your password.</p>
            <div className="mt-6">
              <Link href="/login">
                <Button
                  className="w-full rounded-lg bg-white px-4 py-2.5 sm:py-3 text-sm font-medium 
                          text-black transition hover:bg-gray-100"
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-6 md:mb-8 text-center">
              Enter your email address below and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 md:space-y-6">
              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div>
                <Label htmlFor="email" className="mb-1.5 block text-sm text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. john.doe@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-lg bg-white px-4 py-2.5 sm:py-3 text-sm font-medium 
                        text-black transition hover:bg-gray-100"
              >
                Reset Password
              </Button>
            </form>

            <div className="mt-5 md:mt-6 text-center">
              <Link href="/login" className="text-xs sm:text-sm text-gray-400">
                Remember your password? <span className="underline hover:text-white">Sign In</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}