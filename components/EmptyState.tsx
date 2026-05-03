import { WalletCards } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-violet-400/12 text-violet-200">
        <WalletCards className="size-7" />
      </div>
      <h3 className="font-display text-2xl text-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}
