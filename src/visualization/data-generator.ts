/**
 * High-performance data generator for testing WebGL radial network visualization
 * Generates realistic datasets for microbial electrochemical systems research
 */

import { WebGLNetworkNode } from './WebGLRadialNetwork';

// Scientific domain knowledge for realistic data generation
const RESEARCH_DOMAINS = {
  electrochemistry: {
    topics: [
      'electrode kinetics',
      'biofilm conductivity',
      'electron transfer',
      'potential distribution',
      'overpotential',
      'current density',
      'electrochemical impedance',
      'cyclic voltammetry',
      'chronoamperometry',
      'electroactive bacteria',
      'mediator compounds',
      'direct electron transfer',
    ],
    certaintyRange: [0.6, 0.9], // High certainty in established electrochemistry
    gapProbability: 0.05,
  },
  microbiology: {
    topics: [
      'biofilm formation',
      'microbial community',
      'cell viability',
      'metabolic pathways',
      'quorum sensing',
      'extracellular polymers',
      'bacterial adhesion',
      'cell communication',
      'biofilm architecture',
      'nutrient transport',
      'pH regulation',
      'redox environment',
    ],
    certaintyRange: [0.4, 0.8], // Moderate certainty, complex biological systems
    gapProbability: 0.15,
  },
  materials: {
    topics: [
      'carbon electrodes',
      'membrane properties',
      'catalyst development',
      'surface modification',
      'porous materials',
      'conductive polymers',
      'nanostructures',
      'composite electrodes',
      'biocompatibility',
      'corrosion resistance',
      'ion exchange',
      'separator materials',
    ],
    certaintyRange: [0.5, 0.85], // Good understanding of materials science
    gapProbability: 0.1,
  },
  engineering: {
    topics: [
      'reactor design',
      'scale-up',
      'mass transfer',
      'flow dynamics',
      'heat management',
      'system optimization',
      'control systems',
      'monitoring sensors',
      'automation',
      'process efficiency',
      'energy balance',
      'hydraulic retention time',
    ],
    certaintyRange: [0.7, 0.95], // Well-established engineering principles
    gapProbability: 0.05,
  },
  environmental: {
    topics: [
      'wastewater treatment',
      'organic pollutants',
      'nutrient removal',
      'environmental impact',
      'sustainability metrics',
      'carbon footprint',
      'ecosystem effects',
      'toxicity assessment',
      'biodegradation rates',
      'environmental monitoring',
      'regulatory compliance',
      'life cycle analysis',
    ],
    certaintyRange: [0.3, 0.7], // High variability in environmental systems
    gapProbability: 0.2,
  },
  economics: {
    topics: [
      'capital costs',
      'operational expenses',
      'energy recovery',
      'economic feasibility',
      'market analysis',
      'cost-benefit analysis',
      'investment return',
      'commercialization',
      'technology adoption',
      'policy incentives',
      'competitive analysis',
      'risk assessment',
    ],
    certaintyRange: [0.2, 0.6], // High uncertainty in economic projections
    gapProbability: 0.3,
  },
} as const;

// Generate realistic node labels based on scientific terminology
function generateNodeLabel(discipline: keyof typeof RESEARCH_DOMAINS, index: number): string {
  const domain = RESEARCH_DOMAINS[discipline];
  const topic = domain.topics[Math.floor(Math.random() * domain.topics.length)];

  // Add some variation to make labels more realistic
  const prefixes = [
    'study of',
    'analysis of',
    'optimization of',
    'modeling of',
    'investigation of',
  ];
  const suffixes = ['in MFC', 'in MEC', 'in MDC', 'systems', 'performance', 'mechanisms'];

  if (Math.random() < 0.3) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix} ${topic}`;
  } else if (Math.random() < 0.3) {
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${topic} ${suffix}`;
  } else {
    return `${topic} ${index}`;
  }
}

// Generate certainty score based on domain knowledge
function generateCertainty(discipline: keyof typeof RESEARCH_DOMAINS): number {
  const domain = RESEARCH_DOMAINS[discipline];
  const [min, max] = domain.certaintyRange;
  return min + Math.random() * (max - min);
}

