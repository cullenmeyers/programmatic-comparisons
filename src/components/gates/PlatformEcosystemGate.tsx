"use client";

import { useEffect, useId, useMemo, useState } from "react";

type Props = {
  xName: string;
  yName: string;
  variant?: "embed" | "page";

  disabled?: boolean;
  lockedMessage?: string;

  // Optional: let the engine know an option was eliminated
  onEliminate?: (who: "x" | "y" | "none") => void;
};

type Ecosystem = "apple" | "google" | "microsoft" | "multi" | "not_sure";

function inferEcosystem(
  toolName: string
): "apple" | "google" | "microsoft" | "not_sure" {
  const t = toolName.toLowerCase();

  // Microsoft-ish
  if (
    t.includes("microsoft") ||
    t.includes("outlook") ||
    t.includes("office") ||
    t.includes("teams") ||
    t.includes("365") ||
    t.includes("onedrive")
  ) {
    return "microsoft";
  }

  // Google-ish
  if (
    t.includes("google") ||
    t.includes("gmail") ||
    t.includes("workspace") ||
    t.includes("android") ||
    t.includes("g suite")
  ) {
    return "google";
  }

  // Apple-ish
  if (
    t.includes("apple") ||
    t.includes("icloud") ||
    t.includes("mac") ||
    t.includes("ios") ||
    t.includes("ipad") ||
    t.includes("iphone")
  ) {
    return "apple";
  }

  return "not_sure";
}

export default function PlatformEcosystemGate({
  xName,
  yName,
  variant = "embed",
  disabled = false,
  lockedMessage,
  onEliminate,
}: Props) {
  const radioName = useId();

  // no prefill; user must pick
  const [eco, setEco] = useState<Ecosystem | null>(null);

  const { output, eliminated } = useMemo(() => {
    if (disabled) {
      return {
        eliminated: "none" as const,
        output: [
          lockedMessage || "Decision already made by an earlier gate.",
          "Continue with the remaining option.",
        ] as const,
      };
    }

    if (eco === null) {
      return {
        eliminated: "none" as const,
        output: [
          "Pick the ecosystem you’re already committed to.",
          "Then this gate will tell you if one option is a mismatch.",
        ] as const,
      };
    }

    // Multi ecosystem = do not eliminate
    if (eco === "multi") {
      return {
        eliminated: "none" as const,
        output: [
          "You use more than one ecosystem, so ecosystem fit won’t decide this.",
          "Proceed to the next evaluation gate.",
        ] as const,
      };
    }

    if (eco === "not_sure") {
      return {
        eliminated: "none" as const,
        output: [
          "You don’t have a strong ecosystem constraint.",
          "Proceed to the next evaluation gate.",
        ] as const,
      };
    }

    const xEco = inferEcosystem(xName);
    const yEco = inferEcosystem(yName);

    const xMatches = xEco === eco;
    const yMatches = yEco === eco;

    if (xMatches && !yMatches) {
      return {
        eliminated: "y" as const,
        output: [
          `${yName} is a weaker fit for your ${eco} ecosystem.`,
          `Eliminate ${yName} and continue with ${xName}.`,
        ] as const,
      };
    }

    if (yMatches && !xMatches) {
      return {
        eliminated: "x" as const,
        output: [
          `${xName} is a weaker fit for your ${eco} ecosystem.`,
          `Eliminate ${xName} and continue with ${yName}.`,
        ] as const,
      };
    }

    return {
      eliminated: "none" as const,
      output: [
        "Ecosystem fit does not clearly eliminate an option here.",
        "Proceed to the next evaluation gate.",
      ] as const,
    };
  }, [eco, xName, yName, disabled, lockedMessage]);

  // Only push elimination after the user selects something (eco !== null)
  useEffect(() => {
    if (!onEliminate) return;
    if (disabled) return;
    if (eco === null) return;
    onEliminate(eliminated);
  }, [eliminated, onEliminate, disabled, eco]);

  return (
    <section
      className={[
        "rounded-2xl border border-black/10 bg-white space-y-4",
        variant === "embed" ? "p-5" : "p-6",
      ].join(" ")}
    >
      <div className="space-y-1">
        <div className="text-sm uppercase tracking-wide text-black/55">
          Gate 3
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          Platform / Ecosystem Gate
        </h2>
        <p className="text-sm leading-6 text-black/65">
          If you’re strongly committed to one ecosystem, eliminate the tool that
          doesn’t fit it.
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-3">
        <div className="text-sm font-medium text-black/75">
          Which ecosystem are you already using?
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={radioName}
              value="apple"
              disabled={disabled}
              checked={eco === "apple"}
              onChange={() => setEco("apple")}
            />
            <span className="text-black/80">Apple (Mac/iPhone/iCloud)</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={radioName}
              value="google"
              disabled={disabled}
              checked={eco === "google"}
              onChange={() => setEco("google")}
            />
            <span className="text-black/80">Google (Gmail/Workspace/Android)</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={radioName}
              value="microsoft"
              disabled={disabled}
              checked={eco === "microsoft"}
              onChange={() => setEco("microsoft")}
            />
            <span className="text-black/80">Microsoft (Outlook/365/Teams)</span>
          </label>

          {/* NEW: works for Apple+Microsoft, Apple+Google, Google+Microsoft, etc */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={radioName}
              value="multi"
              disabled={disabled}
              checked={eco === "multi"}
              onChange={() => setEco("multi")}
            />
            <span className="text-black/80">I use more than one ecosystem</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={radioName}
              value="not_sure"
              disabled={disabled}
              checked={eco === "not_sure"}
              onChange={() => setEco("not_sure")}
            />
            <span className="text-black/80">Not sure / no ecosystem constraint</span>
          </label>
        </div>

        {disabled && (
          <div className="text-xs text-black/55 pt-2">
            {lockedMessage || "Locked because an earlier gate eliminated an option."}
          </div>
        )}
      </div>

      <p className="text-xs text-black/55 pt-2">
  Pick your ecosystem. If one tool clearly doesn’t fit, it will be eliminated.
</p>

    </section>
  );
}


