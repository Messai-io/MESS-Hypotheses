/**
 * Gap Scoring Algorithm for Prioritizing Research Gaps
 *
 * This algorithm evaluates research gaps based on multiple factors to determine
 * their urgency and potential impact for MES research.
 */

export interface GapMetrics {
  papersInArea: number;
  yearsSinceLastPublication: number;
  contradictionCount: number;
  parameterCoverage: number; // percentage
  fundingAvailable: number; // estimated in thousands USD
  technicalDifficulty: 'low' | 'medium' | 'high' | 'extreme';
  commercialPotential: 'low' | 'medium' | 'high' | 'breakthrough';
  scientificImpact: 'incremental' | 'moderate' | 'significant' | 'breakthrough';
  requiredExpertiseCount: number;
  estimatedTimeToSolution: number; // in months
  interdisciplinaryConnections: number;
  industryRelevance: 'academic' | 'applied' | 'commercial' | 'strategic';
  regulatoryComplexity: 'simple' | 'moderate' | 'complex' | 'regulatory-intensive';
}

export interface ScoredGap {
  id: string;
  topic: string;
  urgencyScore: number;
  impactScore: number;
  feasibilityScore: number;
  totalScore: number;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string[];
  priorityRank: number;
  scoreBreakdown: {
    urgency: {
      scarcity: number;
      recency: number;
      contradictions: number;
      total: number;
    };
    impact: {
      scientific: number;
      commercial: number;
      field: number;
      total: number;
    };
    feasibility: {
      technical: number;
      resources: number;
      expertise: number;
      total: number;
    };
  };
}

const WEIGHTS = {
  urgency: 0.4, // How urgent is it to address this gap?
  impact: 0.4, // What's the potential impact of solving it?
  feasibility: 0.2, // How feasible is it to solve?
} as const;

const URGENCY_FACTORS = {
  scarcity: 0.4, // How few papers exist in this area?
  recency: 0.4, // How long since last publication?
  contradictions: 0.2, // How many contradictions exist?
} as const;

const IMPACT_FACTORS = {
  scientific: 0.4, // Scientific breakthrough potential
  commercial: 0.35, // Commercial value potential
  field: 0.25, // Impact on entire field
} as const;

const FEASIBILITY_FACTORS = {
  technical: 0.4, // Technical difficulty
  resources: 0.35, // Resource requirements
  expertise: 0.25, // Expertise availability
} as const;

/**
 * Calculate urgency score based on gap scarcity, recency, and contradictions
 */
function calculateUrgencyScore(metrics: GapMetrics): {
  score: number;
  breakdown: any;
  reasoning: string[];
} {
  const reasoning: string[] = [];

  // Scarcity Score (0-100): Fewer papers = higher urgency
  let scarcityScore = 0;
  if (metrics.papersInArea === 0) {
    scarcityScore = 100;
    reasoning.push('No papers found - completely unexplored area');
  } else if (metrics.papersInArea < 5) {
    scarcityScore = 90;
    reasoning.push(`Only ${metrics.papersInArea} papers - severely understudied`);
  } else if (metrics.papersInArea < 10) {
    scarcityScore = 75;
    reasoning.push(`${metrics.papersInArea} papers - significantly understudied`);
  } else if (metrics.papersInArea < 25) {
    scarcityScore = 50;
    reasoning.push(`${metrics.papersInArea} papers - moderately studied`);
  } else if (metrics.papersInArea < 50) {
    scarcityScore = 25;
    reasoning.push(`${metrics.papersInArea} papers - adequately studied`);
  } else {
    scarcityScore = 10;
    reasoning.push(`${metrics.papersInArea} papers - well studied area`);
  }

  // Recency Score (0-100): Longer time since last publication = higher urgency
  let recencyScore = 0;
  if (metrics.yearsSinceLastPublication >= 5) {
    recencyScore = 100;
    reasoning.push(
      `${metrics.yearsSinceLastPublication} years since last publication - field stagnant`
    );
  } else if (metrics.yearsSinceLastPublication >= 3) {
    recencyScore = 75;
    reasoning.push(
      `${metrics.yearsSinceLastPublication} years since last publication - declining interest`
    );
  } else if (metrics.yearsSinceLastPublication >= 2) {
    recencyScore = 50;
    reasoning.push(
      `${metrics.yearsSinceLastPublication} years since last publication - moderate gap`
    );
  } else if (metrics.yearsSinceLastPublication >= 1) {
    recencyScore = 25;
    reasoning.push(
      `${metrics.yearsSinceLastPublication} year since last publication - recent but not current`
    );
  } else {
    recencyScore = 10;
    reasoning.push('Recent publications exist - actively studied');
  }

  // Contradictions Score (0-100): More contradictions = higher urgency
  const contradictionsScore = Math.min(metrics.contradictionCount * 8, 100);
  if (metrics.contradictionCount > 10) {
    reasoning.push(`${metrics.contradictionCount} contradictions - field needs resolution`);
  } else if (metrics.contradictionCount > 5) {
    reasoning.push(`${metrics.contradictionCount} contradictions - significant disagreement`);
  } else if (metrics.contradictionCount > 0) {
    reasoning.push(`${metrics.contradictionCount} contradictions - some disagreement`);
  }

  const breakdown = {
    scarcity: scarcityScore,
    recency: recencyScore,
    contradictions: contradictionsScore,
    total: 0,
  };

  const totalScore =
    scarcityScore * URGENCY_FACTORS.scarcity +
    recencyScore * URGENCY_FACTORS.recency +
    contradictionsScore * URGENCY_FACTORS.contradictions;

  breakdown.total = totalScore;

  return { score: totalScore, breakdown, reasoning };
}

