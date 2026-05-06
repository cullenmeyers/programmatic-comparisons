import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import DecisionSurface, {
  type DecisionEngineData,
} from "@/components/decision-engine/DecisionSurface";
import { absoluteUrl } from "@/lib/site";
import decisionEngineData from "../../../content/decision-engine/core-constraints.json";

export const metadata: Metadata = {
  title: "Find the right tool by constraint",
  description:
    "Choose the constraint that usually makes tools fail for you, then inspect the failure pattern that should decide the direction.",
  alternates: {
    canonical: absoluteUrl("/decide"),
  },
};

export default function DecidePage() {
  const data = decisionEngineData as DecisionEngineData;

  return (
    <main className="site-container page-shell content-stack">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Find the right tool by constraint
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-black/70">
          Choose what usually makes tools fail for you. ToolPicker maps that
          constraint to the failure pattern that should decide the tool.
        </p>
      </header>

      <Card className="border-black/10 p-4">
        <p className="text-sm leading-6 text-black/65">
          Human intent → Core constraints → Mechanism / friction → Failure
          pattern → Decision direction
        </p>
      </Card>

      <DecisionSurface data={data} />
    </main>
  );
}
