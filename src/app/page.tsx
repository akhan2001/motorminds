	import { Nav } from "./components/nav";
	import { ChatInput } from "./components/chat-input";
	import { cookies } from "next/headers";
	import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
	import { redirect } from "next/navigation";

	export default async function Page() {
		const supabase = createServerComponentClient({ cookies });

		const {
		data: { session },
		} = await supabase.auth.getSession();

		// console.log(session);
		
		// if (!session) {
		// 	redirect("/auth");
		// }

		return (
		<div className="bg-custom-background">
			<Nav />
			<ChatInput />
		</div>
		);
	}