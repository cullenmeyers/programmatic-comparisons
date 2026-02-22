"use client";

type Props = {
  xName: string;
  yName: string;

  eliminated: "none" | "x" | "y";
  winner: "x" | "y" | "depends";

  answeredAny: boolean;

  // NEW: Gate 2 soft suggestion (tool name or null)
  suggested: string | null;
};

export default function ResultBar({
  xName,
  yName,
  eliminated,
  winner,
  answeredAny,
  suggested,
}: Props) {
  // If user hasn’t interacted yet, don’t pretend anything ran
  if (!answeredAny) {
    return (
      <div className="rounded-xl border border-black/10 bg-black/[0.02] p-5 space-y-2">
        <div className="text-sm uppercase tracking-wide text-black/55">
          Your next step
        </div>

        <div className="text-lg font-semibold tracking-tight">
          Run the gates to fit this decision to your situation
        </div>

        <div className="text-sm leading-6 text-black/65">
          The verdict below is the default. The gates help you override it if a
          hard requirement or your context changes the outcome.
        </div>

        <div className="text-sm leading-6 text-black/75 font-medium pt-1">
          Start with Gate 1.
        </div>
      </div>
    );
  }

  const defaultChoice = winner === "x" ? xName : winner === "y" ? yName : null;
  const hardChoice =
    eliminated === "x" ? yName : eliminated === "y" ? xName : null;

  // Priority:
  // 1) Hard elimination (Gate 1 / Gate 3)
  // 2) Soft suggestion (Gate 2)
  // 3) Default verdict
  const headline =
    hardChoice !== null
      ? `Your gate result: ${hardChoice}`
      : suggested
      ? `Recommended by Gate 2: ${suggested}`
      : defaultChoice !== null
      ? `Default verdict: ${defaultChoice}`
      : "Default verdict: it depends";

  const detail =
    hardChoice !== null
      ? "A gate eliminated one option."
      : suggested
      ? "Gate 2 recommends a default based on your situation. No option was eliminated."
      : defaultChoice !== null
      ? "This is the page verdict. Use the gates below to override it if your situation differs."
      : "This page verdict depends on a detail. Use the gates below to force a clear next step.";

  const nextAction =
    hardChoice !== null
      ? `Continue with ${hardChoice}.`
      : suggested
      ? `Try ${suggested} first, then confirm using failure modes and quick rules.`
      : defaultChoice !== null
      ? "Start by testing if either option violates a non-negotiable requirement."
      : "Start with the gates to narrow this down.";

  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.02] p-5 space-y-2">
      <div className="text-sm uppercase tracking-wide text-black/55">
        Your next step
      </div>

      <div className="text-lg font-semibold tracking-tight">{headline}</div>

      <div className="text-sm leading-6 text-black/65">{detail}</div>

<div className="text-xs text-black/50">
  Updates as you change answers.
</div>

      <div className="text-sm leading-6 text-black/75 font-medium pt-1">
        {nextAction}
      </div>
    </div>
  );
}



