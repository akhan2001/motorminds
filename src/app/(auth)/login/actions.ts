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

	const { data: authData, error } = await supabase.auth.signInWithPassword(data)

	if (error) {
		redirect('/login?error=' + encodeURIComponent(error.message))
	}

	// Verify session was established before redirecting
	if (!authData.session) {
		redirect('/login?error=' + encodeURIComponent('Failed to establish session'))
	}

	console.log('[Login] Session established for:', authData.user.email)

	// Get the returnTo parameter if it exists
	const returnTo = formData.get('returnTo') as string | null
	const redirectPath = returnTo || '/operations/work-orders'

	revalidatePath('/', 'layout')
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