"use client";

import { useEffect, useMemo, useState } from "react";

type Persona =
  | "Beginner"
  | "Solo user"
  | "Student"
  | "Busy professional"
  | "Power user"
  | "Non-technical user"
  | "Minimalist";

type Props = {
  xName: string;
  yName: string;

  winner: "x" | "y" | "depends";
  decisionRule: string;

  persona: Persona;

  variant?: "embed" | "page";

  disabled?: boolean;
  lockedMessage?: string;

  // NEW: tell the engine what Gate 2 suggests
  onSuggest?: (suggested: string | null) => void;
};

type Choice = "A" | "B" | "NotSure";

function pickNames(winner: "x" | "y" | "depends", xName: string, yName: string) {
  if (winner === "x") return { preferred: xName, other: yName };
  if (winner === "y") return { preferred: yName, other: xName };
  return { preferred: xName, other: yName };
}

function personaConfig(persona: Persona) {
  switch (persona) {
    case "Student":
      return {
        gateTitle: "Lens Gate",
        helper:
          "Choose the scenario that matches your situation. You don’t need to already know the tools.",
        question: "Is this short-term use or a long-term system?",
        aLabel: "Short-term (easy to start/exit)",
        bLabel: "Long-term (durable system)",
        notSureLabel: "Not sure yet",
        aMeaning: "short",
        bMeaning: "long",
      } as const;

    case "Beginner":
      return {
        gateTitle: "Lens Gate",
        helper:
          "Answer based on your tolerance for setup. You don’t need deep tool knowledge.",
        question: "Do you want something that works with almost no setup?",
        aLabel: "Yes (minimal setup)",
        bLabel: "No (I can handle setup)",
        notSureLabel: "Not sure yet",
        aMeaning: "min_setup",
        bMeaning: "ok_setup",
      } as const;

    case "Solo user":
      return {
        gateTitle: "Lens Gate",
        helper: "Answer based on how much upkeep you can tolerate later.",
        question: "Do you want something that stays stable with minimal maintenance?",
        aLabel: "Yes (low maintenance)",
        bLabel: "No (I can manage upkeep)",
        notSureLabel: "Not sure yet",
        aMeaning: "low_maint",
        bMeaning: "ok_maint",
      } as const;

    case "Busy professional":
      return {
        gateTitle: "Lens Gate",
        helper:
          "Answer based on time pressure. Pick what fits your week, not your ideal setup.",
        question: "Do you need the fastest time-to-value right now?",
        aLabel: "Yes (fastest to start)",
        bLabel: "No (I can invest time upfront)",
        notSureLabel: "Not sure yet",
        aMeaning: "fast_now",
        bMeaning: "invest_upfront",
      } as const;

    case "Non-technical user":
      return {
        gateTitle: "Lens Gate",
        helper:
          "Answer based on what feels safer. You’re optimizing for confidence and low risk.",
        question: "Do you want the option that feels hardest to break?",
        aLabel: "Yes (safest / hardest to break)",
        bLabel: "No (I’m okay experimenting)",
        notSureLabel: "Not sure yet",
        aMeaning: "safe",
        bMeaning: "experiment",
      } as const;

    case "Minimalist":
      return {
        gateTitle: "Lens Gate",
        helper: "Answer based on feature tolerance. You’re optimizing for fewer decisions.",
        question: "Do you want the simplest option with fewer features?",
        aLabel: "Yes (simplest)",
        bLabel: "No (features are okay)",
        notSureLabel: "Not sure yet",
        aMeaning: "simple",
        bMeaning: "features_ok",
      } as const;

    case "Power user":
      return {
        gateTitle: "Lens Gate",
        helper: "Answer based on ceiling. You’re optimizing for what won’t cap out later.",
        question: "Do you expect to push advanced workflows soon?",
        aLabel: "Yes (I’ll outgrow simple tools)",
        bLabel: "No (basic is fine for now)",
        notSureLabel: "Not sure yet",
        aMeaning: "need_ceiling",
        bMeaning: "basic_ok",
      } as const;
  }
}

