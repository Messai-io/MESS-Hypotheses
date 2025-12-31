'use client';

/**
 * Scientific Data Types for MES Knowledge Gap Visualization
 * Enhanced with domain-specific categories and accurate representations
 */

// MES-specific discipline categories based on research literature
export type MESDiscipline =
  | 'bioelectrochemistry' // Core electrochemical-biological interfaces
  | 'electron_transfer' // Extracellular electron transfer mechanisms
  | 'electrode_materials' // Anode/cathode materials and modifications
  | 'reactor_design' // System engineering and architecture
  | 'microbial_communities' // Community structure and dynamics
  | 'environmental_systems' // Wastewater treatment and environmental applications
  | 'system_control' // Process control and monitoring
  | 'techno_economics'; // Economic analysis and life cycle assessment

// Application-specific MES technology types
export type MESApplication = 'MFC' | 'MEC' | 'MDC' | 'MRC' | 'BES' | 'hybrid';

// Research scale categories
export type ResearchScale = 'laboratory' | 'pilot' | 'demonstration' | 'commercial';

// Evidence quality and certainty levels
export type EvidenceLevel =
  | 'experimental'
  | 'theoretical'
  | 'computational'
  | 'speculative'
  | 'review';
export type StudyQuality = 'high' | 'medium' | 'low';
export type DataSource =
  | 'direct_measurement'
  | 'modeling'
  | 'literature_review'
  | 'expert_opinion'
  | 'database';

// Scientific certainty with confidence intervals
export interface ScientificCertainty {
  evidenceLevel: EvidenceLevel;
  studyQuality: StudyQuality;
  dataSource: DataSource;
  replicationCount: number;
  confidenceInterval?: [number, number];
  peerReviewed: boolean;
  citationCount?: number;
  yearPublished?: number;
}

// Enhanced research relationship types
export type ResearchRelationship =
  | 'supports' // Studies support each other's findings
  | 'contradicts' // Direct conflicts requiring resolution
  | 'complements' // Different approaches to same problem
  | 'builds_upon' // Sequential research building on previous work
  | 'synergistic' // Studies that enhance each other when combined
  | 'methodological' // Different experimental/modeling approaches
  | 'scale_dependent' // Relationships that change with scale
  | 'conditions_dependent'; // Results depend on specific conditions

// Enhanced network node for MES research
export interface MESKnowledgeNode {
  id: string;
  label: string;

  // Scientific classification
  discipline: MESDiscipline;
  subDisciplines?: MESDiscipline[];
  application?: MESApplication;
  scale: ResearchScale;

  // Knowledge certainty and quality
  certainty: ScientificCertainty;
  overallCertaintyScore: number; // 0-1 computed from certainty factors
  isKnowledgeGap: boolean;
  gapType?: 'methodological' | 'theoretical' | 'experimental' | 'technological' | 'economic';

  // Research metadata
  topicKeywords: string[];
  researchQuestion?: string;
  findings?: string;
  limitations?: string;
  futureWork?: string;

  // Network relationships
  connections: string[];
  relationships: Array<{
    targetId: string;
    type: ResearchRelationship;
    strength: number; // 0-1 confidence in relationship
    evidence?: string;
  }>;

  // Visualization properties
  position?: { x: number; y: number; z?: number };
  radius?: number;
  color?: string;
  opacity?: number;
  visible?: boolean;
  lodLevel?: number;
}

// Scientifically accurate color mappings for MES disciplines
export const MES_DISCIPLINE_COLORS = {
  bioelectrochemistry: '#bfdbfe', // Light blue - electron-rich anoxic conditions
  electron_transfer: '#fed7aa', // Light orange - energy transfer processes
  electrode_materials: '#e5e7eb', // Light gray - typical electrode materials
  reactor_design: '#d1d5db', // Steel gray - engineered systems
  microbial_communities: '#bbf7d0', // Light green - active biomass
  environmental_systems: '#dbeafe', // Light blue - environmental applications
  system_control: '#e9d5ff', // Light purple - sensors and control systems
  techno_economics: '#fef3c7', // Light yellow - economic value and analysis
} as const;

// Process-based gradient colors for visual effects
export const ELECTROCHEMICAL_GRADIENTS = {
  // Anodic to cathodic gradient (reducing to oxidizing)
  anodic_cathodic: ['#001a3d', '#0ea5e9', '#22c55e'],

  // pH gradient (acidic to basic)
  ph_gradient: ['#ef4444', '#f59e0b', '#22c55e', '#0ea5e9'],

  // Redox potential gradient (reduced to oxidized)
  redox_gradient: ['#1f2937', '#6b7280', '#d1d5db', '#f3f4f6'],

  // Biofilm maturity (young to mature)
  biofilm_maturity: ['#dcfce7', '#86efac', '#22c55e', '#15803d'],

  // Electron flow intensity
  electron_flow: ['#fbbf24', '#f59e0b', '#d97706', '#92400e'],
} as const;

