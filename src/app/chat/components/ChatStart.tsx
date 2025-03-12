import React from "react";
import Image from "next/image";

export default function ChatStart() {
    return (
        <div className="mx-auto max-w-[750px] w-full px-4 sm:px-6">
            <div className="flex flex-col gap-6 md:gap-10 text-center py-6 md:py-8 px-4 md:px-5 bg-[#0D0D0D] rounded-[20px] border-[#1f1f1f] border">
                <div className="mb-4 md:mb-6 flex justify-center">
                    <Image src="/motorminds-logo-black_background.svg" alt="Mia AI" width={75} height={75} />
                </div>
                <div className="flex flex-col gap-3 md:gap-5 text-center">
                    <h1 className="mb-2 md:mb-4 text-3xl md:text-4xl lg:text-5xl font-medium text-white">
                        How Can I Assist You?
                    </h1>
                    <p className="text-base md:text-lg text-[#979797] w-full sm:w-[85%] md:w-[75%] mx-auto">
                        I&apos;m MIA, your Motorminds mechanic assistant! I can help with repairs and diagnostics. I&apos;m still in beta, so more features are on the way. Stay tuned for updates!
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 md:gap-5">
                    <div className="w-full md:w-[33%] bg-[#222222] rounded-[10px]">
                        <div className="flex flex-col justify-center text-center py-5 md:py-7 items-center gap-3 md:gap-5">
                            <Image src="/Wrench Logo.png" alt="Repairs & diagnostics" width={30} height={30} />
                            <div className="flex flex-col justify-center text-center">
                                <h1 className="text-base md:text-lg font-semibold text-[#E3E3E3] mx-3">
                                    Repairs & diagnostics
                                </h1>
                                <p className="text-xs md:text-sm text-[#979797] w-[90%] md:w-[75%] mx-auto">
                                    I can help you with repairs and diagnostics.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-[33%] bg-[#222222] rounded-[10px]">
                        <div className="flex flex-col justify-center text-center py-5 md:py-7 items-center gap-3 md:gap-5">
                            <Image src="/Customer-Solutions.png" alt="Shop operations" width={30} height={30} />
                            <div className="flex flex-col justify-center text-center">
                                <h1 className="text-base md:text-lg font-semibold text-[#E3E3E3] mx-3">
                                    Shop operations
                                </h1>
                                <p className="text-xs md:text-sm text-[#979797] w-[90%] md:w-[75%] mx-auto">
                                    I can help you with shop operations.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-[33%] bg-[#222222] rounded-[10px]">
                        <div className="flex flex-col justify-center text-center py-5 md:py-7 items-center gap-3 md:gap-5">
                            <Image src="/community-integration logo.png" alt="Customer service" width={30} height={30} />
                            <div className="flex flex-col justify-center text-center">
                                <h1 className="text-base md:text-lg font-semibold text-[#E3E3E3] mx-3">
                                    Customer service
                                </h1>
                                <p className="text-xs md:text-sm text-[#979797] w-[90%] md:w-[75%] mx-auto">
                                    I can help you with customer service.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}