export default function LensScenarioGate({
  xName,
  yName,
  winner,
  decisionRule,
  persona,
  variant = "embed",
  disabled = false,
  lockedMessage,
  onSuggest,
}: Props) {
  const cfg = personaConfig(persona);
  const [choice, setChoice] = useState<Choice>("NotSure");

  const containerClass =
    variant === "embed"
      ? "rounded-2xl border border-black/10 bg-white p-6 space-y-4"
      : "rounded-2xl border border-black/10 bg-white p-6 space-y-4";

  const questionClass =
    variant === "embed"
      ? "rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-3"
      : "rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-3";

  const computed = useMemo(() => {
    // disabled = locked by a hard elimination
    if (disabled) {
      return {
        lines: [
          lockedMessage || "Decision already made by a hard requirement.",
          "Continue with the remaining option.",
        ] as const,
        suggested: null as string | null,
      };
    }

    if (winner === "depends") {
      return {
        lines: [
          "This comparison depends on a detail not captured by this question alone.",
          "Use the verdict and sections below as your default.",
        ] as const,
        suggested: null as string | null,
      };
    }

    const { preferred, other } = pickNames(winner, xName, yName);

    // default = no suggestion (stick with verdict)
    if (choice === "NotSure") {
      return {
        lines: [
          `If you’re not sure, keep the page verdict as your default: ${preferred}.`,
          "You can refine after reading failure modes and quick rules.",
        ] as const,
        suggested: null as string | null,
      };
    }

    // Student short/long
    if (cfg.aMeaning === "short" && cfg.bMeaning === "long") {
      if (choice === "A") {
        return {
          lines: [
            `For short-term use, default to ${other}.`,
            "You’re optimizing for quick start and easy exit.",
          ] as const,
          suggested: other,
        };
      }
      return {
        lines: [
          `For a long-term system, default to ${preferred}.`,
          "You’re optimizing for durability over quick setup.",
        ] as const,
        suggested: preferred,
      };
    }

    // Beginner / Busy pro: A -> other, B -> preferred
    if (cfg.aMeaning === "min_setup" || cfg.aMeaning === "fast_now") {
      if (choice === "A") {
        return {
          lines: [
            `If you need fast time-to-value, default to ${other}.`,
            "You’re optimizing for lower setup friction right now.",
          ] as const,
          suggested: other,
        };
      }
      return {
        lines: [
          `If you can invest time upfront, default to ${preferred}.`,
          "You’re optimizing for the better long-run fit.",
        ] as const,
        suggested: preferred,
      };
    }

    // Solo user: A -> preferred, B -> other
    if (cfg.aMeaning === "low_maint") {
      if (choice === "A") {
        return {
          lines: [
            `If you want minimal upkeep, default to ${preferred}.`,
            "You’re optimizing for stability without ongoing tuning.",
          ] as const,
          suggested: preferred,
        };
      }
      return {
        lines: [
          `If you can manage some upkeep, default to ${other}.`,
          "You’re allowing more maintenance in exchange for other benefits.",
        ] as const,
        suggested: other,
      };
    }

    // Non-technical: A -> preferred, B -> other
    if (cfg.aMeaning === "safe") {
      if (choice === "A") {
        return {
          lines: [
            `If you want the safest-feeling option, default to ${preferred}.`,
            "You’re optimizing for confidence and low risk of breaking things.",
          ] as const,
          suggested: preferred,
        };
      }
      return {
        lines: [
          `If you’re okay experimenting, default to ${other}.`,
          "You can tolerate some uncertainty to test fit.",
        ] as const,
        suggested: other,
      };
    }

    // Minimalist: A -> preferred, B -> other
    if (cfg.aMeaning === "simple") {
      if (choice === "A") {
        return {
          lines: [
            `If you want fewer features and fewer decisions, default to ${preferred}.`,
            "You’re optimizing for simplicity over capability.",
          ] as const,
          suggested: preferred,
        };
      }
      return {
        lines: [
          `If features are okay, default to ${other}.`,
          "You’re willing to accept complexity for extra capability.",
        ] as const,
        suggested: other,
      };
    }

    // Power user: A -> preferred, B -> other
    if (cfg.aMeaning === "need_ceiling") {
      if (choice === "A") {
        return {
          lines: [
            `If you’ll push advanced workflows, default to ${preferred}.`,
            "You’re optimizing for headroom so you don’t outgrow the tool.",
          ] as const,
          suggested: preferred,
        };
      }
      return {
        lines: [
          `If basic is fine for now, default to ${other}.`,
          "You can prioritize simplicity if you won’t hit the ceiling soon.",
        ] as const,
        suggested: other,
      };
    }

    return {
      lines: [
        `Default to the page verdict: ${preferred}.`,
        "Use the sections below to validate the decision.",
      ] as const,
      suggested: null as string | null,
    };
  }, [disabled, lockedMessage, winner, xName, yName, choice, cfg]);

  // NEW: report suggestion to engine whenever it changes (but not when disabled)
  useEffect(() => {
    if (!onSuggest) return;
    if (disabled) return;
    onSuggest(computed.suggested);
  }, [computed.suggested, onSuggest, disabled]);

  return (
    <section className={containerClass}>
      <div className="space-y-1">
        <div className="text-sm uppercase tracking-wide text-black/55">Gate 2</div>
        <h2 className="text-xl font-semibold tracking-tight">{cfg.gateTitle}</h2>
        <p className="text-sm leading-6 text-black/65">{cfg.helper}</p>
      </div>

      <div className={questionClass}>
        <div className="text-sm font-medium text-black/75">{cfg.question}</div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`lens-${persona}-${xName}-${yName}`}
              value="A"
              checked={choice === "A"}
              onChange={() => setChoice("A")}
              disabled={disabled}
            />
            <span className="text-black/80">{cfg.aLabel}</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`lens-${persona}-${xName}-${yName}`}
              value="B"
              checked={choice === "B"}
              onChange={() => setChoice("B")}
              disabled={disabled}
            />
            <span className="text-black/80">{cfg.bLabel}</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`lens-${persona}-${xName}-${yName}`}
              value="NotSure"
              checked={choice === "NotSure"}
              onChange={() => setChoice("NotSure")}
              disabled={disabled}
            />
            <span className="text-black/80">{cfg.notSureLabel}</span>
          </label>
        </div>

        <div className="pt-2 text-xs text-black/55">
          Based on the page rule:{" "}
          <span className="text-black/70">{decisionRule}</span>
        </div>

        {disabled && (
          <div className="pt-2 text-xs text-black/55">
            Locked because an earlier gate eliminated an option.
          </div>
        )}
      </div>

      <p className="text-xs text-black/55">
  This updates “Your next step” above.
</p>

    </section>
  );
}



