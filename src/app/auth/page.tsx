"use client"

import React from "react";

import AuthComponent from "./components/AuthComponent";

import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="h-screen bg-black">
            <div className="flex flex-row h-full">
                <div className="relative flex flex-col items-center justify-center w-[70%] h-full" style={{ backgroundImage: "url('/motorminds-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
                    <div className="absolute inset-0 bg-black opacity-80 z-0"></div>
                    <div className="relative flex flex-col items-center justify-center gap-4 w-[50%]">
                        <div>
                            <Image src="/motorminds-logo-white (1).svg" alt="Motorminds Logo" width={100} height={100} />
                        </div>
                        <div className="flex flex-col items-center justify-center gap-2">
                            <h1 className="text-white text-3xl font-bold">Welcome to Motorminds</h1>
                            <p className="text-[#AAAAAA] text-xl text-center">Your Hub for Auto Shops & Car Enthusiasts
                            <br />– Stay Connected, Stay Tuned.</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center w-[30%] h-full">
                    <AuthComponent />
                </div>
            </div>
        </div>
    )
}
