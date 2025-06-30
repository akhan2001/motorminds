"use client"

import { useEffect } from "react";
import Script from "next/script";

declare global {
    interface Window {
        fbLoaded?: boolean;
        fbAsyncInit?: () => void;
    }
}

export default function FacebookSdk() {
    useEffect(() => {
        // ensure FB.init is executed whether the SDK loads before or after this effect
        function initFB() {
            // @ts-ignore - FB global from SDK
            if (typeof FB !== "undefined" && !window.fbLoaded) {
                // @ts-ignore
                FB.init({
                    appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!,
                    cookie: true,
                    xfbml: true,
                    version: "v18.0"
                });
                window.fbLoaded = true;
            }
        }

        window.fbAsyncInit = initFB;

        // In case the SDK script has already been loaded
        if (typeof window !== "undefined" && (window as any).FB) {
            initFB();
        }
    }, []);

    return (
        <Script 
            src="https://connect.facebook.net/en_US/sdk.js"
            strategy="afterInteractive"
        />
    );
}