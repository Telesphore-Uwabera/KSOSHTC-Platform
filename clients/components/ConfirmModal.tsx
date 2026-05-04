import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmModalProps) {
  const isDestructive = variant === "destructive";
  const isInfo = variant === "info";

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-[28px] border-none shadow-2xl p-0 overflow-hidden max-w-[380px] bg-white">
        <div className={cn(
          "h-1.5 w-full",
          isDestructive ? "bg-red-500" : isInfo ? "bg-blue-500" : "bg-primary"
        )} />
        <div className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={cn(
              "p-4 rounded-2xl",
              isDestructive ? "bg-red-50 text-red-600" : isInfo ? "bg-blue-50 text-blue-600" : "bg-primary/10 text-primary"
            )}>
              {isDestructive ? <AlertTriangle className="w-8 h-8" /> : <Info className="w-8 h-8" />}
            </div>
            
            <AlertDialogHeader className="space-y-2 !text-center">
              <AlertDialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 text-sm leading-relaxed px-2">
                {description}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <AlertDialogFooter className="mt-8 flex flex-row gap-3 sm:justify-center sm:space-x-0">
            <AlertDialogCancel 
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              className="flex-1 rounded-2xl border-gray-100 text-gray-500 hover:bg-gray-50 h-12 font-bold transition-all border-2"
            >
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              className={cn(
                "flex-1 rounded-2xl h-12 font-bold text-white shadow-lg transition-all",
                isDestructive 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-100" 
                  : "bg-primary hover:bg-primary/90 shadow-primary/10"
              )}
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