// Visual metaphor configurations for different MES processes
export interface ProcessVisualization {
  discipline: MESDiscipline;
  primaryColor: string;
  gradientColors: string[];
  nodeShape: 'circle' | 'hexagon' | 'square' | 'diamond';
  texturePattern?: 'biofilm' | 'crystalline' | 'porous' | 'smooth';
  animationType?: 'pulse' | 'flow' | 'growth' | 'oscillation';
  particleEffect?: 'electrons' | 'ions' | 'bubbles' | 'organic_matter';
}

// Predefined visual metaphors for each MES discipline
export const MES_VISUAL_METAPHORS: Record<MESDiscipline, ProcessVisualization> = {
  bioelectrochemistry: {
    discipline: 'bioelectrochemistry',
    primaryColor: MES_DISCIPLINE_COLORS.bioelectrochemistry,
    gradientColors: ELECTROCHEMICAL_GRADIENTS.redox_gradient,
    nodeShape: 'circle',
    texturePattern: 'smooth',
    animationType: 'oscillation',
    particleEffect: 'electrons',
  },
  electron_transfer: {
    discipline: 'electron_transfer',
    primaryColor: MES_DISCIPLINE_COLORS.electron_transfer,
    gradientColors: ELECTROCHEMICAL_GRADIENTS.electron_flow,
    nodeShape: 'diamond',
    texturePattern: 'crystalline',
    animationType: 'flow',
    particleEffect: 'electrons',
  },
  electrode_materials: {
    discipline: 'electrode_materials',
    primaryColor: MES_DISCIPLINE_COLORS.electrode_materials,
    gradientColors: ['#1f2937', '#374151', '#6b7280'],
    nodeShape: 'square',
    texturePattern: 'porous',
    animationType: 'pulse',
    particleEffect: 'ions',
  },
  reactor_design: {
    discipline: 'reactor_design',
    primaryColor: MES_DISCIPLINE_COLORS.reactor_design,
    gradientColors: ['#374151', '#6b7280', '#9ca3af'],
    nodeShape: 'square',
    texturePattern: 'smooth',
    animationType: 'pulse',
    particleEffect: 'bubbles',
  },
  microbial_communities: {
    discipline: 'microbial_communities',
    primaryColor: MES_DISCIPLINE_COLORS.microbial_communities,
    gradientColors: ELECTROCHEMICAL_GRADIENTS.biofilm_maturity,
    nodeShape: 'hexagon',
    texturePattern: 'biofilm',
    animationType: 'growth',
    particleEffect: 'organic_matter',
  },
  environmental_systems: {
    discipline: 'environmental_systems',
    primaryColor: MES_DISCIPLINE_COLORS.environmental_systems,
    gradientColors: ELECTROCHEMICAL_GRADIENTS.ph_gradient,
    nodeShape: 'circle',
    texturePattern: 'smooth',
    animationType: 'flow',
    particleEffect: 'bubbles',
  },
  system_control: {
    discipline: 'system_control',
    primaryColor: MES_DISCIPLINE_COLORS.system_control,
    gradientColors: ['#6b46c1', '#8b5cf6', '#a78bfa'],
    nodeShape: 'diamond',
    texturePattern: 'crystalline',
    animationType: 'oscillation',
    particleEffect: 'electrons',
  },
  techno_economics: {
    discipline: 'techno_economics',
    primaryColor: MES_DISCIPLINE_COLORS.techno_economics,
    gradientColors: ['#d97706', '#f59e0b', '#fbbf24'],
    nodeShape: 'circle',
    texturePattern: 'smooth',
    animationType: 'pulse',
    particleEffect: 'bubbles',
  },
};

