import { StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RewardsCardProps {
    reward: any;
    isSelected: boolean;
    isOtherSelected: boolean;
    onSelect: (reward: any) => void;
}

export function RewardsCard({ reward, isSelected, isOtherSelected, onSelect }: RewardsCardProps) {
    return (
        <div 
            className={`bg-blue-50 dark:bg-blue-900/20 border ${
                isSelected 
                    ? 'border-green-500 dark:border-green-600 ring-2 ring-green-500/50' 
                    : isOtherSelected 
                        ? 'border-gray-200 dark:border-gray-700 opacity-50' 
                        : 'border-blue-100 dark:border-blue-800 hover:shadow-md'
            } rounded-lg p-4 cursor-pointer transition-all ${
                !isOtherSelected ? 'hover:scale-[1.01]' : ''
            }`}
            onClick={() => !isOtherSelected && onSelect(reward)}
        >
            <div className="flex items-start">
                <div className={`${
                    isSelected
                        ? 'bg-green-100 dark:bg-green-800' 
                        : 'bg-blue-100 dark:bg-blue-800'
                } p-2 rounded-full mr-3`}>
                    <StarIcon className={`h-5 w-5 ${
                        isSelected
                            ? 'text-green-600 dark:text-green-300' 
                            : 'text-blue-600 dark:text-blue-300'
                    }`} />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h4 className={`font-medium ${
                            isSelected
                                ? 'text-green-800 dark:text-green-300' 
                                : 'text-blue-800 dark:text-blue-300'
                        }`}>{reward.name}</h4>
                        <Badge variant="outline" className={`ml-2 ${
                            isSelected
                                ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' 
                                : 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        }`}>
                            {reward.points_required || 0} points
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reward.description}</p>
                    <p className="text-xs mt-2 font-medium">
                        {isSelected 
                            ? <span className="text-green-600 dark:text-green-300">✓ Selected</span>
                            : isOtherSelected 
                                ? <span className="text-gray-500">Select a different reward</span>
                                : <span className="text-blue-600 dark:text-blue-300">Click to claim this reward</span>
                        }
                    </p>
                </div>
            </div>
        </div>
    );
} 