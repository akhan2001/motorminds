'use client'

import { Nav } from "@/app/components/nav";
import { ShopCard } from "../components/ShopCard";
import { useAdmin } from "../hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminDashboardPage() {
    const { shops, stats, loading, error, refreshShops } = useAdmin();

    if (loading) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white">Loading admin dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">Error Loading Data</h2>
                        <p className="text-gray-400 mb-4">{error}</p>
                        <button 
                            onClick={refreshShops}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                        <p className="text-gray-400">Manage all registered shops</p>
                    </div>

                    {/* Statistics Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-400">Total Shops</CardTitle>
                                    <Building2 className="h-4 w-4 text-gray-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">{stats.totalShops}</div>
                                    <p className="text-xs text-gray-500">
                                        Registered shops
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-gray-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                                    <p className="text-xs text-gray-500">
                                        {stats.activeUsers} active, {stats.inactiveUsers} inactive
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-400">Premium Plans</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">
                                        {stats.planDistribution.PREMIUM + stats.planDistribution.ENTERPRISE}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {stats.planDistribution.PREMIUM} Premium, {stats.planDistribution.ENTERPRISE} Enterprise
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-400">Issues</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">{stats.suspendedUsers}</div>
                                    <p className="text-xs text-gray-500">
                                        Suspended users
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Shops Grid */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">All Shops ({shops.length})</h2>
                            <button 
                                onClick={refreshShops}
                                className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-2 rounded text-sm"
                            >
                                Refresh
                            </button>
                        </div>
                        
                        {shops.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {shops.map((shop) => (
                                    <ShopCard key={shop.id} shop={shop} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">No shops found</h3>
                                <p className="text-gray-400">No shops are currently registered in the system.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}