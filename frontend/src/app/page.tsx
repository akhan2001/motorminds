// import { Nav } from "./components/nav";
import { ChatInput } from "./components/chat-input";
import Image from "next/image";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import Search from "./components/Search";
import { PiSealQuestionThin } from "react-icons/pi";

export default async function Page() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    // Mia AI
    <div className="bg-[#000000] flex flex-col items-center justify-center h-screen">
      	{/* <Nav /> */}
		<main className="container mx-auto px-4 pt-24">
			<div className="mx-auto max-w-4xl text-center">
				<div className="mb-8 flex justify-center">
					<div className="rounded-full bg-black p-4">
						<Image src="/motorminds-logo-black.png" alt="Mia AI" width={100} height={100} />
					</div>
				</div>
				<h1 className="mb-4 text-5xl font-bold text-white">
					How Can I Assist You?
				</h1>
				<p className="mb-12 text-lg text-[#616161]">
					I&apos;m MIA, your Motorminds mechanic assistant! I can help with
					repairs and diagnostics. I&apos;m still in beta, so more features
					are on the way. Stay tuned for updates!
				</p>
				{/* <Search /> */}

				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 text-500">
						<PiSealQuestionThin className="text-primaryWhite text-500 text-2xl w-5 h-5"/>
						<h1 className="text-500 text-primaryWhite text-1xl font-medium">How do I use Mia?</h1>
					</div>
				</div>

				<ChatInput />
				<p className="mt-8 text-sm text-[#616161]">
					MIA may not be perfect. Please verify important information.
				</p>
			</div>
		</main>
    </div>
  );
}