// Determine if a node represents a knowledge gap
function isKnowledgeGap(discipline: keyof typeof RESEARCH_DOMAINS): boolean {
  const domain = RESEARCH_DOMAINS[discipline];
  return Math.random() < domain.gapProbability;
}

// Generate realistic connections based on scientific relationships
function generateConnections(
  nodes: WebGLNetworkNode[],
  currentNode: WebGLNetworkNode,
  connectionProbability = 0.1
): string[] {
  const connections: string[] = [];
  const maxConnections = Math.floor(Math.random() * 8) + 2; // 2-10 connections

  // Higher probability of connections within same discipline
  const sameDisconectionProbability = connectionProbability * 3;

  // Cross-disciplinary connections based on research reality
  const crossDisciplinaryAffinities: Record<string, string[]> = {
    electrochemistry: ['materials', 'engineering'],
    microbiology: ['environmental', 'materials'],
    materials: ['electrochemistry', 'engineering'],
    engineering: ['electrochemistry', 'economics'],
    environmental: ['microbiology', 'economics'],
    economics: ['engineering', 'environmental'],
  };

  nodes.forEach((node) => {
    if (node.id === currentNode.id || connections.includes(node.id)) return;
    if (connections.length >= maxConnections) return;

    let probability = connectionProbability;

    // Same discipline bonus
    if (node.discipline === currentNode.discipline) {
      probability = sameDisconectionProbability;
    }

    // Cross-disciplinary affinity bonus
    const affinities = crossDisciplinaryAffinities[currentNode.discipline] || [];
    if (affinities.includes(node.discipline)) {
      probability *= 2;
    }

    if (Math.random() < probability) {
      connections.push(node.id);
    }
  });

  return connections;
}

// Generate contradictions based on research conflicts
function generateContradictions(
  nodes: WebGLNetworkNode[],
  currentNode: WebGLNetworkNode,
  contradictionProbability = 0.02
): string[] {
  const contradictions: string[] = [];

  // Contradictions more likely in uncertain areas
  const adjustedProbability = contradictionProbability * (1 - currentNode.certainty + 0.1);

  nodes.forEach((node) => {
    if (node.id === currentNode.id) return;

    // Contradictions more likely between different disciplines
    let probability = adjustedProbability;
    if (node.discipline !== currentNode.discipline) {
      probability *= 2;
    }

    if (Math.random() < probability) {
      contradictions.push(node.id);
    }
  });

  return contradictions;
}

// Main data generation function
export function generateWebGLNetworkData(nodeCount = 10000): WebGLNetworkNode[] {
  const disciplines = Object.keys(RESEARCH_DOMAINS) as Array<keyof typeof RESEARCH_DOMAINS>;
  const nodes: WebGLNetworkNode[] = [];

  // Generate nodes with realistic distribution across disciplines
  const disciplineWeights = {
    electrochemistry: 0.25, // Core discipline
    microbiology: 0.2, // Important but complex
    materials: 0.2, // Well-studied
    engineering: 0.15, // Practical applications
    environmental: 0.1, // Emerging importance
    economics: 0.1, // Limited research so far
  };

  // Create weighted discipline array for realistic distribution
  const weightedDisciplines: Array<keyof typeof RESEARCH_DOMAINS> = [];
  disciplines.forEach((discipline) => {
    const weight = disciplineWeights[discipline];
    const count = Math.floor(weight * 100);
    for (let i = 0; i < count; i++) {
      weightedDisciplines.push(discipline);
    }
  });

  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    const discipline = weightedDisciplines[Math.floor(Math.random() * weightedDisciplines.length)];
    const certainty = generateCertainty(discipline);
    const isGap = isKnowledgeGap(discipline);

    // Adjust certainty for knowledge gaps
    const finalCertainty = isGap ? Math.min(certainty * 0.3, 0.3) : certainty;

    const node: WebGLNetworkNode = {
      id: `node-${i}`,
      label: generateNodeLabel(discipline, i),
      discipline,
      certainty: finalCertainty,
      radius: isGap ? 6 + Math.random() * 4 : 3 + Math.random() * 4,
      isGap,
      connections: [], // Will be populated after all nodes are created
      contradictions: [],
    };

    nodes.push(node);
  }

  // Generate connections and contradictions
  nodes.forEach((node, index) => {
    // Only process a subset for performance during generation
    const sampleSize = Math.min(nodes.length, 2000);
    const sampleNodes = nodes.length <= sampleSize ? nodes : nodes.slice(0, sampleSize);

    node.connections = generateConnections(sampleNodes, node, 0.08);
    node.contradictions = generateContradictions(sampleNodes, node, 0.02);

    // Progress logging for large datasets
    if (index % 1000 === 0 && nodeCount > 5000) {
      console.log(`Generated connections for ${index + 1}/${nodeCount} nodes`);
    }
  });

  console.log(`Generated ${nodeCount} nodes with realistic MES research data`);
  console.log(`Knowledge gaps: ${nodes.filter((n) => n.isGap).length}`);
  console.log(`Total connections: ${nodes.reduce((sum, n) => sum + n.connections.length, 0)}`);
  console.log(
    `Total contradictions: ${nodes.reduce((sum, n) => sum + (n.contradictions?.length || 0), 0)}`
  );

  return nodes;
}

