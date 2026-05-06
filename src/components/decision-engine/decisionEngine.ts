export type CoreConstraint = {
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

export type DerivedPersona = {
  persona: string;
  primary_constraints: string[];
  secondary_constraints: string[];
  dominant_failure_fear: string;
  typical_user_language: string[];
};

export type IntentMapItem = {
  phrase: string;
  normalized_meaning: string;
  mapped_constraints: string[];
  failure_avoided: string;
  decision_surface: string;
};

export type DecisionEngineSurface = {
  id: string;
  name: string;
  slug: string;
  core_problem: string;
  decision_question: string;
  primary_constraints: string[];
  secondary_constraints: string[];
  human_intents: string[];
  dominant_failure_pattern: string;
  decision_direction: string;
  favor_mechanisms: string[];
  avoid_mechanisms: string[];
  opposite_pull: string | string[];
  useful_personas: string[];
  example_categories: string[];
  supporting_comparison_slugs: string[];
};

export type DecisionEngineData = {
  version: string;
  core_constraints: CoreConstraint[];
  derived_personas: DerivedPersona[];
  intent_map: IntentMapItem[];
  decision_surfaces: DecisionEngineSurface[];
};

export type DecisionDirection = {
  survivingMechanisms: string[];
  failureMechanisms: string[];
  failurePatterns: string[];
  primaryTradeoff: string;
  constraintPressure: string;
};

function uniqueStrings(items: string[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

function joinList(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function lowerFirst(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toLowerCase() + value.slice(1);
}

function normalizeFrictionPattern(value: string) {
  return lowerFirst(value.trim()).replace(/\.+$/, "");
}

function getConstraintNameMap(data: DecisionEngineData) {
  return new Map(data.core_constraints.map((constraint) => [constraint.id, constraint.name]));
}

function getOverlapCount(selectedIds: string[], candidateIds: string[]) {
  return candidateIds.filter((id) => selectedIds.includes(id)).length;
}

export function findMatchingDecisionSurfaces(
  data: DecisionEngineData,
  mappedConstraintIds: string[]
) {
  return data.decision_surfaces
    .map((surface, index) => {
      const primaryMatches = getOverlapCount(
        mappedConstraintIds,
        surface.primary_constraints
      );
      const secondaryMatches = getOverlapCount(
        mappedConstraintIds,
        surface.secondary_constraints
      );

      return {
        surface,
        index,
        primaryMatches,
        secondaryMatches,
        totalMatches: primaryMatches + secondaryMatches,
      };
    })
    .filter((entry) => entry.totalMatches > 0)
    .sort((left, right) => {
      if (right.primaryMatches !== left.primaryMatches) {
        return right.primaryMatches - left.primaryMatches;
      }

      if (right.totalMatches !== left.totalMatches) {
        return right.totalMatches - left.totalMatches;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.surface);
}

export function formatOppositePull(
  value: string | string[],
  constraintNames?: Map<string, string>
) {
  const values = Array.isArray(value) ? value : [value];

  return values
    .map((entry) => constraintNames?.get(entry) ?? entry)
    .join(", ");
}

export function deriveDecisionDirection(
  data: DecisionEngineData,
  selectedConstraints: CoreConstraint[],
  matchedSurfaces: DecisionEngineSurface[]
): DecisionDirection {
  const constraintNames = getConstraintNameMap(data);
  const survivingMechanisms = uniqueStrings(
    matchedSurfaces.flatMap((surface) => surface.favor_mechanisms)
  ).slice(0, 6);
  const failureMechanisms = uniqueStrings(
    matchedSurfaces.flatMap((surface) => surface.avoid_mechanisms)
  ).slice(0, 6);
  const failurePatterns = uniqueStrings(
    matchedSurfaces.map((surface) => surface.dominant_failure_pattern)
  ).slice(0, 3);
  const tradeoffTargets = uniqueStrings(
    matchedSurfaces.flatMap((surface) =>
      Array.isArray(surface.opposite_pull)
        ? surface.opposite_pull
        : [surface.opposite_pull]
    )
  );
  const namedTradeoffs = tradeoffTargets.map(
    (tradeoff) => constraintNames.get(tradeoff) ?? tradeoff
  );
  const primaryTradeoff =
    namedTradeoffs.length > 0
      ? `This direction pulls against ${joinList(namedTradeoffs)}.`
      : "No opposing pull is defined for this direction.";
  const pressurePatterns = uniqueStrings(
    selectedConstraints
      .map((constraint) => normalizeFrictionPattern(constraint.friction_pattern))
      .filter(Boolean)
  );
  const favorSummary = survivingMechanisms.slice(0, 2);
  const avoidSummary = failureMechanisms.slice(0, 2);

  let constraintPressure = "";

  if (pressurePatterns.length === 1) {
    constraintPressure = `Pressure centers on when ${pressurePatterns[0]}.`;
  } else if (pressurePatterns.length > 1) {
    constraintPressure = `Pressure builds when ${joinList(pressurePatterns)}.`;
  }

  if (avoidSummary.length > 0 && favorSummary.length > 0) {
    constraintPressure = `${constraintPressure} This situation punishes ${joinList(
      avoidSummary
    )} and rewards ${joinList(favorSummary)}.`.trim();
  }

  return {
    survivingMechanisms,
    failureMechanisms,
    failurePatterns,
    primaryTradeoff,
    constraintPressure,
  };
}
