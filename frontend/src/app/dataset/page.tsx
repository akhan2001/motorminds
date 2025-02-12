import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import React from "react";
import { cookies } from "next/headers";

export default async function Page() {

    const supabase = createServerComponentClient({ cookies });

	const { data: { session } } = await supabase.auth.getSession();

	if (!session) {
		redirect("/auth");
	}

    return (
        <div>Dataset</div>
    )
}
