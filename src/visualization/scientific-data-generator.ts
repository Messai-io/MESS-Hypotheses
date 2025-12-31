// Removed 'use client' directive to avoid chunk loading issues with dynamic imports

import {
  MESKnowledgeNode,
  MESDiscipline,
  MESApplication,
  ResearchScale,
  EvidenceLevel,
  StudyQuality,
  DataSource,
  ResearchRelationship,
  ScientificCertainty,
  calculateScientificCertainty,
  calculateRadialPosition,
  MES_DISCIPLINE_COLORS,
} from './scientific-data-types';

/**
 * Scientific Data Generator for MES Knowledge Gap Visualization
 * Generates realistic research nodes with proper scientific relationships
 */

// Realistic MES research topics by discipline
const MES_RESEARCH_TOPICS = {
  bioelectrochemistry: [
    'extracellular electron transfer mechanisms',
    'biofilm conductivity enhancement',
    'redox mediator optimization',
    'electrode-biofilm interface characterization',
    'cytochrome expression in electroactive bacteria',
    'nanowire-mediated electron transport',
    'bioelectrochemical impedance analysis',
    'pH effects on electron transfer rates',
  ],
  electron_transfer: [
    'direct vs mediated electron transfer',
    'pili conductance measurements',
    'flavin-mediated electron shuttling',
    'multi-heme cytochrome pathways',
    'electron transfer kinetics modeling',
    'biofilm electron transport networks',
    'quinone redox cycling',
    'long-range electron transport',
  ],
  electrode_materials: [
    'carbon brush anode optimization',
    'stainless steel cathode performance',
    'graphite felt modifications',
    'conductive polymer coatings',
    'metal oxide nanoparticle integration',
    'biocompatible electrode surfaces',
    'electrode fouling prevention',
    'high surface area electrode design',
  ],
  reactor_design: [
    'single chamber vs dual chamber design',
    'membrane selection and optimization',
    'flow dynamics and mixing',
    'scale-up challenges and solutions',
    'modular reactor configurations',
    'continuous vs batch operation',
    'temperature control strategies',
    'gas management systems',
  ],
  microbial_communities: [
    'Geobacter species dominance',
    'Shewanella biofilm formation',
    'syntrophic microbial interactions',
    'community structure-function relationships',
    'metagenomic analysis of electroactive biofilms',
    'biofilm maturation dynamics',
    'species competition and cooperation',
    'environmental selection pressures',
  ],
  environmental_systems: [
    'wastewater treatment applications',
    'brewery wastewater processing',
    'pharmaceutical wastewater treatment',
    'agricultural runoff management',
    'heavy metal removal',
    'nutrient recovery systems',
    'carbon dioxide reduction',
    'desalination applications',
  ],
  system_control: [
    'real-time monitoring systems',
    'automated pH control',
    'current density optimization',
    'temperature regulation',
    'substrate feeding strategies',
    'power management systems',
    'sensor integration and IoT',
    'predictive maintenance algorithms',
  ],
  techno_economics: [
    'lifecycle cost analysis',
    'energy return on investment',
    'capital expenditure optimization',
    'operational cost reduction',
    'market penetration strategies',
    'techno-economic feasibility',
    'environmental impact assessment',
    'commercialization pathways',
  ],
} as const;

