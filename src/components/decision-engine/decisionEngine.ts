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
  decision_surface_ids: string[];
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

export type CategoryConstraintInteraction = {
  constraint: string;
  mechanism_effect: string;
  typical_failure: string;
};

export type CategoryMechanism = {
  category: string;
  slug: string;
  sensitive_constraints: string[];
  dominant_mechanisms: string[];
  common_friction_patterns: string[];
  common_failure_patterns: string[];
  constraint_interactions: CategoryConstraintInteraction[];
  representative_decision_surfaces: string[];
  example_comparison_slugs: string[];
};

export type ToolResolutionRule = {
  id: string;
  source_comparison_slug: string;
  category: string;
  persona: string;
  mapped_constraints: string[];
  eliminated_tool: string;
  surviving_tool: string;
  failure_mechanism: string;
  failure_trigger: string;
  survival_reason: string;
  tradeoff_introduced: string;
  related_evidence_patterns: string[];
};

export type DecisionEngineData = {
  version: string;
  core_constraints: CoreConstraint[];
  derived_personas: DerivedPersona[];
  intent_map: IntentMapItem[];
  decision_surfaces: DecisionEngineSurface[];
  categories: CategoryMechanism[];
  resolution_rules: ToolResolutionRule[];
};

export type DecisionDirection = {
  survivingMechanisms: string[];
  failureMechanisms: string[];
  failurePatterns: string[];
  categoryMechanismEffects: string[];
  categoryTypicalFailures: string[];
  primaryTradeoff: string;
  constraintPressure: string;
};

export type MatchedPairwiseEvidence = {
  rule: ToolResolutionRule;
  overlapCount: number;
  originalIndex: number;
};

export type EvidenceSignalGroup = {
  tool: string;
  count: number;
  sourceComparisonSlugs: string[];
  failureTriggers: string[];
};

export type CurrentEvidenceSignal = {
  survivingTools: EvidenceSignalGroup[];
  eliminatedTools: EvidenceSignalGroup[];
};

export function getSupportedCategoryMechanisms(categories: CategoryMechanism[]) {
  const seenSlugs = new Set<string>();

  return categories.filter((category) => {
    if (seenSlugs.has(category.slug)) {
      return false;
    }

    seenSlugs.add(category.slug);
    return true;
  });
}

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

export function findMatchingPairwiseEvidence(
  rules: ToolResolutionRule[],
  mappedConstraintIds: string[],
  selectedCategory?: string | null
) {
  return rules
    .map((rule, originalIndex) => {
      const overlapCount = getOverlapCount(mappedConstraintIds, rule.mapped_constraints);
      const categoryMatches = selectedCategory
        ? rule.category === selectedCategory
        : true;

      return {
        rule,
        overlapCount,
        originalIndex,
        categoryMatches,
      };
    })
    .filter((entry) => entry.overlapCount > 0 && entry.categoryMatches)
    .sort((left, right) => {
      if (right.overlapCount !== left.overlapCount) {
        return right.overlapCount - left.overlapCount;
      }

      if (selectedCategory) {
        const leftSelectedCategoryMatch = left.rule.category === selectedCategory ? 1 : 0;
        const rightSelectedCategoryMatch = right.rule.category === selectedCategory ? 1 : 0;

        if (rightSelectedCategoryMatch !== leftSelectedCategoryMatch) {
          return rightSelectedCategoryMatch - leftSelectedCategoryMatch;
        }
      }

      return left.originalIndex - right.originalIndex;
    })
    .slice(0, 6)
    .map(({ rule, overlapCount, originalIndex }) => ({
      rule,
      overlapCount,
      originalIndex,
    })) satisfies MatchedPairwiseEvidence[];
}

export function summarizeCurrentEvidenceSignal(
  matchedEvidence: MatchedPairwiseEvidence[]
): CurrentEvidenceSignal {
  const survivingToolMap = new Map<string, EvidenceSignalGroup>();
  const eliminatedToolMap = new Map<string, EvidenceSignalGroup>();

  for (const { rule } of matchedEvidence) {
    const survivingGroup = survivingToolMap.get(rule.surviving_tool) ?? {
      tool: rule.surviving_tool,
      count: 0,
      sourceComparisonSlugs: [],
      failureTriggers: [],
    };

    survivingGroup.count += 1;
    survivingGroup.sourceComparisonSlugs = uniqueStrings([
      ...survivingGroup.sourceComparisonSlugs,
      rule.source_comparison_slug,
    ]).sort((left, right) => left.localeCompare(right));
    survivingToolMap.set(rule.surviving_tool, survivingGroup);

    const eliminatedGroup = eliminatedToolMap.get(rule.eliminated_tool) ?? {
      tool: rule.eliminated_tool,
      count: 0,
      sourceComparisonSlugs: [],
      failureTriggers: [],
    };

    eliminatedGroup.count += 1;
    eliminatedGroup.failureTriggers = uniqueStrings([
      ...eliminatedGroup.failureTriggers,
      rule.failure_trigger,
    ]).sort((left, right) => left.localeCompare(right));
    eliminatedToolMap.set(rule.eliminated_tool, eliminatedGroup);
  }

  const sortGroupsAlphabetically = (groups: Iterable<EvidenceSignalGroup>) =>
    Array.from(groups).sort((left, right) => left.tool.localeCompare(right.tool));

  return {
    survivingTools: sortGroupsAlphabetically(survivingToolMap.values()),
    eliminatedTools: sortGroupsAlphabetically(eliminatedToolMap.values()),
  };
}

export function deriveDecisionDirection(
  data: DecisionEngineData,
  selectedConstraints: CoreConstraint[],
  matchedSurfaces: DecisionEngineSurface[],
  mappedConstraintIds: string[],
  selectedCategory?: CategoryMechanism | null
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
  const matchedCategoryInteractions = selectedCategory
    ? selectedCategory.constraint_interactions.filter((interaction) =>
        mappedConstraintIds.includes(interaction.constraint)
      )
    : [];
  const prioritizedCategoryInteractions = matchedCategoryInteractions.sort(
    (left, right) =>
      mappedConstraintIds.indexOf(left.constraint) - mappedConstraintIds.indexOf(right.constraint)
  );
  const categoryMechanismEffects = uniqueStrings(
    prioritizedCategoryInteractions.map((interaction) => interaction.mechanism_effect)
  ).slice(0, 4);
  const categoryTypicalFailures = uniqueStrings(
    prioritizedCategoryInteractions.map((interaction) => interaction.typical_failure)
  ).slice(0, 4);
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

  if (selectedCategory && categoryMechanismEffects.length > 0) {
    constraintPressure = `${constraintPressure} In ${selectedCategory.category}, this pressure specifically shows up as ${joinList(
      categoryMechanismEffects.map((effect) => lowerFirst(effect).replace(/\.+$/, ""))
    )}.`.trim();
  }

  return {
    survivingMechanisms,
    failureMechanisms,
    failurePatterns,
    categoryMechanismEffects,
    categoryTypicalFailures,
    primaryTradeoff,
    constraintPressure,
  };
}
