"use client";

import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { ExpenseTrackerApp } from "@/components/ExpenseTrackerApp";
import { LoginScreen } from "@/components/LoginScreen";

export function AppShell() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { isAuthLoading, user } = useAuth();

  if (isAuthLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-slate-100">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
          <Loader2 className="size-5 animate-spin text-violet-200" />
          Cargando aplicación
        </div>
      </main>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <ExpenseProvider>
      <ExpenseTrackerApp />
    </ExpenseProvider>
  );
}
