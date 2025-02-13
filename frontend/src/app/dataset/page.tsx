import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import React from "react";
import { cookies } from "next/headers";
import { FaDatabase } from "react-icons/fa";
import Forms from "./components/forms";

export default async function Page() {

    const supabase = createServerComponentClient({ cookies });
	const { data: { session } } = await supabase.auth.getSession();

	if (!session) {
		redirect("/auth");
	}

    console.log(session.user.id);

    // Fetch the user's role from the auth.users table
    const { data: user, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.error('Error fetching role:', error.message);
    } else {
        console.log('User role:', user.role);
    }

    if (user?.role !== "admin") {
        redirect("/");
    }

    return (
        <div className="max-w-4xl mx-auto h-screen flex justify-center items-center">
            <div className="w-full p-5 space-y-5">
                <div className="flex items-center gap-5">
                    <FaDatabase size={30} />
                    <h1 className="text-2xl font-bold">Mia AI Dataset</h1>
                </div>
                <Forms />
            </div>
        </div>
    )
}
