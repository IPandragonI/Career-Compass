import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "border border-line bg-card text-ink hover:border-brand hover:text-brand",
  ghost: "text-brand hover:bg-brand-soft",
  danger: "border border-danger/40 bg-card text-danger hover:bg-danger-soft",
};
export const btn = (v: Variant = "primary", extra = "") => `${base} ${variants[v]} ${extra}`;

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
  external = false,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  if (external)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={btn(variant, className)}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={btn(variant, className)}>
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={`rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(29,36,51,0.04)] sm:p-6 ${className}`}>
      {children}
    </Tag>
  );
}

type Tone = "neutral" | "brand" | "accent" | "warn" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-paper text-muted border-line",
  brand: "bg-brand-soft text-brand-dark border-brand/20",
  accent: "bg-accent-soft text-accent border-accent/25",
  warn: "bg-warn-soft text-warn border-warn/25",
  danger: "bg-danger-soft text-danger border-danger/25",
};
export function Badge({ children, tone = "neutral", icon }: { children: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-accent">{children}</p>;
}

export function Container({ children, className = "", narrow = false }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={`mx-auto w-full px-4 sm:px-6 ${narrow ? "max-w-3xl" : "max-w-6xl"} ${className}`}>{children}</div>;
}

/** Jauge qualitative accessible : le niveau est aussi donné en texte, pas seulement par la couleur. */
export function Meter({ value, label, caption }: { value: number; label: string; caption?: string }) {
  const level = value >= 0.66 ? "élevée" : value >= 0.45 ? "moyenne" : "faible";
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-semibold text-ink">{caption ?? `adéquation ${level}`}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${label} : adéquation ${level}`}>
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(6, Math.round(value * 100))}%` }} />
      </div>
    </div>
  );
}
