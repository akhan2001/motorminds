'use client'

import { AdminContextProvider } from './components/admin-context/AdminContextProvider'
import { AdminRouter } from './components/AdminRouter'

export default function AdminPage() {
	return (
		<AdminContextProvider>
			<AdminRouter />
		</AdminContextProvider>
	)
}
