// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ChoiceGroup } from "@/components/ui/choices";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AssessmentApp } from "@/components/assessment/AssessmentApp";
import { ResultsView } from "@/components/results/ResultsView";
import { KEYS } from "@/lib/storage/local-storage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

beforeAll(() => {
  // jsdom n’implémente pas toujours <dialog> modal.
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function Harness({ max }: { max?: number }) {
  const [v, setV] = useState<string[]>([]);
  return (
    <ChoiceGroup
      legend="Choix"
      name="t"
      multiple
      max={max}
      value={v}
      onChange={setV}
      options={[
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
      ]}
    />
  );
}

describe("ChoiceGroup", () => {
  it("expose de vraies cases à cocher accessibles et applique le maximum", async () => {
    const user = userEvent.setup();
    render(<Harness max={2} />);
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(3);
    await user.click(screen.getByLabelText(/^A/));
    await user.click(screen.getByLabelText(/^B/));
    expect((screen.getByLabelText(/^C/) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText("2 sur 2 choix maximum")).toBeTruthy();
    await user.click(screen.getByLabelText(/^A/));
    expect((screen.getByLabelText(/^C/) as HTMLInputElement).disabled).toBe(false);
  });
});

describe("ConfirmDialog", () => {
  it("n’appelle onConfirm qu’après action explicite et permet d’annuler", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Effacer ?" message="Définitif" confirmLabel="Effacer" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByRole("dialog", { name: "Effacer ?" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Effacer" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe("parcours du bilan", () => {
  it("passe l’accueil, affiche une question avec le focus sur son titre, puis reprend après rechargement", async () => {
    const user = userEvent.setup();
    const first = render(<AssessmentApp />);
    await screen.findByText(/Étape 1 sur 5/);
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: "Passer cette étape" }));
    await user.click(screen.getByRole("button", { name: "Commencer les questions" }));
    await screen.findByText(/Question 1/);
    const heading = document.getElementById("q-title")!;
    await waitFor(() => expect(document.activeElement).toBe(heading));
    // répondre à la première question
    await user.click(screen.getAllByRole("radio")[0]!);
    await user.click(screen.getByRole("button", { name: /Continuer/ }));
    await waitFor(() => expect(screen.getByText(/Question 2/)).toBeTruthy());
    // la session est enregistrée
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(KEYS.session) ?? "{}").phase).toBe("questions"));
    first.unmount();
    // rechargement : la progression est reprise
    render(<AssessmentApp />);
    await screen.findByText(/Question 2/);
  });

  it("supporte un stockage corrompu sans planter", async () => {
    window.localStorage.setItem(KEYS.session, "{corrompu");
    render(<AssessmentApp />);
    await screen.findByText(/Étape 1 sur 5/);
  });
});

describe("page de résultats", () => {
  it("affiche un état vide guidé sans réponses", async () => {
    render(<ResultsView />);
    expect(await screen.findByText("Pas encore de résultats")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Commencer mon bilan" })).toBeTruthy();
  });

  it("affiche les sections de résultats à partir d’une session enregistrée", async () => {
    window.localStorage.setItem(
      KEYS.session,
      JSON.stringify({
        schemaVersion: 2,
        questionnaireVersion: 1,
        phase: "termine",
        onboarding: { training: "mois" },
        engine: {
          asked: ["q-free-day", "q-aversions"],
          answers: { "q-free-day": { kind: "single", value: "nature" }, "q-aversions": { kind: "matrix", values: { "desk-all-day": 3 } } },
        },
      }),
    );
    render(<ResultsView />);
    expect(await screen.findByText("Votre profil professionnel")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "En bref" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Pourquoi pas ce métier ?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Exporter/ })).toBeTruthy();
  });
});
