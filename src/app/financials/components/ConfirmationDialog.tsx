"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReactNode } from "react";

interface ConfirmationDialogProps {
    trigger?: ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

export function ConfirmationDialog({
    trigger,
    isOpen,
    onClose,
    title,
    description,
    onConfirm,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
}: ConfirmationDialogProps) {
    const content = (
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50">
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                    {description}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel 
                    onClick={onClose}
                    className="bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 border-zinc-700"
                >
                    {cancelText}
                </AlertDialogCancel>
                <AlertDialogAction
                    onClick={onConfirm}
                    className={
                        variant === "destructive"
                            ? "bg-red-600 hover:bg-red-700 text-white border-none"
                            : "bg-blue-600 hover:bg-blue-700 text-white border-none"
                    }
                >
                    {confirmText}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );

    if (trigger) {
        return (
            <AlertDialog>
                <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
                {content}
            </AlertDialog>
        );
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            {content}
        </AlertDialog>
    );
} 