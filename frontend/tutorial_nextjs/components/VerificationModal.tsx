"use client";

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { EmailVerificationForm } from "@/components/email-verification-form";

interface VerificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    email?: string;
    onSuccess?: () => void;
}

export function VerificationModal({ open, onOpenChange, email, onSuccess }: VerificationModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                <EmailVerificationForm
                    initialEmail={email}
                    onSuccess={onSuccess}
                    className="border-0 shadow-none"
                />
            </DialogContent>
        </Dialog>
    );
}
