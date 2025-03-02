"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LoginProps {
  onLogin: () => void
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      onLogin()
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#151515]">
      <div className="w-full max-w-md p-8 space-y-8 bg-[#1A1A1A] rounded-xl">
        <h2 className="text-3xl font-bold text-center text-white">Login to Motorminds</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-white bg-[#222222] border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-[#b22222]"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-white bg-[#222222] border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-[#b22222]"
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-[#b22222] hover:bg-[#e23232] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  )
}