/**
 * Calculate impact score based on scientific, commercial, and field impact potential
 */
function calculateImpactScore(metrics: GapMetrics): {
  score: number;
  breakdown: any;
  reasoning: string[];
} {
  const reasoning: string[] = [];

  // Scientific Impact Score (0-100)
  let scientificScore = 0;
  switch (metrics.scientificImpact) {
    case 'breakthrough':
      scientificScore = 100;
      reasoning.push('Breakthrough scientific impact potential');
      break;
    case 'significant':
      scientificScore = 75;
      reasoning.push('Significant scientific impact potential');
      break;
    case 'moderate':
      scientificScore = 50;
      reasoning.push('Moderate scientific impact potential');
      break;
    case 'incremental':
      scientificScore = 25;
      reasoning.push('Incremental scientific impact potential');
      break;
  }

  // Commercial Impact Score (0-100)
  let commercialScore = 0;
  switch (metrics.commercialPotential) {
    case 'breakthrough':
      commercialScore = 100;
      reasoning.push('Revolutionary commercial potential');
      break;
    case 'high':
      commercialScore = 75;
      reasoning.push('High commercial potential');
      break;
    case 'medium':
      commercialScore = 50;
      reasoning.push('Medium commercial potential');
      break;
    case 'low':
      commercialScore = 25;
      reasoning.push('Limited commercial potential');
      break;
  }

  // Field Impact Score (0-100): Based on interdisciplinary connections and industry relevance
  let fieldScore = 0;

  // Interdisciplinary bonus
  const interdisciplinaryBonus = Math.min(metrics.interdisciplinaryConnections * 15, 40);

  // Industry relevance multiplier
  let industryMultiplier = 1.0;
  switch (metrics.industryRelevance) {
    case 'strategic':
      industryMultiplier = 1.5;
      reasoning.push('Strategic industry relevance');
      break;
    case 'commercial':
      industryMultiplier = 1.3;
      reasoning.push('Direct commercial relevance');
      break;
    case 'applied':
      industryMultiplier = 1.1;
      reasoning.push('Applied research relevance');
      break;
    case 'academic':
      industryMultiplier = 1.0;
      reasoning.push('Academic research focus');
      break;
  }

  fieldScore = (30 + interdisciplinaryBonus) * industryMultiplier;
  fieldScore = Math.min(fieldScore, 100);

  if (metrics.interdisciplinaryConnections > 3) {
    reasoning.push(
      `${metrics.interdisciplinaryConnections} interdisciplinary connections - broad impact`
    );
  }

  const breakdown = {
    scientific: scientificScore,
    commercial: commercialScore,
    field: fieldScore,
    total: 0,
  };

  const totalScore =
    scientificScore * IMPACT_FACTORS.scientific +
    commercialScore * IMPACT_FACTORS.commercial +
    fieldScore * IMPACT_FACTORS.field;

  breakdown.total = totalScore;

  return { score: totalScore, breakdown, reasoning };
}

/**
 * Calculate feasibility score based on technical difficulty, resources, and expertise
 */