// Realistic knowledge gaps in MES research
const MES_KNOWLEDGE_GAPS = {
  bioelectrochemistry: [
    'electron transfer mechanism variability across species',
    'biofilm conductivity prediction models',
    'long-term biofilm stability factors',
    'temperature effects on electron transfer kinetics',
  ],
  electron_transfer: [
    'quantitative pili conductance measurements',
    'electron transfer rate limiting steps',
    'biofilm electrical network topology',
    'electron transfer efficiency optimization',
  ],
  electrode_materials: [
    'electrode material lifetime prediction',
    'biocompatibility screening methods',
    'cost-effective electrode fabrication',
    'electrode regeneration strategies',
  ],
  reactor_design: [
    'optimal reactor geometry for scale-up',
    'membrane fouling prediction models',
    'energy-efficient mixing strategies',
    'modular system interconnection',
  ],
  microbial_communities: [
    'biofilm community succession prediction',
    'species interaction network modeling',
    'environmental adaptation mechanisms',
    'biofilm resilience to perturbations',
  ],
  environmental_systems: [
    'real-world performance prediction',
    'seasonal variation impacts',
    'contaminant removal efficiency models',
    'system integration with existing infrastructure',
  ],
  system_control: [
    'optimal control algorithm development',
    'sensor drift compensation methods',
    'fault detection and diagnosis',
    'autonomous operation strategies',
  ],
  techno_economics: [
    'accurate long-term cost projections',
    'market adoption rate modeling',
    'environmental benefit quantification',
    'policy impact on commercialization',
  ],
} as const;

// Generate realistic scientific certainty data
function generateScientificCertainty(
  discipline: MESDiscipline,
  isGap: boolean = false
): ScientificCertainty {
  if (isGap) {
    return {
      evidenceLevel: 'speculative',
      studyQuality: 'low',
      dataSource: 'expert_opinion',
      replicationCount: 0,
      peerReviewed: false,
      confidenceInterval: [0.0, 0.2],
    };
  }

  // Different disciplines have different typical evidence characteristics
  const disciplineProfiles = {
    bioelectrochemistry: { experimental: 0.6, theoretical: 0.3, computational: 0.1 },
    electron_transfer: { experimental: 0.7, theoretical: 0.2, computational: 0.1 },
    electrode_materials: { experimental: 0.8, theoretical: 0.1, computational: 0.1 },
    reactor_design: { experimental: 0.5, theoretical: 0.3, computational: 0.2 },
    microbial_communities: { experimental: 0.6, theoretical: 0.2, computational: 0.2 },
    environmental_systems: { experimental: 0.7, theoretical: 0.2, computational: 0.1 },
    system_control: { experimental: 0.4, theoretical: 0.3, computational: 0.3 },
    techno_economics: { experimental: 0.2, theoretical: 0.6, computational: 0.2 },
  };

  const profile = disciplineProfiles[discipline];
  const rand = Math.random();

  let evidenceLevel: EvidenceLevel;
  if (rand < profile.experimental) {
    evidenceLevel = 'experimental';
  } else if (rand < profile.experimental + profile.computational) {
    evidenceLevel = 'computational';
  } else {
    evidenceLevel = 'theoretical';
  }

  const studyQuality: StudyQuality =
    Math.random() < 0.3 ? 'high' : Math.random() < 0.6 ? 'medium' : 'low';

  const dataSource: DataSource =
    evidenceLevel === 'experimental'
      ? Math.random() < 0.8
        ? 'direct_measurement'
        : 'database'
      : evidenceLevel === 'computational'
      ? 'modeling'
      : 'literature_review';

  return {
    evidenceLevel,
    studyQuality,
    dataSource,
    replicationCount: Math.floor(Math.random() * 8),
    peerReviewed: Math.random() < 0.85, // 85% peer reviewed
    citationCount: Math.floor(Math.random() * 200),
    yearPublished: 2015 + Math.floor(Math.random() * 9), // 2015-2023
    confidenceInterval: evidenceLevel === 'experimental' ? [0.7, 0.95] : [0.4, 0.8],
  };
}

