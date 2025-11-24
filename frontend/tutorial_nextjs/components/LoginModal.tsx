"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToSignup?: () => void;
    onSuccess?: () => void;
}

export function LoginModal({ open, onOpenChange, onSwitchToSignup, onSuccess }: LoginModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                <LoginForm onSwitchToSignup={onSwitchToSignup} onSuccess={onSuccess} />
            </DialogContent>
        </Dialog>
    );
}
