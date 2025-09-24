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
  Clock
} from 'lucide-react'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import AdminNav from './components/AdminNav'

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
      // For now, we'll use mock data. You can replace this with actual API calls
      setTimeout(() => {
        setStats({
          totalShops: 12,
          totalPartsRequests: 156,
          pendingRequests: 23,
          quotedRequests: 45,
          orderedRequests: 67,
          totalRevenue: 45280.50
        })
        setLoading(false)
      }, 1000)
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

  const quickActions = [
    {
      title: 'Parts Requests',
      description: 'Manage parts requests from all shops',
      href: '/admin/parts-requests',
      icon: Package,
      color: 'bg-blue-600'
    },
    {
      title: 'Shop Management',
      description: 'View and manage registered shops',
      href: '/admin/shops',
      icon: Building2,
      color: 'bg-green-600'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      href: '/admin/users',
      icon: Users,
      color: 'bg-purple-600'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-orange-600'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-gray-600'
    }
  ]

  const recentActivity = [
    { id: 1, type: 'parts_request', message: 'New parts request from AutoFix Shop', time: '5 minutes ago', status: 'pending' },
    { id: 2, type: 'quote', message: 'Quote provided for brake pads request', time: '12 minutes ago', status: 'completed' },
    { id: 3, type: 'order', message: 'Parts order placed by SpeedyAuto', time: '1 hour ago', status: 'completed' },
    { id: 4, type: 'shop', message: 'New shop registration: Elite Motors', time: '2 hours ago', status: 'pending' },
    { id: 5, type: 'user', message: 'User account activated for John Doe', time: '3 hours ago', status: 'completed' }
  ]

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d]">
      <Nav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                MotorMinds Admin Dashboard
              </h1>
              <p className="text-gray-400">
                Manage your auto parts network from here
              </p>
            </div>

            {/* Admin Navigation */}
            <AdminNav />

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
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-green-400">+2 this month</span>
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
                    <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-600">
                      {loading ? '...' : stats.pendingRequests} pending
                    </Badge>
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
                    <span className="text-gray-400">This month</span>
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
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-green-400">+12% from last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                <div className="space-y-4">
                  {quickActions.map((action) => {
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
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                <Card className="bg-[#111111] border-[#2a2a2a]">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <div className={`p-1 rounded-full ${
                              activity.status === 'pending' ? 'bg-yellow-600/20' : 'bg-green-600/20'
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
                      ))}
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
                      All systems operational. {stats.pendingRequests} parts requests awaiting processing.
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
