'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
	const supabase = await createClient()

	// type-casting here for convenience
	// in practice, you should validate your inputs
	const data = {
		email: formData.get('email') as string,
		password: formData.get('password') as string,
	}

	// Get returnTo parameter if provided
	const returnTo = formData.get('returnTo') as string | null

	const { error } = await supabase.auth.signInWithPassword(data)

	if (error) {
		const errorUrl = returnTo 
			? `/login?error=${encodeURIComponent(error.message)}&returnTo=${encodeURIComponent(returnTo)}`
			: `/login?error=${encodeURIComponent(error.message)}`
		redirect(errorUrl)
	}

	revalidatePath('/', 'layout')
	
	// Redirect to returnTo path or default to /operations/work-orders (like Studio redirects to /organizations)
	const redirectPath = returnTo && returnTo !== '/login' ? returnTo : '/operations/work-orders'
	redirect(redirectPath)
}

export async function signup(formData: FormData) {
	const supabase = await createClient()

	// type-casting here for convenience
	// in practice, you should validate your inputs
	const data = {
		email: formData.get('email') as string,
		password: formData.get('password') as string,
	}

	const { error } = await supabase.auth.signUp(data)

	if (error) {
		redirect('/login?error=Sign up failed')
	}

	revalidatePath('/', 'layout')
	redirect('/login?message=Check your email to confirm your account')
}