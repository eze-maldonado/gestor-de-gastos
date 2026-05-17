"use client";

import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { MonthNavigator } from "@/components/MonthNavigator";
import { useBudgetControl } from "@/hooks/useBudgetControl";
import { formatMonth } from "@/lib/date";
import { formatAmountInput, formatCurrency, parseAmountInput } from "@/lib/money";
import type {
  FixedExpenseCategory,
  FixedExpenseItem,
  FixedExpenseStatus,
} from "@/lib/types";
import { EmptyState } from "./EmptyState";

interface ExpenseTableProps {
  category: FixedExpenseCategory;
  description: string;
  items: FixedExpenseItem[];
  onAdd: (
    category: FixedExpenseCategory,
    item: Pick<FixedExpenseItem, "concepto" | "monto" | "observaciones">,
  ) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onUpdate: (item: FixedExpenseItem) => void;
  subtotal?: { label: string; value: number };
  title: string;
  total: number;
}

export function BudgetControlDashboard() {
  const {
    budgetControl,
    currentMonth,
    summary,
    setBudgetField,
    addItem,
    updateItem,
    toggleItemStatus,
    deleteItem,
  } = useBudgetControl();

  return (
    <div className="space-y-5">
      <BudgetHeader
        monthKey={currentMonth.monthKey}
        montoDisponible={budgetControl.montoDisponible}
        onChange={setBudgetField}
      />

      <div className="grid gap-5">
        <ExpenseTable
          category="FIJO"
          description="Compromisos recurrentes del mes."
          items={summary.fixedItems}
          onAdd={addItem}
          onDelete={deleteItem}
          onToggleStatus={toggleItemStatus}
          onUpdate={updateItem}
          title="Gastos Fijos"
          total={summary.fixedTotal}
        />
        <ExpenseTable
          category="MOVIL_EXTRA"
          description="Variables, extras y consumos con tarjeta."
          items={summary.variableItems}
          onAdd={addItem}
          onDelete={deleteItem}
          onToggleStatus={toggleItemStatus}
          onUpdate={updateItem}
          subtotal={
            summary.cardTotal > 0
              ? { label: "Total de tarjetas", value: summary.cardTotal }
              : undefined
          }
          title="Gastos Móviles / Extras / Tarjetas"
          total={summary.variableTotal}
        />
        {summary.cardTotal > 0 ? (
          <PersonalCardTotal
            cardTotal={summary.cardTotal}
            effectiveCardTotal={summary.effectiveCardTotal}
            onChange={(value) => setBudgetField("tarjetaPersonalTotal", value)}
            value={summary.personalCardTotal}
          />
        ) : null}
      </div>

      <BudgetFooter
        available={budgetControl.montoDisponible}
        totalMonth={summary.totalMonth}
        realRemaining={summary.realRemaining}
      />
    </div>
  );
}

function BudgetHeader({
  monthKey,
  montoDisponible,
  onChange,
}: {
  monthKey: string;
  montoDisponible: number;
  onChange: (field: "montoDisponible", value: number) => void;
}) {
  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-violet-200">Control mensual</p>
          <h2 className="font-display text-3xl text-white">
            Gastos Fijos y Control Mensual
          </h2>
        </div>
        <MonthNavigator />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <HeaderMetric
          icon={<CalendarDays className="size-5" />}
          label="Mes"
          value={formatMonth(monthKey).toLocaleUpperCase("es-AR")}
        />
        <MoneyField
          icon={<Banknote className="size-5" />}
          label="Disponible"
          onChange={(value) => onChange("montoDisponible", value)}
          value={montoDisponible}
        />
      </div>
    </section>
  );
}

function HeaderMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center gap-2 text-slate-300">
        <span className="grid size-9 place-items-center rounded-lg bg-white/8 text-violet-100">
          {icon}
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="truncate text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function MoneyField({
  icon,
  label,
  onChange,
  value,
}: {
  icon: ReactNode;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  const [draft, setDraft] = useState(formatAmountInput(String(value || "")));

  useEffect(() => {
    setDraft(formatAmountInput(String(value || "")));
  }, [value]);

  return (
    <label className="rounded-lg border border-white/8 bg-white/[0.035] p-4">
      <span className="mb-3 flex items-center gap-2 text-slate-300">
        <span className="grid size-9 place-items-center rounded-lg bg-white/8 text-violet-100">
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
      </span>
      <input
        className="field"
        inputMode="decimal"
        onBlur={() => onChange(parseAmountInput(draft))}
        onChange={(event) => setDraft(formatAmountInput(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        pattern="[0-9.,]*"
        placeholder="0"
        type="text"
        value={draft}
      />
    </label>
  );
}

function ExpenseTable({
  category,
  description,
  items,
  onAdd,
  onDelete,
  onToggleStatus,
  onUpdate,
  subtotal,
  title,
  total,
}: ExpenseTableProps) {
  return (
    <section className="glass-card overflow-hidden p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-violet-200">{description}</p>
          <h2 className="font-display text-3xl text-white">{title}</h2>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-violet-400/15 text-violet-100">
          <ReceiptText className="size-6" />
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              <th className="px-3 py-2">Concepto</th>
              <th className="px-3 py-2">Monto</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    title="Sin conceptos"
                    description="Agrega el primer gasto para armar el control del mes."
                  />
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ExpenseRow
                  item={item}
                  key={item.id}
                  onDelete={() => onDelete(item.id)}
                  onToggleStatus={() => onToggleStatus(item.id)}
                  onUpdate={onUpdate}
                />
              ))
            )}
            {subtotal ? (
              <tr>
                <td className="rounded-l-lg border-y border-l border-white/8 bg-white/[0.04] px-3 py-3 text-sm font-semibold text-slate-300">
                  {subtotal.label}
                </td>
                <td className="border-y border-white/8 bg-white/[0.04] px-3 py-3 font-bold text-white">
                  {formatCurrency(subtotal.value)}
                </td>
                <td className="border-y border-white/8 bg-white/[0.04]" />
                <td className="rounded-r-lg border-y border-r border-white/8 bg-white/[0.04]" />
              </tr>
            ) : null}
            <QuickAddRow category={category} onAdd={onAdd} />
          </tbody>
          <tfoot>
            <tr>
              <td className="rounded-l-lg bg-slate-200/10 px-3 py-4 text-sm font-bold uppercase tracking-[0.14em] text-slate-300">
                Total
              </td>
              <td className="bg-slate-200/10 px-3 py-4 text-lg font-bold text-white">
                {formatCurrency(total)}
              </td>
              <td className="bg-slate-200/10" />
              <td className="rounded-r-lg bg-slate-200/10" />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function ExpenseRow({
  item,
  onDelete,
  onToggleStatus,
  onUpdate,
}: {
  item: FixedExpenseItem;
  onDelete: () => void;
  onToggleStatus: () => void;
  onUpdate: (item: FixedExpenseItem) => void;
}) {
  const [amountDraft, setAmountDraft] = useState(
    formatAmountInput(String(item.monto || "")),
  );

  useEffect(() => {
    setAmountDraft(formatAmountInput(String(item.monto || "")));
  }, [item.monto]);

  const updateField = (
    field: keyof Pick<FixedExpenseItem, "concepto" | "monto" | "observaciones">,
    value: string | number,
  ) => {
    onUpdate({ ...item, [field]: value });
  };

  return (
    <tr className="group">
      <td className="rounded-l-lg border-y border-l border-white/8 bg-white/[0.035] px-3 py-3">
        <input
          className="w-full bg-transparent font-semibold text-white outline-none placeholder:text-slate-500"
          onChange={(event) => updateField("concepto", event.target.value)}
          placeholder="Concepto"
          type="text"
          value={item.concepto}
        />
        <input
          className="mt-1 w-full bg-transparent text-sm text-slate-400 outline-none placeholder:text-slate-600"
          onChange={(event) => updateField("observaciones", event.target.value)}
          placeholder="Observaciones"
          type="text"
          value={item.observaciones ?? ""}
        />
      </td>
      <td className="border-y border-white/8 bg-white/[0.035] px-3 py-3">
        <input
          className="w-32 rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-right font-bold text-white outline-none transition focus:border-violet-300/50"
          inputMode="decimal"
          onBlur={() => updateField("monto", parseAmountInput(amountDraft))}
          onChange={(event) => setAmountDraft(formatAmountInput(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          pattern="[0-9.,]*"
          placeholder="0"
          type="text"
          value={amountDraft}
        />
      </td>
      <td className="border-y border-white/8 bg-white/[0.035] px-3 py-3">
        <StatusBadge status={item.estado} onClick={onToggleStatus} />
      </td>
      <td className="rounded-r-lg border-y border-r border-white/8 bg-white/[0.035] px-3 py-3">
        <div className="flex justify-end gap-1">
          <span className="grid size-9 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-slate-500">
            <Pencil className="size-4" />
          </span>
          <button
            aria-label="Eliminar concepto"
            className="icon-button text-red-200 hover:border-red-300/30 hover:bg-red-500/15"
            onClick={onDelete}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({
  onClick,
  status,
}: {
  onClick: () => void;
  status: FixedExpenseStatus;
}) {
  const paid = status === "PAGADO";

  return (
    <button
      className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] transition ${
        paid
          ? "bg-emerald-200/18 text-emerald-100 hover:bg-emerald-200/25"
          : "bg-rose-200/18 text-rose-100 hover:bg-rose-200/25"
      }`}
      onClick={onClick}
      type="button"
    >
      <CheckCircle2 className="size-3.5" />
      {paid ? "PAGADO" : "FALTA PAGAR"}
    </button>
  );
}

function QuickAddRow({
  category,
  onAdd,
}: {
  category: FixedExpenseCategory;
  onAdd: (
    category: FixedExpenseCategory,
    item: Pick<FixedExpenseItem, "concepto" | "monto" | "observaciones">,
  ) => void;
}) {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const parsedAmount = useMemo(() => parseAmountInput(monto), [monto]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!concepto.trim() || parsedAmount <= 0) {
      return;
    }

    onAdd(category, {
      concepto: concepto.trim(),
      monto: parsedAmount,
      observaciones: observaciones.trim(),
    });
    setConcepto("");
    setMonto("");
    setObservaciones("");
  };

  return (
    <tr>
      <td colSpan={4} className="pt-2">
        <form
          className="grid gap-2 rounded-lg border border-dashed border-white/14 bg-white/[0.025] p-3 sm:grid-cols-[minmax(0,1.2fr)_9rem_minmax(0,1fr)_auto]"
          onSubmit={submit}
        >
          <input
            className="field"
            onChange={(event) => setConcepto(event.target.value)}
            placeholder="Nuevo concepto"
            type="text"
            value={concepto}
          />
          <input
            className="field"
            inputMode="decimal"
            onChange={(event) => setMonto(formatAmountInput(event.target.value))}
            pattern="[0-9.,]*"
            placeholder="Monto"
            type="text"
            value={monto}
          />
          <input
            className="field"
            onChange={(event) => setObservaciones(event.target.value)}
            placeholder="Observaciones"
            type="text"
            value={observaciones}
          />
          <button className="button-secondary justify-center" type="submit">
            <Plus className="size-4" />
            Agregar
          </button>
        </form>
      </td>
    </tr>
  );
}

function BudgetFooter({
  available,
  realRemaining,
  totalMonth,
}: {
  available: number;
  realRemaining: number;
  totalMonth: number;
}) {
  const isNegative = realRemaining < 0;

  return (
    <section className="glass-card overflow-hidden p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm text-violet-200">Resumen dinámico</p>
          <h2 className="font-display text-4xl text-white">
            Total del mes aproximado: {formatCurrency(totalMonth)}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Disponible {formatCurrency(available)}.
          </p>
        </div>
        <div
          className={`rounded-lg border px-5 py-4 text-right ${
            isNegative
              ? "border-rose-300/20 bg-rose-400/10"
              : "border-emerald-300/20 bg-emerald-400/10"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Remanente real
          </p>
          <p
            className={`mt-1 text-3xl font-bold ${
              isNegative ? "text-rose-100" : "text-emerald-100"
            }`}
          >
            {formatCurrency(realRemaining)}
          </p>
        </div>
      </div>
    </section>
  );
}

function PersonalCardTotal({
  cardTotal,
  effectiveCardTotal,
  onChange,
  value,
}: {
  cardTotal: number;
  effectiveCardTotal: number;
  onChange: (value: number) => void;
  value?: number;
}) {
  const [draft, setDraft] = useState(
    value === undefined ? "" : formatAmountInput(String(value)),
  );

  useEffect(() => {
    setDraft(value === undefined ? "" : formatAmountInput(String(value)));
  }, [value]);

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <p className="text-sm text-violet-200">Tarjeta compartida</p>
          <h2 className="font-display text-3xl text-white">Total tarjeta mío</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Total detectado en tarjetas: {formatCurrency(cardTotal)}. Para el remanente
            se descuenta {formatCurrency(effectiveCardTotal)}.
          </p>
        </div>
        <label>
          <span className="label">Monto a pagar por mí</span>
          <input
            className="field"
            inputMode="decimal"
            onBlur={() => onChange(parseAmountInput(draft))}
            onChange={(event) => setDraft(formatAmountInput(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            pattern="[0-9.,]*"
            placeholder="1.500.000"
            type="text"
            value={draft}
          />
        </label>
      </div>
    </section>
  );
}
