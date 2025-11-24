"use client"

import Image from "next/image"

export default function CustomChatStart() {
	return (
		<div className="mx-auto max-w-[750px]">
			<div className="flex flex-col gap-10 text-center py-8 px-5 bg-[#0D0D0D] rounded-[20px] border-[#1f1f1f] border">
				<div className="mb-6 flex justify-center">
					<Image
						src="/motorminds-logo-black_background.svg"
						alt="Mia AI"
						width={75}
						height={75}
					/>
				</div>
				<div className="flex flex-col gap-5 text-center">
					<h1 className="mb-4 text-5xl font-medium text-white">
						How Can I Assist You?
					</h1>

				</div>
				{/* No more feature boxes below */}
			</div>
		</div>
	)
}
