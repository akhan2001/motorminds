"use client"

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { HelpCircle } from "lucide-react"

export function AlertConfirmation({ title, description, action, onAction }: { title: string, description: string, action: string, onAction: () => void }) {
	return (
		<AlertDialog>
            <AlertDialogTrigger asChild>
                <HelpCircle className="inline-block w-5 h-5" />
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0d0d0d] text-white border-[#1f1f1f]">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="border-none bg-red-600 text-white hover:bg-red-700" onClick={onAction}>
                        {action}
                    </AlertDialogAction>
			    </AlertDialogFooter>
		    </AlertDialogContent>
	    </AlertDialog>
	)
}