"use client";

import { ProtectedRoute } from "@/hooks/useProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>{children}</ProtectedRoute>
  );
}
