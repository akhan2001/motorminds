'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkUser } from '@/utils/supabase/supabase-auth'
import { getShopId } from '@/utils/supabase/supabase-shop'
import CustomerInvoiceIntakeForm from './components/customer-invoice-intake-form'
import Image from 'next/image'

export default function CustomerInvoiceIntakePage() {
  const [user, setUser] = useState<any>(null)
  const [shopId, setShopId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchUserData() {
      setIsLoading(true)
      try {
        const userData = await checkUser()
        if (userData) {
          setUser(userData)
          const shop = await getShopId(userData.id)
          setShopId(shop)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserData()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <div className="flex justify-center items-center h-screen">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!shopId) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <div className="flex justify-center items-center h-screen">
          <p>No shop found for this user.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Simple header with logo */}
      <header className="bg-[#0d0d0d] border-b border-[#1f1f1f] py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/motorminds-logo-white (1).svg"
              alt="Motorminds Logo"
              width={35}
              height={35}
              className="w-8 h-8"
            />
            <span className="text-white font-medium">Motorminds</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Service Request Form</h1>
          <p className="text-gray-400">Please provide your details and service requirements</p>
        </div>
        <CustomerInvoiceIntakeForm shopId={shopId} user={user} />
      </main>
      
      <footer className="bg-[#0d0d0d] border-t border-[#1f1f1f] py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Motorminds | All rights reserved
        </div>
      </footer>
    </div>
  )
} 