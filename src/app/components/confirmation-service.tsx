"use client"

import { useState, useCallback, ReactNode } from "react"
import { createContext, useContext } from "react"
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogCancel, 
  AlertDialogAction 
} from "@/components/ui/alert-dialog"

type ConfirmationOptions = {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

type ConfirmationContextType = {
  confirm: (options: ConfirmationOptions) => Promise<boolean>
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined)

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    isOpen: boolean
    options: ConfirmationOptions | null
    resolve: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  })

  const confirm = useCallback((options: ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
      })
    })
  }, [])

  const handleConfirm = () => {
    state.resolve?.(true)
    setState({ ...state, isOpen: false })
  }

  const handleCancel = () => {
    state.resolve?.(false)
    setState({ ...state, isOpen: false })
  }

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      
      <AlertDialog open={state.isOpen}>
        <AlertDialogContent className="bg-[#0d0d0d] text-white border-[#1f1f1f]">
          <AlertDialogHeader>
            <AlertDialogTitle>{state.options?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {state.options?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {state.options?.cancelText || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className={state.options?.variant === "destructive" ? 
                "border-none bg-red-600 text-white hover:bg-red-700" : 
                ""}
            >
              {state.options?.confirmText || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmationContext.Provider>
  )
}

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext)
  if (context === undefined) {
    throw new Error("useConfirmation must be used within a ConfirmationProvider")
  }
  return context
} 