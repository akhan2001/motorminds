'use client'

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MotormindsNavBar({ showBackButton = false, onBackClick }: { showBackButton?: boolean, onBackClick?: () => void }) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="navbar-no-shadow-2 bg-[#000000] sticky top-0 z-50">
            <div className="navbar-no-shadow-container-2 w-full">
                <div className="container-regular-2 max-w-[1200px] mx-auto px-5">
                    <div className="navbar-wrapper-2 flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <Link href="/" className="navbar-brand-2 flex items-center">
                                <Image 
                                    src="https://cdn.prod.website-files.com/66fcb2f56c967857d2ff9609/678f0fbd299ec0c9bb03ad13_motorminds-horizontal-logo-black.png"
                                    alt="MotorMinds Logo"
                                    width={167}
                                    height={40}
                                    priority
                                />
                            </Link>
                        </div>
                        
                        {/* Desktop Navigation */}
                        <nav className={`nav-menu-wrapper-2 hidden md:block`}>
                            <ul className="nav-menu-2 flex items-center space-x-8">
                                <li><Link href="/about" className="nav-link-2 text-white hover:text-gray-600">About</Link></li>
                                <li><Link href="/product" className="nav-link-2 text-white hover:text-gray-600">Product</Link></li>
                                <li><Link href="/contact-us" className="nav-link-2 text-white hover:text-gray-600">Contact</Link></li>
                                <li>
                                    <div className="nav-button-wrapper-2">
                                        <Link href="https://motorminds.vercel.app/login" className="primary-button bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded">
                                            LOGIN
                                        </Link>
                                    </div>
                                </li>
                            </ul>
                        </nav>
                        
                        {/* Mobile Menu Button */}
                        <div className="menu-button-2 md:hidden">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={toggleMenu}
                                aria-label="Toggle menu"
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                        <div className="w-nav-overlay md:hidden">
                            <nav className="bg-white p-5 shadow-lg rounded-b-lg">
                                <ul className="space-y-4">
                                    <li><Link href="/about" className="block py-2 text-black hover:text-gray-600">About</Link></li>
                                    <li><Link href="/product" className="block py-2 text-black hover:text-gray-600">Product</Link></li>
                                    <li><Link href="/contact-us" className="block py-2 text-black hover:text-gray-600">Contact</Link></li>
                                    <li className="pt-4">
                                        <Link href="https://motorminds.vercel.app/login" className="block w-full bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded text-center">
                                            LOGIN
                                        </Link>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
