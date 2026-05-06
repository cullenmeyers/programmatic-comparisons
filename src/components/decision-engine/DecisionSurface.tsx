"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { cx } from "@/components/ui/classnames";

type CoreConstraint = {
  id: string;
  name: string;
  definition: string;
  sensitivity: string;
  mechanism_sensitivity: string;
  friction_pattern: string;
  failure_trigger: string;
  opposite_pull: string | string[];
  user_phrases: string[];
  example_categories: string[];
  example_pages: string[];
};

type DerivedPersona = {
  persona: string;
  primary_constraints: string[];
  secondary_constraints: string[];
  dominant_failure_fear: string;
  typical_user_language: string[];
};

type IntentMapItem = {
  phrase: string;
  normalized_meaning: string;
  mapped_constraints: string[];
  failure_avoided: string;
  decision_surface: string;
};

export type DecisionEngineData = {
  version: string;
  core_constraints: CoreConstraint[];
  derived_personas: DerivedPersona[];
  intent_map: IntentMapItem[];
};

type DecisionSurfaceProps = {
  data: DecisionEngineData;
};

function formatOppositePull(value: string | string[]) {
  return Array.isArray(value) ? value.join(", ") : value;
}

export default function DecisionSurface({ data }: DecisionSurfaceProps) {
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);

  const selectedIntent =
    data.intent_map.find((item) => item.phrase === selectedPhrase) ?? null;

  const selectedConstraints = selectedIntent
    ? selectedIntent.mapped_constraints
        .map((constraintId) =>
          data.core_constraints.find((constraint) => constraint.id === constraintId)
        )
        .filter((constraint): constraint is CoreConstraint => Boolean(constraint))
    : [];

  const matchingPersonas = selectedIntent
    ? data.derived_personas.filter((persona) =>
        selectedIntent.mapped_constraints.some(
          (constraintId) =>
            persona.primary_constraints.includes(constraintId) ||
            persona.secondary_constraints.includes(constraintId)
        )
      )
    : [];

  return (
    <div className="content-stack gap-8">
      <section className="content-stack gap-4">
        <SectionHeading
          title="Intent signals"
          subtitle="Start with the constraint language users naturally reach for."
        />
        <div className="grid gap-3 md:grid-cols-2">
          {data.intent_map.map((intent) => {
            const isSelected = intent.phrase === selectedPhrase;

            return (
              <button
                key={intent.phrase}
                type="button"
                onClick={() => setSelectedPhrase(intent.phrase)}
                className={cx(
                  "rounded-xl border bg-white p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                  isSelected
                    ? "border-black bg-black text-white"
                    : "border-black/10 text-black hover:border-black/20"
                )}
              >
                <p
                  className={cx(
                    "text-sm font-medium",
                    isSelected ? "text-white" : "text-black"
                  )}
                >
                  {intent.phrase}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {!selectedIntent ? (
        <Card className="border-dashed border-black/15">
          <p className="text-sm text-black/65">
            Select a constraint to see the decision pattern.
          </p>
        </Card>
      ) : (
        <div className="content-stack gap-6">
          <section className="content-stack gap-3">
            <SectionHeading title="Selected intent" />
            <Card className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                  Phrase
                </p>
                <p className="text-base font-medium text-black">{selectedIntent.phrase}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                  Normalized meaning
                </p>
                <p className="text-sm leading-6 text-black/70">
                  {selectedIntent.normalized_meaning}
                </p>
              </div>
            </Card>
          </section>

          <section className="content-stack gap-3">
            <SectionHeading title="Core constraints" />
            <div className="grid gap-4">
              {selectedConstraints.map((constraint) => (
                <Card key={constraint.id} className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Constraint
                    </p>
                    <h3 className="text-lg font-semibold text-black">{constraint.name}</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Definition
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {constraint.definition}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Friction pattern
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {constraint.friction_pattern}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Failure trigger
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {constraint.failure_trigger}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                        Opposite pull
                      </p>
                      <p className="text-sm leading-6 text-black/70">
                        {formatOppositePull(constraint.opposite_pull)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="content-stack gap-3">
            <SectionHeading title="Decision direction" />
            <div className="grid gap-4">
              {selectedConstraints.map((constraint) => (
                <Card key={`${constraint.id}-direction`} className="space-y-3">
                  <p className="text-sm font-medium text-black">{constraint.name}</p>
                  <div className="space-y-2 text-sm leading-6 text-black/70">
                    <p>Favor tools that reduce: {constraint.friction_pattern}</p>
                    <p>Avoid tools that fail when: {constraint.failure_trigger}</p>
                    <p>
                      Watch for tradeoff: {formatOppositePull(constraint.opposite_pull)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="content-stack gap-3">
            <SectionHeading title="Matching persona bundles" />
            <div className="grid gap-4 lg:grid-cols-2">
              {matchingPersonas.map((persona) => (
                <Card key={persona.persona} className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Persona
                    </p>
                    <h3 className="text-lg font-semibold text-black">{persona.persona}</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Dominant failure fear
                    </p>
                    <p className="text-sm leading-6 text-black/70">
                      {persona.dominant_failure_fear}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                      Typical user language
                    </p>
                    <ul className="space-y-2 text-sm leading-6 text-black/70">
                      {persona.typical_user_language.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
