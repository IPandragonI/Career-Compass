import type { Metadata } from "next";
import { AssessmentApp } from "@/components/assessment/AssessmentApp";

export const metadata: Metadata = { title: "Mon bilan" };

export default function BilanPage() {
  return <AssessmentApp />;
}
