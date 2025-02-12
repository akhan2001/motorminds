"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthComponent() {

    const supabase = createClientComponentClient();

    const handleSignIn = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${location.origin}/auth/callback`
            }
        });

        if (!error) {
            window.location.href = `${location.origin}/auth/callback`;
        } else {
            console.error('Sign-in error:', error.message);
        }
    };

    return (
        <div className="dark:bg-primary flex flex-col items-center justify-center h-screen">
            <div className="w-96 border shadow-md rounded-md p-4 space-y-3">
                <h1 className="text-lg font-bold">Motorminds</h1>
                <p className="text-secondaryWhite">This is the Mia AI platform that is built by a team of automotive enthusiasts.</p>
                <Button className="mt-4 bg-primary text-primaryWhite w-full" onClick={handleSignIn}>Sign In</Button>
            </div>
        </div>
    )
}