function calculateFeasibilityScore(metrics: GapMetrics): {
  score: number;
  breakdown: any;
  reasoning: string[];
} {
  const reasoning: string[] = [];

  // Technical Difficulty Score (0-100): Lower difficulty = higher feasibility
  let technicalScore = 0;
  switch (metrics.technicalDifficulty) {
    case 'low':
      technicalScore = 100;
      reasoning.push('Low technical difficulty - highly feasible');
      break;
    case 'medium':
      technicalScore = 70;
      reasoning.push('Medium technical difficulty - feasible with effort');
      break;
    case 'high':
      technicalScore = 40;
      reasoning.push('High technical difficulty - challenging but possible');
      break;
    case 'extreme':
      technicalScore = 15;
      reasoning.push('Extreme technical difficulty - requires breakthrough');
      break;
  }

  // Resources Score (0-100): More funding available = higher feasibility
  let resourcesScore = 0;
  if (metrics.fundingAvailable > 1000) {
    resourcesScore = 100;
    reasoning.push(`$${metrics.fundingAvailable}k funding available - well resourced`);
  } else if (metrics.fundingAvailable > 500) {
    resourcesScore = 80;
    reasoning.push(`$${metrics.fundingAvailable}k funding available - adequately resourced`);
  } else if (metrics.fundingAvailable > 200) {
    resourcesScore = 60;
    reasoning.push(`$${metrics.fundingAvailable}k funding available - moderately resourced`);
  } else if (metrics.fundingAvailable > 50) {
    resourcesScore = 40;
    reasoning.push(`$${metrics.fundingAvailable}k funding available - limited resources`);
  } else if (metrics.fundingAvailable > 0) {
    resourcesScore = 20;
    reasoning.push(`$${metrics.fundingAvailable}k funding available - minimal resources`);
  } else {
    resourcesScore = 10;
    reasoning.push('No specific funding identified');
  }

  // Expertise Score (0-100): Fewer required expertise areas = higher feasibility
  let expertiseScore = 0;
  if (metrics.requiredExpertiseCount <= 2) {
    expertiseScore = 100;
    reasoning.push(`${metrics.requiredExpertiseCount} expertise areas required - simple team`);
  } else if (metrics.requiredExpertiseCount <= 4) {
    expertiseScore = 75;
    reasoning.push(`${metrics.requiredExpertiseCount} expertise areas required - moderate team`);
  } else if (metrics.requiredExpertiseCount <= 6) {
    expertiseScore = 50;
    reasoning.push(
      `${metrics.requiredExpertiseCount} expertise areas required - large team needed`
    );
  } else {
    expertiseScore = 25;
    reasoning.push(
      `${metrics.requiredExpertiseCount} expertise areas required - very complex team`
    );
  }

  // Time factor adjustment
  let timeAdjustment = 1.0;
  if (metrics.estimatedTimeToSolution <= 6) {
    timeAdjustment = 1.2;
    reasoning.push(`${metrics.estimatedTimeToSolution} months timeline - quick solution`);
  } else if (metrics.estimatedTimeToSolution <= 12) {
    timeAdjustment = 1.1;
    reasoning.push(`${metrics.estimatedTimeToSolution} months timeline - reasonable timeline`);
  } else if (metrics.estimatedTimeToSolution <= 24) {
    timeAdjustment = 1.0;
    reasoning.push(`${metrics.estimatedTimeToSolution} months timeline - standard timeline`);
  } else {
    timeAdjustment = 0.8;
    reasoning.push(`${metrics.estimatedTimeToSolution} months timeline - long-term project`);
  }

  // Regulatory complexity adjustment
  let regulatoryAdjustment = 1.0;
  switch (metrics.regulatoryComplexity) {
    case 'simple':
      regulatoryAdjustment = 1.1;
      reasoning.push('Simple regulatory environment');
      break;
    case 'moderate':
      regulatoryAdjustment = 1.0;
      break;
    case 'complex':
      regulatoryAdjustment = 0.9;
      reasoning.push('Complex regulatory requirements');
      break;
    case 'regulatory-intensive':
      regulatoryAdjustment = 0.7;
      reasoning.push('Intensive regulatory oversight required');
      break;
  }

  const breakdown = {
    technical: technicalScore,
    resources: resourcesScore,
    expertise: expertiseScore,
    total: 0,
  };

  let totalScore =
    technicalScore * FEASIBILITY_FACTORS.technical +
    resourcesScore * FEASIBILITY_FACTORS.resources +
    expertiseScore * FEASIBILITY_FACTORS.expertise;

  // Apply time and regulatory adjustments
  totalScore *= timeAdjustment * regulatoryAdjustment;
  totalScore = Math.min(totalScore, 100);

  breakdown.total = totalScore;

  return { score: totalScore, breakdown, reasoning };
}

/**
 * Calculate overall priority score and urgency level
 */
export function calculateGapScore(id: string, topic: string, metrics: GapMetrics): ScoredGap {
  const urgencyResult = calculateUrgencyScore(metrics);
  const impactResult = calculateImpactScore(metrics);
  const feasibilityResult = calculateFeasibilityScore(metrics);

  const totalScore =
    urgencyResult.score * WEIGHTS.urgency +
    impactResult.score * WEIGHTS.impact +
    feasibilityResult.score * WEIGHTS.feasibility;

  // Determine urgency level
  let urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  if (totalScore >= 85) {
    urgencyLevel = 'critical';
  } else if (totalScore >= 70) {
    urgencyLevel = 'high';
  } else if (totalScore >= 50) {
    urgencyLevel = 'medium';
  } else {
    urgencyLevel = 'low';
  }

  // Combine all reasoning
  const allReasoning = [
    ...urgencyResult.reasoning,
    ...impactResult.reasoning,
    ...feasibilityResult.reasoning,
  ];

  return {
    id,
    topic,
    urgencyScore: urgencyResult.score,
    impactScore: impactResult.score,
    feasibilityScore: feasibilityResult.score,
    totalScore,
    urgencyLevel,
    reasoning: allReasoning,
    priorityRank: 0, // Will be set when sorting
    scoreBreakdown: {
      urgency: urgencyResult.breakdown,
      impact: impactResult.breakdown,
      feasibility: feasibilityResult.breakdown,
    },
  };
}

