import { Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HeaderProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

export default function Header({ timeRange, onTimeRangeChange }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Financial Analytics</h1>
        <p className="text-gray-400">Track your revenue, expenses, and cash flow</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32 bg-[#0A0A0A] border-[#1a1a1a] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0A0A] border-[#1a1a1a]">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button className="bg-[#E53935] hover:bg-[#c62828] text-white">
          <FileText className="w-4 h-4 mr-2" />
          View Reports
        </Button>
      </div>
    </div>
  );
} 