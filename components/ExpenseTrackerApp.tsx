"use client";

import {
  BarChart3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { BudgetControlDashboard } from "./BudgetControlDashboard";
import { CreditCardSection } from "./CreditCardSection";
import { ExpenseList } from "./ExpenseList";
import { AddExpenseModal } from "./AddExpenseModal";
import { MonthNavigator } from "./MonthNavigator";
import { PieChartCard } from "./PieChartCard";
import { SalaryCard } from "./SalaryCard";
import { SavingsDashboard } from "./SavingsDashboard";
import { StatsCard } from "./StatsCard";

type View = "dashboard" | "expenses" | "credit" | "savings" | "budget";

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "expenses" as const, label: "Gastos", icon: BarChart3 },
  { id: "credit" as const, label: "Tarjeta", icon: CreditCard },
  { id: "savings" as const, label: "Ahorros", icon: PiggyBank },
  { id: "budget" as const, label: "Control", icon: ClipboardList },
];

export function ExpenseTrackerApp() {
  const { logout, user } = useAuth();
  const [view, setView] = useState<View>("dashboard");
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,111,247,0.18),transparent_34rem),linear-gradient(135deg,#0f0f14,#171721_50%,#22223a)] text-slate-100">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/8 bg-[#0f0f14]/82 p-5 backdrop-blur-xl lg:block">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">
            Finanzas
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none text-white">
            Gestor de Gastos
          </h1>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-semibold transition ${
                  active
                    ? "bg-violet-400/18 text-white"
                    : "text-slate-400 hover:bg-white/6 hover:text-white"
                }`}
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <button
          className="button-primary mt-8 w-full justify-center"
          onClick={() => setIsAddOpen(true)}
          type="button"
        >
          <Plus className="size-4" />
          Nuevo gasto
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <div className="mb-3 min-w-0 rounded-lg border border-white/8 bg-white/[0.035] p-3">
            <p className="truncate text-sm font-semibold text-white">
              {user?.displayName ?? "Cuenta Google"}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            className="button-secondary w-full justify-center"
            onClick={() => void logout()}
            type="button"
          >
            <LogOut className="size-4" />
            Salir
          </button>
        </div>
      </aside>

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <header className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
            <div className="sm:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">
                Finanzas
              </p>
              <h1 className="font-display text-4xl text-white">Gestor de Gastos</h1>
            </div>
            <div className="sm:col-start-2 sm:justify-self-center">
              <MonthNavigator />
            </div>
            <button
              className="button-primary w-full justify-center sm:col-start-3 sm:w-auto sm:justify-self-end"
              onClick={() => setIsAddOpen(true)}
              type="button"
            >
              <Plus className="size-4" />
              Nuevo gasto
            </button>
            <button
              aria-label="Cerrar sesión"
              className="icon-button justify-self-end sm:hidden"
              onClick={() => void logout()}
              type="button"
            >
              <LogOut className="size-4" />
            </button>
          </header>

          {view === "dashboard" ? (
            <>
              <SalaryCard />
              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <PieChartCard />
                <StatsCard />
              </div>
              <ExpenseList />
            </>
          ) : null}

          {view === "expenses" ? (
            <>
              <SalaryCard />
              <ExpenseList />
            </>
          ) : null}

          {view === "credit" ? <CreditCardSection /> : null}

          {view === "savings" ? <SavingsDashboard /> : null}

          {view === "budget" ? <BudgetControlDashboard /> : null}

        </div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1.5 rounded-xl border border-white/10 bg-[#12121a]/88 p-2 backdrop-blur-xl lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition ${
                active ? "bg-violet-400/20 text-white" : "text-slate-400"
              }`}
              key={item.id}
              onClick={() => setView(item.id)}
              type="button"
            >
              <Icon className="size-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <AddExpenseModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
