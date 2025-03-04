import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface RewardSheetProps {
  reward: any | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function RewardSheet({ reward, isOpen, onOpenChange }: RewardSheetProps) {
  if (!reward) return null
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#131313] text-white border-l-1 border-l-[#222]">
        <SheetHeader>
          <SheetTitle className="text-white">{reward.name}</SheetTitle>
          <SheetDescription className="text-gray-400">
            View and edit reward details
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-gray-300">
              Name
            </Label>
            <Input 
              id="name" 
              value={reward.name} 
              className="col-span-3 bg-[#292929] text-white border-[#626262]" 
              readOnly
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right text-gray-300">
              Description
            </Label>
            <Input 
              id="description" 
              value={reward.description} 
              className="col-span-3 bg-[#292929] text-white border-[#626262]" 
              readOnly
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="points" className="text-right text-gray-300">
              Points
            </Label>
            <Input 
              id="points" 
              value={reward.points_required} 
              className="col-span-3 bg-[#292929] text-white border-[#626262]" 
              readOnly
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right text-gray-300">
              Status
            </Label>
            <div className="col-span-3">
              {reward.is_active ? 
                <span className="text-green-500 font-medium">Active</span> : 
                <span className="text-red-500 font-medium">Inactive</span>
              }
            </div>
          </div>
        </div>
        
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="secondary">
              Edit
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
