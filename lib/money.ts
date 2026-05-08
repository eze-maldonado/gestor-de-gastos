import type { CurrencyCode } from "./types";

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: "ARS", label: "ARS" },
  { code: "USD", label: "USD" },
  { code: "EUR", label: "EUR" },
];

export function formatCurrency(value: number, currency: CurrencyCode = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "ARS" ? 0 : 2,
  }).format(value);
}

export function parseAmountInput(value: string): number {
  const cleanValue = value.replace(/[^\d.,]/g, "");
  if (!cleanValue) {
    return 0;
  }

  const lastComma = cleanValue.lastIndexOf(",");
  const lastDot = cleanValue.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : ".";
  const hasBothSeparators = lastComma >= 0 && lastDot >= 0;
  const hasOnlyComma = lastComma >= 0 && lastDot < 0;
  const hasOnlyDot = lastDot >= 0 && lastComma < 0;
  const separatorIndex = cleanValue.lastIndexOf(decimalSeparator);
  const fractionLength = separatorIndex >= 0 ? cleanValue.length - separatorIndex - 1 : 0;
  const shouldUseDecimal =
    hasBothSeparators || ((hasOnlyComma || hasOnlyDot) && fractionLength > 0 && fractionLength <= 2);

  if (!shouldUseDecimal) {
    return Number(cleanValue.replace(/[.,]/g, "")) || 0;
  }

  const integerPart = cleanValue.slice(0, separatorIndex).replace(/[.,]/g, "");
  const fractionPart = cleanValue.slice(separatorIndex + 1).replace(/[.,]/g, "");
  return Number(`${integerPart || "0"}.${fractionPart}`) || 0;
}

export function formatAmountInput(value: string): string {
  const cleanValue = value.replace(/[^\d.,]/g, "");
  if (!cleanValue) {
    return "";
  }

  const endsWithDecimalSeparator = /[,.]$/.test(cleanValue);
  const amount = parseAmountInput(cleanValue);
  const hasDecimalInput = /[,.]\d{0,2}$/.test(cleanValue);
  const fractionDigits = hasDecimalInput
    ? cleanValue.split(/[,.]/).at(-1)?.length ?? 0
    : 0;
  const formattedAmount = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: fractionDigits,
  }).format(amount);

  return endsWithDecimalSeparator ? `${formattedAmount},` : formattedAmount;
}
