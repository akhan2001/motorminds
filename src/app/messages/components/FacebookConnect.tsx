"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function FacebookConnect({ shopId }: { shopId: string }) {
    const router = useRouter();

    function handleClick() {
        const url = `/api/auth/meta/start?shopId=${encodeURIComponent(shopId)}`;
        router.push(url);
    }

    return (
        <Button
            variant="ghost"
            className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10"
            onClick={handleClick}
        >
            Connect
        </Button>
    );
} 