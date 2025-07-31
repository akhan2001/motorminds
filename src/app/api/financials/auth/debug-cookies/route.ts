import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('auth') ||
      cookie.name.includes('sb-')
    )
    
    return NextResponse.json({
      authCookies: authCookies.length,
      authCookieNames: authCookies.map(c => c.name),
      allCookieCount: allCookies.length,
      cookies: authCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0
      }))
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to read cookies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}