// Enhanced certainty calculation based on multiple scientific factors
export function calculateScientificCertainty(certainty: ScientificCertainty): number {
  let score = 0.5; // Base uncertainty

  // Evidence level weighting
  const evidenceWeights = {
    experimental: 0.4,
    theoretical: 0.3,
    computational: 0.25,
    speculative: 0.1,
    review: 0.35,
  };
  score += evidenceWeights[certainty.evidenceLevel];

  // Study quality adjustment
  const qualityMultipliers = {
    high: 1.2,
    medium: 1.0,
    low: 0.8,
  };
  score *= qualityMultipliers[certainty.studyQuality];

  // Data source reliability
  const sourceWeights = {
    direct_measurement: 0.2,
    modeling: 0.15,
    literature_review: 0.1,
    expert_opinion: 0.05,
    database: 0.1,
  };
  score += sourceWeights[certainty.dataSource];

  // Replication bonus (diminishing returns)
  const replicationBonus = Math.min(certainty.replicationCount * 0.05, 0.15);
  score += replicationBonus;

  // Peer review bonus
  if (certainty.peerReviewed) {
    score += 0.1;
  }

  // Citation impact (if available)
  if (certainty.citationCount) {
    const citationBonus = Math.min(Math.log10(certainty.citationCount + 1) * 0.02, 0.1);
    score += citationBonus;
  }

  // Recency factor (newer research gets slight penalty for lack of validation)
  if (certainty.yearPublished) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - certainty.yearPublished;
    if (age < 2) {
      score *= 0.95; // Slight penalty for very recent work
    } else if (age > 10) {
      score *= 0.9; // Slight penalty for older work without recent validation
    }
  }

  // Normalize to 0-1 range
  return Math.max(0, Math.min(1, score));
}

// Generate scientifically accurate radial position based on certainty and discipline
export function calculateRadialPosition(
  node: MESKnowledgeNode,
  maxRadius: number,
  disciplineIndex: number,
  totalDisciplines: number
): { x: number; y: number; angle: number; radius: number } {
  // Angular position based on discipline
  const baseAngle = (disciplineIndex * 2 * Math.PI) / totalDisciplines;

  // Add some randomization within sector (±30% of sector width)
  const sectorWidth = (2 * Math.PI) / totalDisciplines;
  const angleVariation = (Math.random() - 0.5) * sectorWidth * 0.6;
  const angle = baseAngle + angleVariation;

  // Radial position based on certainty (center = high certainty, edge = gaps)
  let radialPosition: number;

  if (node.isKnowledgeGap) {
    // Knowledge gaps go to the outer edge
    radialPosition = 0.8 + Math.random() * 0.2; // 80-100% of max radius
  } else {
    // Regular research positioned by certainty
    const certaintyScore = node.overallCertaintyScore;

    // Non-linear mapping: high certainty clusters toward center
    radialPosition = Math.pow(1 - certaintyScore, 1.5);

    // Ensure minimum distance from center for visibility
    radialPosition = Math.max(0.15, radialPosition);

    // Scale adjustment based on research scale
    const scaleAdjustments = {
      laboratory: 0.0, // Lab scale can be anywhere
      pilot: 0.1, // Pilot scale slightly outward
      demonstration: 0.15, // Demo scale more outward
      commercial: 0.2, // Commercial scale toward edge (less common)
    };
    radialPosition += scaleAdjustments[node.scale] || 0;
  }

  const radius = radialPosition * maxRadius;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    angle,
    radius,
  };
}

// Type guards and validation functions
export function isMESKnowledgeNode(node: any): node is MESKnowledgeNode {
  return (
    typeof node.id === 'string' &&
    typeof node.discipline === 'string' &&
    node.discipline in MES_DISCIPLINE_COLORS &&
    typeof node.certainty === 'object' &&
    typeof node.overallCertaintyScore === 'number'
  );
}

export function validateMESData(nodes: MESKnowledgeNode[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  nodes.forEach((node, index) => {
    if (!isMESKnowledgeNode(node)) {
      errors.push(`Node ${index} (${node.id}) is not a valid MESKnowledgeNode`);
      return;
    }

    // Check certainty score consistency
    const calculatedScore = calculateScientificCertainty(node.certainty);
    const scoreDifference = Math.abs(calculatedScore - node.overallCertaintyScore);

    if (scoreDifference > 0.1) {
      warnings.push(
        `Node ${node.id}: Certainty score mismatch. ` +
          `Calculated: ${calculatedScore.toFixed(3)}, ` +
          `Provided: ${node.overallCertaintyScore.toFixed(3)}`
      );
    }

    // Check for missing critical fields
    if (!node.topicKeywords || node.topicKeywords.length === 0) {
      warnings.push(`Node ${node.id}: Missing topic keywords`);
    }

    // Validate relationship targets exist
    node.relationships.forEach((rel) => {
      const targetExists = nodes.some((n) => n.id === rel.targetId);
      if (!targetExists) {
        errors.push(`Node ${node.id}: Relationship target ${rel.targetId} not found`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
