import React from "react";
import AuthComponent from "./components/AuthComponent";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
export default async function Page() {

    const supabase = createServerComponentClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        redirect('/');
    }
    return (
        <AuthComponent />
    )
}
