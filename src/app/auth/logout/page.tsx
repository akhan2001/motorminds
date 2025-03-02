"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function Logout() {
    const router = useRouter()

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Button onClick={() => {
                supabase.auth.signOut()
                router.push("/auth/login")
            }}>Logout</Button>
        </div>
    )
}

