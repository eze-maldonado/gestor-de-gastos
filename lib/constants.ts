import type { Category } from "./types";

export const STORAGE_KEY = "expense-tracker-v1";

export const DEFAULT_CATEGORIES: Omit<Category, "id" | "isDefault">[] = [
  { name: "Hogar", icon: "🏠", color: "#6366f1" },
  { name: "Auto", icon: "🚗", color: "#f59e0b" },
  { name: "Ahorro", icon: "💰", color: "#10b981" },
  { name: "Alimentación", icon: "🛒", color: "#3b82f6" },
  { name: "Delivery", icon: "🛵", color: "#f97316" },
  { name: "Merienda", icon: "☕", color: "#a78bfa" },
  { name: "Desayuno", icon: "🥐", color: "#fbbf24" },
  { name: "Salidas", icon: "🍻", color: "#ec4899" },
  { name: "Uber", icon: "🚕", color: "#14b8a6" },
  { name: "Recital", icon: "🎸", color: "#8b5cf6" },
  { name: "Salud", icon: "❤️", color: "#ef4444" },
  { name: "Educación", icon: "📚", color: "#0ea5e9" },
];

export const EMOJI_OPTIONS = [
  "🏠",
  "🚗",
  "💰",
  "🛒",
  "🛵",
  "☕",
  "🥐",
  "🍻",
  "🚕",
  "🎸",
  "❤️",
  "📚",
  "🎬",
  "✈️",
  "🎁",
  "💡",
  "🏋️",
  "👕",
  "📱",
];

export const COLOR_OPTIONS = [
  "#6366f1",
  "#7c6ff7",
  "#8b5cf6",
  "#a78bfa",
  "#3b82f6",
  "#0ea5e9",
  "#14b8a6",
  "#10b981",
  "#fbbf24",
  "#f59e0b",
  "#f97316",
  "#ff6b6b",
  "#ef4444",
  "#ec4899",
  "#64748b",
  "#22c55e",
];