// Generate realistic research relationships
function generateResearchRelationships(
  currentNode: MESKnowledgeNode,
  allNodes: MESKnowledgeNode[]
): MESKnowledgeNode['relationships'] {
  const relationships: MESKnowledgeNode['relationships'] = [];

  // More likely to connect to nodes in same or related disciplines
  const relatedDisciplines = {
    bioelectrochemistry: ['electron_transfer', 'microbial_communities'],
    electron_transfer: ['bioelectrochemistry', 'electrode_materials'],
    electrode_materials: ['bioelectrochemistry', 'reactor_design'],
    reactor_design: ['system_control', 'environmental_systems'],
    microbial_communities: ['bioelectrochemistry', 'environmental_systems'],
    environmental_systems: ['reactor_design', 'techno_economics'],
    system_control: ['reactor_design', 'techno_economics'],
    techno_economics: ['environmental_systems', 'system_control'],
  };

  const candidateNodes = allNodes.filter((node) => {
    if (node.id === currentNode.id) return false;

    // Higher probability for same/related disciplines
    if (node.discipline === currentNode.discipline) return Math.random() < 0.3;
    if (relatedDisciplines[currentNode.discipline]?.includes(node.discipline)) {
      return Math.random() < 0.2;
    }
    return Math.random() < 0.05; // Low probability for unrelated disciplines
  });

  // Generate 1-5 relationships per node
  const numRelationships = 1 + Math.floor(Math.random() * 4);
  const selectedNodes = candidateNodes
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(numRelationships, candidateNodes.length));

  selectedNodes.forEach((targetNode) => {
    // Determine relationship type based on disciplines and certainty
    let relationshipType: ResearchRelationship;
    const certaintyDiff = Math.abs(
      currentNode.overallCertaintyScore - targetNode.overallCertaintyScore
    );

    if (currentNode.discipline === targetNode.discipline) {
      // Same discipline relationships
      if (certaintyDiff < 0.2) {
        relationshipType = Math.random() < 0.4 ? 'supports' : 'complements';
      } else if (Math.random() < 0.1) {
        relationshipType = 'contradicts';
      } else {
        relationshipType = 'builds_upon';
      }
    } else if (relatedDisciplines[currentNode.discipline]?.includes(targetNode.discipline)) {
      // Related discipline relationships
      relationshipType = Math.random() < 0.5 ? 'synergistic' : 'complements';
    } else {
      // Cross-discipline relationships
      relationshipType = Math.random() < 0.3 ? 'methodological' : 'conditions_dependent';
    }

    // Relationship strength based on certainty and type
    let strength = 0.5;
    if (relationshipType === 'supports' || relationshipType === 'synergistic') {
      strength = 0.6 + Math.random() * 0.4;
    } else if (relationshipType === 'contradicts') {
      strength = 0.7 + Math.random() * 0.3;
    } else {
      strength = 0.3 + Math.random() * 0.4;
    }

    relationships.push({
      targetId: targetNode.id,
      type: relationshipType,
      strength,
      evidence: `Based on ${relationshipType} findings in ${currentNode.discipline} and ${targetNode.discipline} research`,
    });
  });

  return relationships;
}

// Generate a single realistic MES research node
function generateMESNode(
  id: string,
  discipline: MESDiscipline,
  isGap: boolean = false
): Omit<MESKnowledgeNode, 'relationships'> {
  const topics = isGap ? MES_KNOWLEDGE_GAPS[discipline] : MES_RESEARCH_TOPICS[discipline];

  const topic = topics[Math.floor(Math.random() * topics.length)];

  const scales: ResearchScale[] = ['laboratory', 'pilot', 'demonstration', 'commercial'];
  const scaleWeights = [0.6, 0.25, 0.1, 0.05]; // Most research is lab scale
  const scale = scales[scaleWeights.findIndex((w) => Math.random() < w)] || 'laboratory';

  const applications: MESApplication[] = ['MFC', 'MEC', 'MDC', 'MRC', 'BES', 'hybrid'];
  const application = applications[Math.floor(Math.random() * applications.length)];

  const certainty = generateScientificCertainty(discipline, isGap);
  const overallCertaintyScore = calculateScientificCertainty(certainty);

  // Generate realistic topic keywords
  const topicKeywords = [
    ...topic.split(' ').filter((word) => word.length > 3),
    discipline.replace('_', ' '),
    application,
    scale,
  ];

  return {
    id,
    label: topic.charAt(0).toUpperCase() + topic.slice(1),
    discipline,
    application,
    scale,
    certainty,
    overallCertaintyScore,
    isKnowledgeGap: isGap,
    gapType: isGap
      ? (['methodological', 'theoretical', 'experimental', 'technological', 'economic'][
          Math.floor(Math.random() * 5)
        ] as any)
      : undefined,
    topicKeywords,
    researchQuestion: isGap
      ? `How can we address the knowledge gap in ${topic}?`
      : `What factors influence ${topic} in ${application} systems?`,
    findings: isGap ? undefined : `Preliminary findings on ${topic} effectiveness`,
    limitations: isGap ? `Limited understanding of ${topic}` : `Study limited to ${scale} scale`,
    futureWork: `Further investigation needed in ${topic} applications`,
    connections: [], // Will be populated after all nodes are created
    radius: 3 + Math.random() * 5,
    opacity: isGap ? 0.6 : 0.9,
    visible: true,
    lodLevel: 0,
  };
}

