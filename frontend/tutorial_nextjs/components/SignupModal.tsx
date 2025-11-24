"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SignupForm } from "@/components/signup-form";

interface SignupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToLogin?: () => void;
    onVerificationNeeded?: (email: string) => void;
    onSuccess?: () => void;
}

export function SignupModal({ open, onOpenChange, onSwitchToLogin, onVerificationNeeded, onSuccess }: SignupModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                <SignupForm onSwitchToLogin={onSwitchToLogin} onVerificationNeeded={onVerificationNeeded} onSuccess={onSuccess} />
            </DialogContent>
        </Dialog>
    );
}
