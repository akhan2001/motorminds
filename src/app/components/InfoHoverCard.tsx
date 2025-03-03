import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { HelpCircle } from "lucide-react";

interface InfoHoverCardProps {
  text: string;
}

export function InfoHoverCard({ text }: InfoHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <HelpCircle className="inline-block w-5 h-5 cursor-pointer text-gray-400" />
      </HoverCardTrigger>
      <HoverCardContent className="bg-[#1f1f1f] border-none">
        <p className="text-sm text-gray-300 font-normal">{text}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
