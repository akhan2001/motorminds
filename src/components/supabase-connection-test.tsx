"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, info])
  }

  const testConnection = useCallback(async () => {
    setStatus("loading")
    setMessage("")
    setDebugInfo([])

    try {
      // Step 1: Authenticate
      addDebugInfo("Attempting to sign in")
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: "test@example.com", // Replace with your actual test email
        password: "testpassword123", // Replace with your actual test password
      })

      if (signInError) {
        addDebugInfo(`Sign in error: ${signInError.message}`)
        throw signInError
      }

      if (!signInData.user) {
        addDebugInfo("No user data returned after sign in")
        throw new Error("No user data returned after sign in")
      }

      addDebugInfo(`Sign in successful. User ID: ${signInData.user.id}`)

      // Step 2: Read shop_id from users table
      addDebugInfo("Querying users table for shop_id")
      const { data: userData, error: userQueryError } = await supabase
        .from("users")
        .select("shop_id")
        .eq("id", signInData.user.id)
        .single()

      if (userQueryError) {
        addDebugInfo(`Error querying users table: ${userQueryError.message}`)
        throw userQueryError
      }

      if (!userData || !userData.shop_id) {
        addDebugInfo("No shop_id found for this user")
        throw new Error("No shop_id found for this user")
      }

      addDebugInfo(`Successfully retrieved shop_id: ${userData.shop_id}`)

      // Step 3: Query shops table using the retrieved shop_id
      addDebugInfo(`Querying shops table with shop_id: ${userData.shop_id}`)
      const { data: shopData, error: shopQueryError } = await supabase
        .from("shops")
        .select("*")
        .eq("id", userData.shop_id)
        .single()

      if (shopQueryError) {
        addDebugInfo(`Error querying shops table: ${shopQueryError.message}`)
        throw shopQueryError
      }

      if (!shopData) {
        addDebugInfo("No shop data found")
        throw new Error("No shop data found")
      }

      addDebugInfo(`Successfully retrieved shop data: ${JSON.stringify(shopData)}`)
      setStatus("success")
      setMessage(`Retrieved shop data for shop_id: ${userData.shop_id}`)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "An unknown error occurred")
    }
  }, [addDebugInfo, setStatus, setMessage, setDebugInfo]) // Added dependencies to useCallback

  return (
    <div className="p-4 bg-[#1A1A1A] rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Supabase Connection Test</h2>
      <button
        onClick={testConnection}
        disabled={status === "loading"}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
      >
        {status === "loading" ? "Testing..." : "Test Connection"}
      </button>
      {message && <p className={`mt-4 ${status === "success" ? "text-green-400" : "text-red-400"}`}>{message}</p>}
      <p className="mt-4 text-yellow-400 text-sm">
        Warning: This component uses hardcoded credentials for testing purposes. Do not use this approach in a
        production environment.
      </p>
      <p className="mt-2 text-gray-400 text-sm">Status: {status}</p>
      {debugInfo.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-white mb-2">Debug Information:</h3>
          <ul className="list-disc list-inside text-sm text-gray-300">
            {debugInfo.map((info, index) => (
              <li key={index}>{info}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

