import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { deleteReward, setStatus } from "../utils/LoyaltyUtils"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useConfirmation } from "@/app/components/confirmation-service"

interface RewardSheetProps {
	reward: any | null
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	onRewardCreated?: () => void
}

export function RewardSheet({ reward, isOpen, onOpenChange, onRewardCreated }: RewardSheetProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [statusValue, setStatusValue] = useState<boolean | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const { confirm } = useConfirmation();

	// Set initial status when reward changes
	useEffect(() => {
		if (reward) {
			setStatusValue(reward.is_active);
		}
	}, [reward]);

	const handleEditToggle = () => {
		if (isEditing) {
			// If canceling edit, reset status to original value
			setStatusValue(reward?.is_active || false);
		}
		setIsEditing(!isEditing);
	};

	const handleSave = async () => {
		if (!reward) return;
		
		setIsSaving(true);
		
		try {
			const success = await setStatus(reward.id, statusValue || false);
			
			if (success) {
				toast.success("Reward updated successfully");
				setIsEditing(false);
				if (onRewardCreated) {
					onRewardCreated();
				}
			} else {
				toast.error("Failed to update reward");
			}
		} catch (error) {
			console.error("Error updating reward:", error);
			toast.error("An error occurred while updating the reward");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!reward) return;
		
		try {
			// Show confirmation dialog using the promise-based approach
			const confirmed = await confirm({
				title: "Delete Reward",
				description: "Are you sure you want to delete this reward? This action cannot be undone.",
				confirmText: "Yes, Delete",
				cancelText: "No, Cancel",
				variant: "destructive"
			});
			
			// Only proceed if user confirmed
			if (confirmed) {
				setIsDeleting(true);
				const success = await deleteReward(reward.id);
				
				if (success) {
					toast.success("Reward deleted successfully");
					onOpenChange(false);
					if (onRewardCreated) {
						onRewardCreated();
					}
				} else {
					toast.error("Failed to delete reward. Try again later.");
				}
			}
		} catch (error) {
			console.error("Error deleting reward:", error);
			toast.error("An error occurred while deleting the reward");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!reward) return null
	
	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent className="bg-[#131313] text-white border-l-1 border-l-[#222]">
				<SheetHeader>
					<SheetTitle className="text-white">{reward.name}</SheetTitle>
					<SheetDescription className="text-gray-400">
						{isEditing ? "Edit reward details" : "View reward details"}
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
							disabled={true}
						/>
					</div>
					
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="status" className="text-right text-gray-300">
							Status
						</Label>
						{isEditing ? (
							<div className="col-span-3">
								<Select 
									value={statusValue ? "active" : "inactive"} 
									onValueChange={(value) => setStatusValue(value === "active")}
								>
									<SelectTrigger className="bg-[#292929] text-white border-[#626262]">
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent className="bg-[#292929] text-white border-[#626262]">
										<SelectItem value="active" className="hover:bg-[#3a3a3a]">Active</SelectItem>
										<SelectItem value="inactive" className="hover:bg-[#3a3a3a]">Inactive</SelectItem>
									</SelectContent>
								</Select>
							</div>
						) : (
							<div className="col-span-3">
								{reward.is_active ? 
									<span className="text-green-500 font-medium">Active</span> : 
									<span className="text-red-500 font-medium">Inactive</span>
								}
							</div>
						)}
					</div>
				</div>
				
				<SheetFooter>
					{!isEditing ? (
						<>
							<Button 
								variant="destructive" 
								onClick={handleDelete}
								disabled={isDeleting}
							>
								{isDeleting ? "Deleting..." : "Delete"}
							</Button>
							<Button variant="outline" onClick={handleEditToggle}>
								Edit
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" onClick={handleEditToggle} disabled={isSaving}>
								Cancel
							</Button>
							<Button 
								variant="default" 
								onClick={handleSave} 
								disabled={isSaving}
								className="bg-green-600 hover:bg-green-700"
							>
								{isSaving ? "Saving..." : "Save Changes"}
							</Button>
						</>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
  	)
}
