'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	Package,
	Building2,
	Users,
	BarChart3,
	Settings,
	TrendingUp,
	AlertCircle,
	CheckCircle,
	Clock,
	Slash,
	Database
} from 'lucide-react'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import AdminNav from './components/AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { BreadcrumbPage } from '@/components/ui/breadcrumb'

interface DashboardStats {
	totalShops: number
	totalPartsRequests: number
	pendingRequests: number
	quotedRequests: number
	orderedRequests: number
	totalRevenue: number
}

export default function AdminPage() {
	const [stats, setStats] = useState<DashboardStats>({
		totalShops: 0,
		totalPartsRequests: 0,
		pendingRequests: 0,
		quotedRequests: 0,
		orderedRequests: 0,
		totalRevenue: 0
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchDashboardStats()
	}, [])

	const fetchDashboardStats = async () => {
		try {
			setLoading(true)
			// TODO: Implement actual API calls to fetch dashboard stats
			setStats({
				totalShops: 0,
				totalPartsRequests: 0,
				pendingRequests: 0,
				quotedRequests: 0,
				orderedRequests: 0,
				totalRevenue: 0
			})
			setLoading(false)
		} catch (error) {
			console.error('Error fetching dashboard stats:', error)
			setLoading(false)
		}
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-CA', {
			style: 'currency',
			currency: 'CAD'
		}).format(amount)
	}

	const quickActions: any[] = [
		{
			title: 'Verify Staging Tables',
			description: 'Check staging database table integrity and data quality',
			href: '/admin/migrations',
			icon: Database,
			color: 'bg-blue-600'
		}
	]

	const recentActivity: any[] = []

	return (
		<div className="h-screen flex flex-col bg-[#0d0d0d]">
			<Nav />
			<div className="flex-1 flex flex-col overflow-hidden">
				<div className="flex-1 overflow-y-auto">
					<div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Breadcrumb */}
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-gray-400 hover:text-white">
                                            Admin
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="text-gray-600" />
                                </BreadcrumbSeparator>
                            </BreadcrumbList>
                        </Breadcrumb>

						{/* Admin Navigation */}
						<AdminNav />

						{/* Header */}
						<div className="mb-6">
							<h1 className="text-3xl font-bold text-white mb-2">
								MotorMinds Admin Dashboard
							</h1>
							<p className="text-gray-400">
								Manage your auto parts network from here
							</p>
						</div>

						{/* Stats Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
							<Card className="bg-[#111111] border-[#2a2a2a]">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-gray-400">Total Shops</p>
											<p className="text-2xl font-bold text-white">
												{loading ? '...' : stats.totalShops}
											</p>
										</div>
										<div className="p-3 bg-blue-600/20 rounded-full">
											<Building2 className="h-6 w-6 text-blue-400" />
										</div>
									</div>
									<div className="mt-4 flex items-center text-sm">
										<span className="text-gray-400">No data available</span>
									</div>
								</CardContent>
							</Card>

							<Card className="bg-[#111111] border-[#2a2a2a]">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-gray-400">Parts Requests</p>
											<p className="text-2xl font-bold text-white">
												{loading ? '...' : stats.totalPartsRequests}
											</p>
										</div>
										<div className="p-3 bg-green-600/20 rounded-full">
											<Package className="h-6 w-6 text-green-400" />
										</div>
									</div>
									<div className="mt-4 flex items-center text-sm">
										<span className="text-gray-400">No data available</span>
									</div>
								</CardContent>
							</Card>

							<Card className="bg-[#111111] border-[#2a2a2a]">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-gray-400">Orders Placed</p>
											<p className="text-2xl font-bold text-white">
												{loading ? '...' : stats.orderedRequests}
											</p>
										</div>
										<div className="p-3 bg-purple-600/20 rounded-full">
											<CheckCircle className="h-6 w-6 text-purple-400" />
										</div>
									</div>
									<div className="mt-4 flex items-center text-sm">
										<span className="text-gray-400">No data available</span>
									</div>
								</CardContent>
							</Card>

							<Card className="bg-[#111111] border-[#2a2a2a]">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-gray-400">Total Revenue</p>
											<p className="text-2xl font-bold text-white">
												{loading ? '...' : formatCurrency(stats.totalRevenue)}
											</p>
										</div>
										<div className="p-3 bg-green-600/20 rounded-full">
											<TrendingUp className="h-6 w-6 text-green-400" />
										</div>
									</div>
									<div className="mt-4 flex items-center text-sm">
										<span className="text-gray-400">No data available</span>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Quick Actions */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
							<div>
								<h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
								<div className="space-y-4">
									{quickActions.length > 0 ? (
										quickActions.map((action) => {
											const Icon = action.icon
											return (
												<Card key={action.href} className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
													<CardContent className="p-4">
														<div className="flex items-center justify-between">
															<div className="flex items-center space-x-4">
																<div className={`p-2 ${action.color} rounded-lg`}>
																	<Icon className="h-5 w-5 text-white" />
																</div>
																<div>
																	<h3 className="font-medium text-white">{action.title}</h3>
																	<p className="text-sm text-gray-400">{action.description}</p>
																</div>
															</div>
															<Button asChild variant="outline" size="sm">
																<Link href={action.href}>
																	Go
																</Link>
															</Button>
														</div>
													</CardContent>
												</Card>
											)
										})
									) : (
										<Card className="bg-[#111111] border-[#2a2a2a]">
											<CardContent className="p-4">
												<p className="text-gray-400 text-center">No quick actions available</p>
											</CardContent>
										</Card>
									)}
								</div>
							</div>

							<div>
								<h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
								<Card className="bg-[#111111] border-[#2a2a2a]">
									<CardContent className="p-4">
										<div className="space-y-4">
											{recentActivity.length > 0 ? (
												recentActivity.map((activity) => (
													<div key={activity.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-b-0">
														<div className="flex items-center space-x-3">
															<div className={`p-1 rounded-full ${activity.status === 'pending' ? 'bg-yellow-600/20' : 'bg-green-600/20'
																}`}>
																{activity.status === 'pending' ? (
																	<Clock className="h-3 w-3 text-yellow-400" />
																) : (
																	<CheckCircle className="h-3 w-3 text-green-400" />
																)}
															</div>
															<div>
																<p className="text-sm text-white">{activity.message}</p>
																<p className="text-xs text-gray-400">{activity.time}</p>
															</div>
														</div>
														<Badge
															variant="outline"
															className={
																activity.status === 'pending'
																	? 'bg-yellow-600/20 text-yellow-400 border-yellow-600'
																	: 'bg-green-600/20 text-green-400 border-green-600'
															}
														>
															{activity.status}
														</Badge>
													</div>
												))
											) : (
												<p className="text-gray-400 text-center">No recent activity</p>
											)}
										</div>
									</CardContent>
								</Card>
							</div>
						</div>

						{/* Alert Section */}
						<Card className="bg-orange-600/10 border-orange-600/30">
							<CardContent className="p-4">
								<div className="flex items-center space-x-3">
									<AlertCircle className="h-5 w-5 text-orange-400" />
									<div>
										<h3 className="font-medium text-orange-400">System Status</h3>
										<p className="text-sm text-orange-300">
											All systems operational. No pending requests.
										</p>
									</div>
									<Button asChild variant="outline" size="sm" className="ml-auto border-orange-600 text-orange-400 hover:bg-orange-600/20">
										<Link href="/admin/parts-requests">
											Review Requests
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}
