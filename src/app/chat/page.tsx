import { Nav } from "../components/nav";
import { ChatWindow } from "../components/ChatWindow";
import ChatStart from "./components/ChatStart";
// import { cookies } from "next/headers";
// import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
// import { redirect } from "next/navigation";

export default function Page() {
	// const supabase = createServerComponentClient({ cookies });

	// const {
	// data: { session },
	// } = await supabase.auth.getSession();

	// console.log(session);
	
	// if (!session) {
	// 	redirect("/auth");
	// }

	return (
	<div className="h-screen bg-black">
		<Nav activeLink="Mia AI" />
		<ChatWindow 
			endpoint="api/chat"
			placeholder="Ask me anything..."
			emptyStateComponent={<ChatStart />}
		/>
	</div>
	);
}