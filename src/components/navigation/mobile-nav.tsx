"use client"

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from "@/components/ui/button"
import { Menu, Settings, HelpCircle, LogOut, ChevronRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface NavItem {
    name: string;
    href: string;
    hasDropdown?: boolean;
    subItems?: Array<{ name: string; href: string }>;
}

interface MobileNavProps {
    navItems: NavItem[];
    activeLink: string;
    avatar: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    handleNavClick: (name: string, href: string) => void;
    handleLogout: () => void;
}

export function MobileNav({ 
    navItems, 
    activeLink, 
    avatar, 
    open, 
    setOpen, 
    handleNavClick, 
    handleLogout 
}: MobileNavProps) {
    const router = useRouter();
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    const toggleExpand = (itemName: string) => {
        if (expandedItem === itemName) {
            setExpandedItem(null);
        } else {
            setExpandedItem(itemName);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#131313] text-white border-l border-[#222] p-0">
                <div className="flex flex-col h-full">
                <SheetHeader className="p-4 border-b border-[#222]">
                    <SheetTitle className="text-xl font-bold text-white">Motorminds</SheetTitle>
                    <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                        <AvatarImage src={avatar} />
                        <AvatarFallback>AK</AvatarFallback>
                        </Avatar>
                        <Badge variant="outline" className="text-white border-[#979797]">Premium</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-[#979797] hover:text-white">
                            <HelpCircle className="w-5 h-5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#0d0d0d] text-white border-[#1f1f1f]">
                            <AlertDialogHeader>
                            <AlertDialogTitle>You Are About to Leave the App</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to open an external contact page. Do you want to continue?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel className="">Cancel</AlertDialogCancel>
                            <AlertDialogAction className="border-none bg-red-600 text-white hover:bg-red-700" onClick={() => window.open("https://www.motorminds.ca/contact-us", "_blank")}>
                                Yes, Continue
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                        <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#979797] hover:text-white" 
                        onClick={() => {
                            router.push("/settings")
                            setOpen(false)
                        }}
                        >
                        <Settings className="w-5 h-5" />
                        </Button>
                    </div>
                    </div>
                </SheetHeader>
                <div className="flex-1 py-4">
                    {navItems.map((item) => (
                        <div key={item.name}>
                            {item.hasDropdown ? (
                                <>
                                    <button
                                        onClick={() => toggleExpand(item.name)}
                                        className={`flex items-center justify-between w-full px-4 py-3 ${
                                            activeLink === item.name
                                            ? "bg-[#222] text-[#b22222]"
                                            : "text-[#979797] hover:bg-[#1A1A1A] hover:text-white"
                                        }`}
                                    >
                                        <span>{item.name}</span>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedItem === item.name ? 'rotate-90' : ''}`} />
                                    </button>
                                    {expandedItem === item.name && item.subItems && (
                                        <div className="bg-[#181818]">
                                            {item.subItems.map(subItem => (
                                                <a
                                                    key={subItem.name}
                                                    href="#"
                                                    onClick={() => handleNavClick(item.name, subItem.href)}
                                                    className="flex items-center px-8 py-2 text-[#979797] hover:bg-[#222] hover:text-white"
                                                >
                                                    {subItem.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <a
                                    href="#"
                                    onClick={() => handleNavClick(item.name, item.href)}
                                    className={`flex items-center px-4 py-3 ${
                                        activeLink === item.name
                                        ? "bg-[#222] text-[#b22222]"
                                        : "text-[#979797] hover:bg-[#1A1A1A] hover:text-white"
                                    } ${item.name === 'Mia AI' ? 'text-red-500 hover:text-red-400' : ''}`}
                                >
                                    <span className="flex items-center gap-2">
                                        {item.name}
                                        {item.name === "Mia AI" && (
                                            <Sparkles className="h-3 w-3 text-red-400 animate-pulse" />
                                        )}
                                    </span>
                                </a>
                            )}
                        </div>
                    ))}
                </div>
                <div className="border-t border-[#222] p-4">
                    <Button 
                    className="w-full bg-transparent text-[#979797] hover:text-white border border-[#222] hover:bg-[#222]"
                    onClick={handleLogout}
                    >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                    </Button>
                </div>
                <div className="p-4 border-t border-[#222] text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Motorminds
                </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}