// Generate a complete scientific dataset
export function generateScientificMESData(nodeCount: number): MESKnowledgeNode[] {
  const disciplines: MESDiscipline[] = [
    'bioelectrochemistry',
    'electron_transfer',
    'electrode_materials',
    'reactor_design',
    'microbial_communities',
    'environmental_systems',
    'system_control',
    'techno_economics',
  ];

  // Realistic distribution of research across disciplines (based on literature)
  const disciplineWeights = {
    bioelectrochemistry: 0.18,
    microbial_communities: 0.16,
    electrode_materials: 0.15,
    reactor_design: 0.14,
    environmental_systems: 0.12,
    electron_transfer: 0.1,
    system_control: 0.08,
    techno_economics: 0.07,
  };

  const nodes: Omit<MESKnowledgeNode, 'relationships'>[] = [];

  // Generate nodes according to discipline distribution
  disciplines.forEach((discipline) => {
    const disciplineNodeCount = Math.floor(nodeCount * disciplineWeights[discipline]);
    const gapCount = Math.floor(disciplineNodeCount * 0.15); // 15% knowledge gaps

    // Generate regular research nodes
    for (let i = 0; i < disciplineNodeCount - gapCount; i++) {
      const nodeId = `${discipline}-${i}`;
      nodes.push(generateMESNode(nodeId, discipline, false));
    }

    // Generate knowledge gap nodes
    for (let i = 0; i < gapCount; i++) {
      const nodeId = `${discipline}-gap-${i}`;
      nodes.push(generateMESNode(nodeId, discipline, true));
    }
  });

  // Convert to full nodes with relationships
  const fullNodes: MESKnowledgeNode[] = nodes.map((node) => ({
    ...node,
    relationships: [],
  }));

  // Generate realistic relationships between nodes
  fullNodes.forEach((node) => {
    node.relationships = generateResearchRelationships(node, fullNodes);

    // Update connections array for compatibility
    node.connections = node.relationships.map((rel) => rel.targetId);
  });

  // Calculate positions using scientific positioning
  fullNodes.forEach((node) => {
    const disciplineIndex = disciplines.indexOf(node.discipline);
    const position = calculateRadialPosition(node, 400, disciplineIndex, disciplines.length);
    node.position = { x: position.x, y: position.y };
  });

  return fullNodes;
}

// Generate sample data for testing
export function generateSampleMESData(count: number = 1000): MESKnowledgeNode[] {
  const data = generateScientificMESData(count);

  console.log(`Generated ${data.length} scientific MES research nodes:`);
  console.log(`- Knowledge gaps: ${data.filter((n) => n.isKnowledgeGap).length}`);
  console.log(
    `- Average certainty: ${(
      (data.reduce((sum, n) => sum + n.overallCertaintyScore, 0) / data.length) *
      100
    ).toFixed(1)}%`
  );
  console.log(`- Disciplines: ${Object.keys(MES_DISCIPLINE_COLORS).join(', ')}`);

  return data;
}
