'use server'

// Server actions for authentication with validation

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { loginSchema, signupSchema, emailSchema } from './schemas'
import { AuthResult } from './types'
import { ZodError } from 'zod'

/**
 * Login action with validation
 * @param formData - Form data containing email, password, and optional redirectTo
 */
export async function loginAction(formData: FormData): Promise<AuthResult> {
	try {
		// Extract and validate form data
		const rawData = {
			email: formData.get('email') as string,
			password: formData.get('password') as string,
		}

		// Get the redirect destination (defaults to /)
		const redirectTo = (formData.get('redirectTo') as string) || '/'

		const validatedData = loginSchema.parse(rawData)

		// Authenticate user
		const supabase = await createClient()
		const { error } = await supabase.auth.signInWithPassword(validatedData)

		if (error) {
			return {
				success: false,
				error: error.message,
			}
		}

		// Revalidate and redirect to the intended destination
		revalidatePath('/', 'layout')
		redirect(redirectTo)
	} catch (error) {
		if (error instanceof ZodError) {
			return {
				success: false,
				error: error.errors[0].message,
			}
		}

		// If redirect is thrown, let it propagate
		throw error
	}
}

/**
 * Signup action with validation
 */
export async function signupAction(formData: FormData): Promise<AuthResult> {
	try {
		// Extract and validate form data
		const rawData = {
			email: formData.get('email') as string,
			password: formData.get('password') as string,
			confirmPassword: formData.get('confirmPassword') as string,
		}

		const validatedData = signupSchema.parse(rawData)

		// Create user account
		const supabase = await createClient()
		const { error } = await supabase.auth.signUp({
			email: validatedData.email,
			password: validatedData.password,
		})

		if (error) {
			return {
				success: false,
				error: error.message,
			}
		}

		// Revalidate and redirect
		revalidatePath('/', 'layout')
		redirect('/login?message=Check your email to confirm your account')
	} catch (error) {
		if (error instanceof ZodError) {
			return {
				success: false,
				error: error.errors[0].message,
			}
		}

		// If redirect is thrown, let it propagate
		throw error
	}
}

/**
 * Logout action
 */
export async function logoutAction(): Promise<AuthResult> {
	try {
		const supabase = await createClient()
		const { error } = await supabase.auth.signOut()

		if (error) {
			return {
				success: false,
				error: error.message,
			}
		}

		// Revalidate and redirect
		revalidatePath('/', 'layout')
		redirect('/login')
	} catch (error) {
		// If redirect is thrown, let it propagate
		throw error
	}
}

/**
 * Request password reset action
 */
export async function requestPasswordResetAction(
	formData: FormData
): Promise<AuthResult> {
	try {
		// Extract and validate form data
		const rawData = {
			email: formData.get('email') as string,
		}

		const validatedData = emailSchema.parse(rawData)

		// Request password reset
		const supabase = await createClient()
		const { error } = await supabase.auth.resetPasswordForEmail(
			validatedData.email,
			{
				redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
			}
		)

		if (error) {
			return {
				success: false,
				error: error.message,
			}
		}

		return {
			success: true,
		}
	} catch (error) {
		if (error instanceof ZodError) {
			return {
				success: false,
				error: error.errors[0].message,
			}
		}

		return {
			success: false,
			error: 'An unexpected error occurred',
		}
	}
}

/**
 * Update password action
 */
export async function updatePasswordAction(
	formData: FormData
): Promise<AuthResult> {
	try {
		// Extract form data
		const password = formData.get('password') as string
		const confirmPassword = formData.get('confirmPassword') as string

		// Validate passwords match
		if (password !== confirmPassword) {
			return {
				success: false,
				error: "Passwords don't match",
			}
		}

		// Update password
		const supabase = await createClient()
		const { error } = await supabase.auth.updateUser({
			password,
		})

		if (error) {
			return {
				success: false,
				error: error.message,
			}
		}

		return {
			success: true,
		}
	} catch (error) {
		return {
			success: false,
			error: 'An unexpected error occurred',
		}
	}
}