// Generate benchmark datasets for performance testing
export const BENCHMARK_DATASETS = {
  small: () => generateWebGLNetworkData(100),
  medium: () => generateWebGLNetworkData(1000),
  large: () => generateWebGLNetworkData(5000),
  massive: () => generateWebGLNetworkData(10000),
  extreme: () => generateWebGLNetworkData(25000),
};

// Performance test scenarios
export interface PerformanceScenario {
  name: string;
  nodeCount: number;
  generator: () => WebGLNetworkNode[];
  expectedFPS: number;
  targetLoadTime: number; // milliseconds
}

export const PERFORMANCE_SCENARIOS: PerformanceScenario[] = [
  {
    name: 'Baseline Performance',
    nodeCount: 100,
    generator: BENCHMARK_DATASETS.small,
    expectedFPS: 60,
    targetLoadTime: 100,
  },
  {
    name: 'Standard Visualization',
    nodeCount: 1000,
    generator: BENCHMARK_DATASETS.medium,
    expectedFPS: 60,
    targetLoadTime: 300,
  },
  {
    name: 'Large Network',
    nodeCount: 5000,
    generator: BENCHMARK_DATASETS.large,
    expectedFPS: 45,
    targetLoadTime: 800,
  },
  {
    name: 'Performance Limit',
    nodeCount: 10000,
    generator: BENCHMARK_DATASETS.massive,
    expectedFPS: 30,
    targetLoadTime: 1500,
  },
  {
    name: 'Stress Test',
    nodeCount: 25000,
    generator: BENCHMARK_DATASETS.extreme,
    expectedFPS: 20,
    targetLoadTime: 3000,
  },
];

// Data validation utilities
export function validateNetworkData(data: WebGLNetworkNode[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalNodes: number;
    knowledgeGaps: number;
    avgCertainty: number;
    totalConnections: number;
    disciplineDistribution: Record<string, number>;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  data.forEach((node, index) => {
    if (!node.id) errors.push(`Node at index ${index} missing ID`);
    if (!node.label) warnings.push(`Node ${node.id} missing label`);
    if (!node.discipline) errors.push(`Node ${node.id} missing discipline`);
    if (typeof node.certainty !== 'number')
      errors.push(`Node ${node.id} missing or invalid certainty`);
    if (!Array.isArray(node.connections)) errors.push(`Node ${node.id} missing connections array`);
  });

  // Validate connections
  data.forEach((node) => {
    node.connections.forEach((connectionId) => {
      if (!data.find((n) => n.id === connectionId)) {
        warnings.push(`Node ${node.id} has invalid connection to ${connectionId}`);
      }
    });
  });

  // Calculate statistics
  const stats = {
    totalNodes: data.length,
    knowledgeGaps: data.filter((n) => n.isGap).length,
    avgCertainty: data.reduce((sum, n) => sum + n.certainty, 0) / data.length,
    totalConnections: data.reduce((sum, n) => sum + n.connections.length, 0),
    disciplineDistribution: {} as Record<string, number>,
  };

  // Calculate discipline distribution
  data.forEach((node) => {
    stats.disciplineDistribution[node.discipline] =
      (stats.disciplineDistribution[node.discipline] || 0) + 1;
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

// Export sample data for immediate testing
export const SAMPLE_DATA = generateWebGLNetworkData(1000);
