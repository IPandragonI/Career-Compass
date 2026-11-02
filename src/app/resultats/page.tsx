import type { Metadata } from "next";
import { ResultsView } from "@/components/results/ResultsView";

export const metadata: Metadata = { title: "Mes résultats" };

export default function ResultatsPage() {
  return <ResultsView />;
}
