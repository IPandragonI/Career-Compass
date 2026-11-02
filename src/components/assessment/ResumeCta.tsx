"use client";

import { ArrowRight, History } from "lucide-react";
import { useSession } from "@/lib/hooks/use-session";
import { ButtonLink } from "@/components/ui/primitives";

export function StartButtons() {
  const { hydrated, hasSaved, session } = useSession();
  const answered = Object.keys(session.engine.answers).length;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonLink href="/bilan/" variant={hydrated && hasSaved ? "secondary" : "primary"}>
        Commencer mon bilan <ArrowRight aria-hidden className="h-4 w-4" />
      </ButtonLink>
      {hydrated && hasSaved && (
        <ButtonLink href="/bilan/" variant="primary">
          <History aria-hidden className="h-4 w-4" />
          Reprendre mon bilan{answered ? ` (${answered} réponse${answered > 1 ? "s" : ""})` : ""}
        </ButtonLink>
      )}
    </div>
  );
}
