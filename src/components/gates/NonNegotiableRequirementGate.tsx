"use client";

import { useMemo, useState, useEffect } from "react";

type Props = {
  xName: string;
  yName: string;
  /** optional: render style tweaks when embedded */
  variant?: "embed" | "page";

  // Optional: let the engine know an option was eliminated
  // (Note: this gate emits "X" | "Y" | "None" to match earlier usage)
  onEliminate?: (who: "X" | "Y" | "None") => void;
};

type Choice = "X" | "Y" | "Neither" | null;

export default function NonNegotiableRequirementGate({
  xName,
  yName,
  variant = "embed",
  onEliminate,
}: Props) {
  // Start unselected so we don't bias the user
  const [choice, setChoice] = useState<Choice>(null);

  const output = useMemo(() => {
    if (choice === null) {
      return [
        "Select an option to see the result.",
        "If one tool violates a hard requirement, eliminate it immediately.",
      ];
    }

    if (choice === "X") {
      return [
        `${xName} violates your non-negotiable requirement.`,
        `Eliminate ${xName} and continue evaluation with ${yName}.`,
      ];
    }

    if (choice === "Y") {
      return [
        `${yName} violates your non-negotiable requirement.`,
        `Eliminate ${yName} and continue evaluation with ${xName}.`,
      ];
    }

    // "Neither"
    return [
      `Neither tool violates your non-negotiable requirement.`,
      `Proceed to the next evaluation gate.`,
    ];
  }, [choice, xName, yName]);

  // Notify the engine only after user selection (avoid "auto" elimination on render)
  useEffect(() => {
    if (!onEliminate) return;
    if (choice === null) return;

    if (choice === "X") onEliminate("X");
    else if (choice === "Y") onEliminate("Y");
    else onEliminate("None");
  }, [choice, onEliminate]);

  return (
    <section
      className={[
        "rounded-2xl border border-black/10 bg-white",
        variant === "embed" ? "p-5" : "p-6",
        "space-y-4",
      ].join(" ")}
    >
      <div className="space-y-1">
        <div className="text-sm uppercase tracking-wide text-black/55">
          Gate 1
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          Non-Negotiable Requirement Gate
        </h2>
        <p className="text-sm leading-6 text-black/65">
          If one option violates a non-negotiable requirement, eliminate it
          immediately.
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-3">
        <div className="text-sm font-medium text-black/75">
          Does one tool violate your non-negotiable requirement?
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="nnrg"
              value="X"
              checked={choice === "X"}
              onChange={() => setChoice("X")}
            />
            <span className="text-black/80">{xName} violates it</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="nnrg"
              value="Y"
              checked={choice === "Y"}
              onChange={() => setChoice("Y")}
            />
            <span className="text-black/80">{yName} violates it</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="nnrg"
              value="Neither"
              checked={choice === "Neither"}
              onChange={() => setChoice("Neither")}
            />
            <span className="text-black/80">Neither violates it</span>
          </label>
        </div>
      </div>

      <p className="text-xs text-black/55 pt-2">
  Pick one. If a tool violates a non-negotiable, eliminate it.
</p>

    </section>
  );
}
