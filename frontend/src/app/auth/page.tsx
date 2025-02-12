import React from "react";
import AuthComponent from "./components/AuthComponent";
import { redirect } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Page() {
    
    return (
        <AuthComponent />
    )
}