/**
 * Score and rank multiple gaps
 */
export function scoreAndRankGaps(
  gaps: Array<{ id: string; topic: string; metrics: GapMetrics }>
): ScoredGap[] {
  // Calculate scores for all gaps
  const scoredGaps = gaps.map((gap) => calculateGapScore(gap.id, gap.topic, gap.metrics));

  // Sort by total score (descending)
  scoredGaps.sort((a, b) => b.totalScore - a.totalScore);

  // Assign priority ranks
  scoredGaps.forEach((gap, index) => {
    gap.priorityRank = index + 1;
  });

  return scoredGaps;
}

/**
 * Get gaps filtered by urgency level
 */
export function getGapsByUrgency(
  scoredGaps: ScoredGap[],
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
): ScoredGap[] {
  return scoredGaps.filter((gap) => gap.urgencyLevel === urgencyLevel);
}

/**
 * Get top N priority gaps
 */
export function getTopPriorityGaps(scoredGaps: ScoredGap[], count: number): ScoredGap[] {
  return scoredGaps.slice(0, count);
}

/**
 * Generate detailed analysis report for a gap
 */
export function generateGapAnalysisReport(gap: ScoredGap): string {
  const report = [
    `# Research Gap Analysis: ${gap.topic}`,
    ``,
    `**Priority Rank:** #${gap.priorityRank}`,
    `**Overall Score:** ${gap.totalScore.toFixed(1)}/100`,
    `**Urgency Level:** ${gap.urgencyLevel.toUpperCase()}`,
    ``,
    `## Score Breakdown`,
    `- **Urgency:** ${gap.urgencyScore.toFixed(1)}/100 (Weight: ${(WEIGHTS.urgency * 100).toFixed(
      0
    )}%)`,
    `- **Impact:** ${gap.impactScore.toFixed(1)}/100 (Weight: ${(WEIGHTS.impact * 100).toFixed(
      0
    )}%)`,
    `- **Feasibility:** ${gap.feasibilityScore.toFixed(1)}/100 (Weight: ${(
      WEIGHTS.feasibility * 100
    ).toFixed(0)}%)`,
    ``,
    `## Detailed Analysis`,
    ``,
    `### Urgency Factors`,
    `- Scarcity: ${gap.scoreBreakdown.urgency.scarcity.toFixed(1)}/100`,
    `- Recency: ${gap.scoreBreakdown.urgency.recency.toFixed(1)}/100`,
    `- Contradictions: ${gap.scoreBreakdown.urgency.contradictions.toFixed(1)}/100`,
    ``,
    `### Impact Potential`,
    `- Scientific: ${gap.scoreBreakdown.impact.scientific.toFixed(1)}/100`,
    `- Commercial: ${gap.scoreBreakdown.impact.commercial.toFixed(1)}/100`,
    `- Field-wide: ${gap.scoreBreakdown.impact.field.toFixed(1)}/100`,
    ``,
    `### Feasibility Assessment`,
    `- Technical: ${gap.scoreBreakdown.feasibility.technical.toFixed(1)}/100`,
    `- Resources: ${gap.scoreBreakdown.feasibility.resources.toFixed(1)}/100`,
    `- Expertise: ${gap.scoreBreakdown.feasibility.expertise.toFixed(1)}/100`,
    ``,
    `## Key Insights`,
    ...gap.reasoning.map((reason) => `- ${reason}`),
    ``,
    `---`,
    `*Analysis generated by MESSAI Gap Scoring Algorithm*`,
  ];

  return report.join('\n');
}

/**
 * Example usage and testing
 */
export function getExampleGapMetrics(): GapMetrics {
  return {
    papersInArea: 5,
    yearsSinceLastPublication: 2,
    contradictionCount: 8,
    parameterCoverage: 25,
    fundingAvailable: 750,
    technicalDifficulty: 'high',
    commercialPotential: 'breakthrough',
    scientificImpact: 'significant',
    requiredExpertiseCount: 4,
    estimatedTimeToSolution: 18,
    interdisciplinaryConnections: 3,
    industryRelevance: 'commercial',
    regulatoryComplexity: 'moderate',
  };
}
