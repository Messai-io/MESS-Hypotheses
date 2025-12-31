/**
 * Confidence Calculation Utilities for MES Parameters
 * Provides confidence scores based on literature support, model validation, and uncertainty
 */

export interface ConfidenceFactors {
  literatureSupport: number; // Number of supporting papers
  modelValidation: number; // R² or validation score (0-1)
  parameterRange: 'optimal' | 'typical' | 'extreme'; // Where in the parameter space
  dataQuality: 'measured' | 'estimated' | 'theoretical'; // Source of data
  scaleValidation: 'lab' | 'pilot' | 'industrial' | 'none'; // Scale at which validated
  temporalStability: number; // Consistency over time (0-1)
  uncertaintyLevel: number; // Uncertainty percentage
}

export interface ConfidenceScore {
  overall: number; // 0-100
  category: 'high' | 'medium' | 'low';
  factors: ConfidenceFactors;
  explanation: string;
  recommendations: string[];
}

/**
 * Calculate confidence score for a parameter or prediction
 */
export function calculateConfidence(factors: Partial<ConfidenceFactors>): ConfidenceScore {
  const defaultFactors: ConfidenceFactors = {
    literatureSupport: 0,
    modelValidation: 0.5,
    parameterRange: 'typical',
    dataQuality: 'estimated',
    scaleValidation: 'none',
    temporalStability: 0.5,
    uncertaintyLevel: 50,
  };

  const mergedFactors = { ...defaultFactors, ...factors };

  // Weight factors for overall score
  const weights = {
    literatureSupport: 0.25,
    modelValidation: 0.2,
    parameterRange: 0.15,
    dataQuality: 0.15,
    scaleValidation: 0.1,
    temporalStability: 0.1,
    uncertaintyLevel: 0.05,
  };

  // Calculate individual scores
  const scores = {
    literatureSupport: Math.min(100, mergedFactors.literatureSupport * 5), // 20 papers = 100%
    modelValidation: mergedFactors.modelValidation * 100,
    parameterRange: {
      optimal: 100,
      typical: 75,
      extreme: 25,
    }[mergedFactors.parameterRange],
    dataQuality: {
      measured: 100,
      estimated: 60,
      theoretical: 30,
    }[mergedFactors.dataQuality],
    scaleValidation: {
      industrial: 100,
      pilot: 75,
      lab: 50,
      none: 25,
    }[mergedFactors.scaleValidation],
    temporalStability: mergedFactors.temporalStability * 100,
    uncertaintyLevel: Math.max(0, 100 - mergedFactors.uncertaintyLevel),
  };

  // Calculate weighted overall score
  const overall = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + (scores[key as keyof typeof scores] as number) * weight;
  }, 0);

  // Determine category
  const category = overall >= 70 ? 'high' : overall >= 40 ? 'medium' : 'low';

  // Generate explanation
  const explanation = generateExplanation(mergedFactors, scores, overall);

  // Generate recommendations
  const recommendations = generateRecommendations(mergedFactors, scores);

  return {
    overall: Math.round(overall),
    category,
    factors: mergedFactors,
    explanation,
    recommendations,
  };
}

/**
 * Generate human-readable explanation of confidence score
 */
function generateExplanation(
  factors: ConfidenceFactors,
  scores: Record<string, number>,
  overall: number
): string {
  const parts = [];

  if (overall >= 70) {
    parts.push('High confidence prediction');
  } else if (overall >= 40) {
    parts.push('Moderate confidence prediction');
  } else {
    parts.push('Low confidence prediction');
  }

  // Add strongest factor
  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => (b as number) - (a as number));

  const strongest = sortedScores[0];
  if (strongest && strongest[1] >= 80) {
    const factorNames: Record<string, string> = {
      literatureSupport: 'strong literature support',
      modelValidation: 'well-validated model',
      parameterRange: 'optimal parameter range',
      dataQuality: 'measured data',
      scaleValidation: 'industrial-scale validation',
      temporalStability: 'stable over time',
      uncertaintyLevel: 'low uncertainty',
    };
    parts.push(`with ${factorNames[strongest[0]]}`);
  }

  // Add weakest factor if concerning
  const weakest = sortedScores[sortedScores.length - 1];
  if (weakest && weakest[1] < 40) {
    const concernNames: Record<string, string> = {
      literatureSupport: 'limited literature',
      modelValidation: 'unvalidated model',
      parameterRange: 'extreme parameters',
      dataQuality: 'theoretical estimates',
      scaleValidation: 'no scale validation',
      temporalStability: 'unstable conditions',
      uncertaintyLevel: 'high uncertainty',
    };
    parts.push(`but ${concernNames[weakest[0]]}`);
  }

  return parts.join(' ');
}

/**
 * Generate recommendations to improve confidence
 */
