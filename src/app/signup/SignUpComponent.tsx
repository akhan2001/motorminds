"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function SignUpComponent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    if (!acceptTerms) {
      setError("You must accept the terms and conditions")
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      })
      
      if (error) throw error

      // On success
      router.push("/login")
    } catch (err: any) {
      setError(err?.message || "An unknown error occurred")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-[400px]">
        <h2 className="mb-6 md:mb-8 text-xl sm:text-2xl font-medium text-white text-center">Create Account</h2>

        {/* Social Login Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#222222] px-3 py-2 text-sm font-medium text-white hover:bg-[#222222] hover:border-[#444444]">
            <Image src="/icons8-google-48.png" alt="Google" width={20} height={20} />
            <span className="sm:inline">Google</span>
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#222222] px-3 py-2 text-sm font-medium text-white hover:bg-[#222222] hover:border-[#444444]">
            <Image src="/icons8-facebook-50.png" alt="Facebook" width={20} height={20} />
            <span className="sm:inline">Facebook</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6 md:mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[#000000] px-4 text-gray-400">OR</span>
          </div>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="space-y-4 md:space-y-6">
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

          <div>
            <Label htmlFor="password" className="mb-1.5 block text-sm text-gray-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="mb-1.5 block text-sm text-gray-300">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Checkbox 
                id="terms" 
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                className="border-gray-600"
              />
            </div>
            <div className="ml-3 text-sm">
              <Label htmlFor="terms" className="text-gray-400">
                I accept the <Link href="/terms" className="underline hover:text-white">Terms and Conditions</Link>
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-2.5 sm:py-3 text-sm font-medium 
                     text-black transition hover:bg-gray-100"
          >
            Create Account
          </Button>
        </form>

        <div className="mt-5 md:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-400">
            Already have an account? <Link href="/login" className="underline hover:text-white">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}