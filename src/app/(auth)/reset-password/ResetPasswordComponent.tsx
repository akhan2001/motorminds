"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function ResetPasswordComponent() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    const extractTokensAndSetSession = async () => {
      const hash = window.location.hash
      const hashParams = new URLSearchParams(hash.substring(1))

      const access_token = hashParams.get("access_token")
      const refresh_token = hashParams.get("refresh_token")

      if (!access_token || !refresh_token) {
        setError("Invalid or missing token. Please request a new reset link.")
        setSessionChecked(true)
        return
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      if (error) {
        console.error("setSession error:", error.message)
        setError("This reset link is invalid or expired.")
      } else {
        setMessage("Please enter your new password.")
      }

      setSessionChecked(true)
    }

    extractTokensAndSetSession()
  }, [])

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      setMessage("Password Changed! Redirecting to Log In ")
      setTimeout(() => router.push("/login"), 900)
    } catch (err) {
      setError(err.message || "Failed to reset password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md px-6 py-8 mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Reset Your Password</h2>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-100 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-900/50 border border-green-500 text-green-100 px-4 py-2 rounded mb-4">
          {message}
        </div>
      )}

      {!sessionChecked ? (
        <p className="text-gray-400 text-center">Verifying session...</p>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-10 border border-input text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex h-10 border border-input text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 w-full rounded-lg bg-white px-4 py-2.5 sm:py-3 text-sm font-medium text-black transition hover:bg-gray-100"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  )
}