function generateRecommendations(
  factors: ConfidenceFactors,
  scores: Record<string, number>
): string[] {
  const recommendations = [];

  if (scores.literatureSupport && scores.literatureSupport < 50) {
    recommendations.push('Review more literature to validate parameters');
  }

  if (scores.modelValidation && scores.modelValidation < 60) {
    recommendations.push('Validate model against experimental data');
  }

  if (factors.parameterRange === 'extreme') {
    recommendations.push('Consider using more typical parameter values');
  }

  if (factors.dataQuality === 'theoretical') {
    recommendations.push('Obtain measured data for critical parameters');
  }

  if (factors.scaleValidation === 'none' || factors.scaleValidation === 'lab') {
    recommendations.push('Validate at pilot or industrial scale');
  }

  if (scores.temporalStability && scores.temporalStability < 50) {
    recommendations.push('Monitor stability over longer time periods');
  }

  if (factors.uncertaintyLevel > 30) {
    recommendations.push('Reduce uncertainty through sensitivity analysis');
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
}

/**
 * Get confidence for specific MES parameters
 */
export function getParameterConfidence(
  parameter: string,
  value: number,
  optimalRange: [number, number]
): ConfidenceScore {
  // Check if value is within optimal range
  const inRange = value >= optimalRange[0] && value <= optimalRange[1];
  const deviation = inRange
    ? 0
    : Math.min(Math.abs(value - optimalRange[0]), Math.abs(value - optimalRange[1])) /
      (optimalRange[1] - optimalRange[0]);

  // Literature support based on parameter type
  const literatureSupport: Record<string, number> = {
    ph: 50,
    temperature: 45,
    cod: 40,
    powerDensity: 35,
    substrate: 30,
    hrt: 25,
    flowRate: 20,
  };

  return calculateConfidence({
    literatureSupport: literatureSupport[parameter] || 10,
    modelValidation: inRange ? 0.85 : Math.max(0.3, 0.85 - deviation),
    parameterRange: inRange ? 'optimal' : deviation > 0.5 ? 'extreme' : 'typical',
    dataQuality: 'measured',
    uncertaintyLevel: deviation * 50,
  });
}

/**
 * Get confidence for scale-up predictions
 */
export function getScaleUpConfidence(
  fromScale: number,
  toScale: number,
  validationData: boolean = false
): ConfidenceScore {
  const scaleRatio = toScale / fromScale;

  return calculateConfidence({
    literatureSupport: validationData ? 20 : 5,
    modelValidation: Math.max(0.3, 1 - Math.log10(scaleRatio) / 4),
    parameterRange: scaleRatio < 10 ? 'optimal' : scaleRatio < 100 ? 'typical' : 'extreme',
    dataQuality: validationData ? 'measured' : 'estimated',
    scaleValidation: scaleRatio < 10 ? 'pilot' : 'lab',
    temporalStability: 0.7,
    uncertaintyLevel: Math.min(80, scaleRatio * 2),
  });
}

/**
 * Get confidence for economic projections
 */
export function getEconomicConfidence(
  timeHorizon: number, // years
  marketVolatility: 'low' | 'medium' | 'high'
): ConfidenceScore {
  const volatilityFactor = {
    low: 0.9,
    medium: 0.7,
    high: 0.4,
  }[marketVolatility];

  return calculateConfidence({
    literatureSupport: 15,
    modelValidation: Math.max(0.3, 1 - timeHorizon / 30) * volatilityFactor,
    parameterRange: timeHorizon < 5 ? 'optimal' : timeHorizon < 15 ? 'typical' : 'extreme',
    dataQuality: 'estimated',
    scaleValidation: 'pilot',
    temporalStability: volatilityFactor,
    uncertaintyLevel: Math.min(70, timeHorizon * 5 + (1 - volatilityFactor) * 30),
  });
}

/**
 * Aggregate multiple confidence scores
 */
export function aggregateConfidence(scores: ConfidenceScore[]): ConfidenceScore {
  if (scores.length === 0) {
    return calculateConfidence({});
  }

  // Weight by individual confidence levels
  const totalWeight = scores.reduce((sum, s) => sum + s.overall, 0);
  const weightedAverage = scores.reduce((sum, s) => sum + s.overall * s.overall, 0) / totalWeight;

  // Aggregate factors
  const aggregatedFactors: Partial<ConfidenceFactors> = {
    literatureSupport: Math.max(...scores.map((s) => s.factors.literatureSupport)),
    modelValidation: scores.reduce((sum, s) => sum + s.factors.modelValidation, 0) / scores.length,
    uncertaintyLevel:
      scores.reduce((sum, s) => sum + s.factors.uncertaintyLevel, 0) / scores.length,
  };

  return {
    overall: Math.round(weightedAverage),
    category: weightedAverage >= 70 ? 'high' : weightedAverage >= 40 ? 'medium' : 'low',
    factors: { ...scores[0]?.factors, ...aggregatedFactors } as ConfidenceFactors,
    explanation: `Aggregated confidence from ${scores.length} factors`,
    recommendations: Array.from(new Set(scores.flatMap((s) => s.recommendations))).slice(0, 3),
  };
}

/**
 * Format confidence for display
 */
export function formatConfidence(score: ConfidenceScore): {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  label: string;
} {
  const formats = {
    high: {
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '✓',
      label: 'High Confidence',
    },
    medium: {
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: '!',
      label: 'Moderate Confidence',
    },
    low: {
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: '⚠',
      label: 'Low Confidence',
    },
  };

  return formats[score.category];
}
