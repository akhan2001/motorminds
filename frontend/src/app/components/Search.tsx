import React from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function Search() {

    const supabase = createClientComponentClient();

    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    }

    return (
        <div>
        </div>
    );
}
