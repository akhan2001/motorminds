// app/mechanic-hub/page.tsx
import { Suspense } from "react"
import MechanicsHubClient from "./MechanicsHubClient"

// (Optional) If you *do* want Node.js environment or partial SSR, you can set:
export const runtime = "nodejs"
// or export const dynamic = "force-dynamic" if you do NOT want SSR

export default function MechanicHubPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <MechanicsHubClient />
    </Suspense>
  )
}