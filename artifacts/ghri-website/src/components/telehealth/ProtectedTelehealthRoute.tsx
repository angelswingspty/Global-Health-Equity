import React from "react";
import { Redirect } from "wouter";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { TelehealthLayout } from "./TelehealthLayout";

interface Props {
  children: React.ReactNode;
  allowedRoles?: ("patient" | "provider")[];
}

export function ProtectedTelehealthRoute({ children, allowedRoles }: Props) {
  const { token, user } = useTelehealthAuth();

  if (!token || !user) {
    return <Redirect to="/telehealth/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to={user.role === "patient" ? "/telehealth/patient/dashboard" : "/telehealth/provider/dashboard"} />;
  }

  return <TelehealthLayout>{children}</TelehealthLayout>;
}
