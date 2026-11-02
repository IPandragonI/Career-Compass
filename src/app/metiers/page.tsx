import type { Metadata } from "next";
import { OccupationExplorer } from "@/components/occupations/OccupationExplorer";

export const metadata: Metadata = { title: "Explorer les métiers" };

export default function MetiersPage() {
  return <OccupationExplorer />;
}
