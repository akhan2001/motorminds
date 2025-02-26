"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AuthComponent() {
    
    const [showPassword, setShowPassword] = useState(false)

    const supabase = createClientComponentClient();

    const handleSignIn = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${location.origin}/auth/callback`
            }
        });

        if (error) {
            console.error('Sign-in error:', error.message);
        } else {
            console.log('Redirecting to GitHub for authentication...');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen w-full px-10">
            <div className="mx-auto w-full max-w-[75%]">
                <h2 className="mb-8 text-2xl font-medium text-white text-center">Sign In</h2>

                {/* Social Login Buttons */}
                <div className="flex flex-row gap-4 mb-8">
                    <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#222222] px-4 py-2 text-sm font-medium text-white hover:bg-[#222222] hover:border-[#444444]">
                        <Image src="/icons8-google-48.png" alt="Google" width={24} height={24} />
                        Google
                    </button>
                    <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#222222] px-4 py-2 text-sm font-medium text-white hover:bg-[#222222] hover:border-[#444444]">
                        <Image src="/icons8-facebook-50.png" alt="Facebook" width={24} height={24} />
                        Facebook
                    </button>
                </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#000000] px-4 text-gray-400">OR</span>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="e.g. john.doe@gmail.com"
                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-400">
              Forgot Your Password? <span className="underline hover:text-white">Reset It Here</span>
            </Link>
          </div>
        </div>
        </div>
    )
}
