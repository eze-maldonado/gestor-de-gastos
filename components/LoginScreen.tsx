"use client";

import { Loader2, LogIn, WalletCards } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setError("");
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
    } catch {
      setError("No pudimos iniciar sesión con Google. Revisá Firebase Auth.");
      setIsSigningIn(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(124,111,247,0.18),transparent_34rem),linear-gradient(135deg,#0f0f14,#171721_50%,#22223a)] px-4 text-slate-100">
      <section className="glass-card w-full max-w-md p-6 sm:p-8">
        <div className="mb-7">
          <span className="mb-4 grid size-12 place-items-center rounded-lg bg-violet-400/15 text-violet-100">
            <WalletCards className="size-6" />
          </span>
          <p className="text-sm text-violet-200">Gestor de Gastos</p>
          <h1 className="mt-1 font-display text-4xl text-white">
            Entrá con tu cuenta
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Tus datos se sincronizan con Firebase para que puedas usarlos desde la
            computadora o el celular.
          </p>
        </div>

        <button
          className="button-primary w-full justify-center"
          disabled={isSigningIn}
          onClick={login}
          type="button"
        >
          {isSigningIn ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          Continuar con Google
        </button>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
