"use client"

import * as React from "react"
import { Settings, PanelLeft, Wrench, ClipboardList, CarFront, History, Package, Layers } from "lucide-react"

import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarProvider, SidebarSeparator, SidebarGroup, SidebarGroupLabel, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar"

export function MechanicsHubSidebar() {
    return (
        <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
            <div className="flex items-center gap-2 pl-2">
                <Wrench className="h-6 w-6" />
                <span className="font-semibold">Mechanics Hub</span>
            </div>
            </SidebarHeader>
            
            <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Shop Services</SidebarGroupLabel>
                <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Labour Management">
                    <Wrench className="h-4 w-4" />
                    <span>Labour</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Parts Management">
                    <Package className="h-4 w-4" />
                    <span>Parts</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
            
            <SidebarSeparator />
            
            <SidebarGroup>
                <SidebarGroupLabel>Views</SidebarGroupLabel>
                <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Kanban View">
                    <Layers className="h-4 w-4" />
                    <span>Kanban</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="List View">
                    <ClipboardList className="h-4 w-4" />
                    <span>List</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Vehicles">
                    <CarFront className="h-4 w-4" />
                    <span>Vehicles</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
            
            <SidebarSeparator />
            
            <SidebarGroup>
                <SidebarGroupLabel>History</SidebarGroupLabel>
                <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Work Order History">
                    <History className="h-4 w-4" />
                    <span>Work Orders</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
            </SidebarContent>
        </Sidebar>
        
        <div className="flex items-center h-16 border-b px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-xl font-semibold">Mechanics Hub</h1>
        </div>
        </SidebarProvider>
    )
}