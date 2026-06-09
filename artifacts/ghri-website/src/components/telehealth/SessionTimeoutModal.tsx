import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";

export function SessionTimeoutModal() {
  const { isSessionWarningOpen, closeSessionWarning } = useTelehealthAuth();

  return (
    <Dialog open={isSessionWarningOpen} onOpenChange={closeSessionWarning}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Expiry Warning</DialogTitle>
          <DialogDescription>
            Your session will expire in 2 minutes due to inactivity. Click anywhere to stay signed in.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
