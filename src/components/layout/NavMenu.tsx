"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/bilan/", label: "Mon bilan" },
  { href: "/metiers/", label: "Métiers" },
  { href: "/secteurs/", label: "Secteurs" },
  { href: "/favoris/", label: "Favoris" },
  { href: "/a-propos/", label: "Méthode et sources" },
];

/** Navigation principale : barre horizontale dès `sm`, menu repliable en dessous. */
export function NavMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="no-print">
      <button
        type="button"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-medium hover:bg-brand-soft sm:hidden"
        aria-expanded={open}
        aria-controls="nav-list"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        Menu
      </button>
      <nav aria-label="Navigation principale" className={`${open ? "block" : "hidden"} w-full sm:block`}>
        <ul id="nav-list" className="flex flex-col gap-0.5 text-[15px] sm:flex-row sm:flex-wrap sm:items-center">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 w-full items-center rounded-lg px-3 font-medium text-ink hover:bg-brand-soft hover:text-brand-dark"
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
