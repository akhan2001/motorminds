import { ShoppingCart, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VoiceOrderingCard() {
    return (
        <>
        {/* Voice Ordering */}  
        <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-green-400" />
                    </div>
                    Voice Parts Ordering
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-gray-400">
                    Mia, our fast and efficient AI agent, calls your suppliers for quick parts ordering. 
                    Collects all essential data in under minutes.
                </p>
                
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Quick data collection: part#, price, availability
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Under 3 minutes per part ordering
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Direct communication, no filler words
                    </div>
                </div>

                <Link href="/voice-calling/ordering" className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Launch Parts Ordering
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
        </>
    )
}