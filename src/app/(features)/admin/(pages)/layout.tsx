'use client'

import { ReactNode } from 'react'
import AdminNav from '../components/AdminNav'

interface AdminPagesLayoutProps {
    children: ReactNode
}

export default function AdminPagesLayout({ children }: AdminPagesLayoutProps) {
    return (
        <>
            <AdminNav />
            {children}
        </>
    )
}

