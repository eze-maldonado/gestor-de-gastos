"use client";

import { Check } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { COLOR_OPTIONS, EMOJI_OPTIONS } from "@/lib/constants";
import type { Category } from "@/lib/types";

interface CategoryFormProps {
  category?: Category | null;
  onCancel: () => void;
  onSubmit: (category: Omit<Category, "id" | "isDefault"> | Category) => void;
  renderAsForm?: boolean;
}

export function CategoryForm({
  category,
  onCancel,
  onSubmit,
  renderAsForm = true,
}: CategoryFormProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  useEffect(() => {
    setName(category?.name ?? "");
    setIcon(category?.icon ?? EMOJI_OPTIONS[0]);
    setColor(category?.color ?? COLOR_OPTIONS[0]);
  }, [category]);

  const submit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!name.trim()) {
      return;
    }

    if (category) {
      onSubmit({ ...category, name: name.trim(), icon, color });
    } else {
      onSubmit({ name: name.trim(), icon, color });
    }
  };

  const content = (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label>
          <span className="label">Nombre</span>
          <input
            className="field"
            onChange={(event) => setName(event.target.value)}
            placeholder="Nueva categoría"
            required
            value={name}
          />
        </label>
        <div>
          <span className="label">Vista</span>
          <div
            className="grid size-12 place-items-center rounded-lg text-2xl"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {icon}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <span className="label">Icono</span>
        <div className="grid grid-cols-10 gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              aria-label={`Elegir ${emoji}`}
              className={`grid size-9 place-items-center rounded-lg border text-lg transition hover:bg-white/10 ${
                icon === emoji ? "border-violet-300 bg-violet-400/20" : "border-white/8 bg-white/[0.03]"
              }`}
              key={emoji}
              onClick={() => setIcon(emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <span className="label">Color</span>
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-16">
          {COLOR_OPTIONS.map((option) => (
            <button
              aria-label={`Elegir color ${option}`}
              className="grid size-8 place-items-center rounded-full border border-white/15 transition hover:scale-110"
              key={option}
              onClick={() => setColor(option)}
              style={{ backgroundColor: option }}
              type="button"
            >
              {color === option ? <Check className="size-4 text-white" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button className="button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button
          className="button-primary"
          onClick={() => {
            if (!renderAsForm) {
              submit();
            }
          }}
          type={renderAsForm ? "submit" : "button"}
        >
          {category ? "Guardar" : "Crear"}
        </button>
      </div>
    </>
  );

  if (!renderAsForm) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        {content}
      </div>
    );
  }

  return (
    <form className="rounded-lg border border-white/10 bg-black/20 p-4" onSubmit={submit}>
      {content}
    </form>
  );
}
