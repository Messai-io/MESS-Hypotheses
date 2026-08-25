'use client';

import { WebGLNetworkNode } from '../visualization/webgl-network-types';
import { MESDiscipline } from '../visualization/scientific-data-types';

export interface DisciplineCluster {
  discipline: MESDiscipline;
  center: { x: number; y: number };
  radius: number;
  nodes: WebGLNetworkNode[];
  knowledgeGapCount: number;
  avgCertainty: number;
  color: string;
}

export interface HierarchicalLayout {
  clusters: DisciplineCluster[];
  totalNodes: number;
  totalGaps: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

// Arrange disciplines in a circular pattern with optimal spacing
const DISCIPLINE_POSITIONS: Record<MESDiscipline, { angle: number; distance: number }> = {
  bioelectrochemistry: { angle: 0, distance: 1 },
  electron_transfer: { angle: Math.PI / 4, distance: 1 },
  electrode_materials: { angle: Math.PI / 2, distance: 1 },
  reactor_design: { angle: (3 * Math.PI) / 4, distance: 1 },
  microbial_communities: { angle: Math.PI, distance: 1 },
  environmental_systems: { angle: (5 * Math.PI) / 4, distance: 1 },
  system_control: { angle: (3 * Math.PI) / 2, distance: 1 },
  techno_economics: { angle: (7 * Math.PI) / 4, distance: 1 },
};

// Create force-directed layout within discipline clusters
export function createHierarchicalLayout(
  nodes: WebGLNetworkNode[],
  viewportWidth: number = 800,
  viewportHeight: number = 600
): HierarchicalLayout {
  const centerX = 0;
  const centerY = 0;
  const baseRadius = Math.min(viewportWidth, viewportHeight) * 0.35;

  // Group nodes by discipline
  const disciplineGroups = new Map<MESDiscipline, WebGLNetworkNode[]>();

  nodes.forEach((node) => {
    const group = disciplineGroups.get(node.discipline) || [];
    group.push(node);
    disciplineGroups.set(node.discipline, group);
  });

  // Create clusters with improved positioning
  const clusters: DisciplineCluster[] = [];
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  disciplineGroups.forEach((groupNodes, discipline) => {
    const position = DISCIPLINE_POSITIONS[discipline];
    const clusterX = centerX + Math.cos(position.angle) * baseRadius * position.distance;
    const clusterY = centerY + Math.sin(position.angle) * baseRadius * position.distance;

    // Calculate cluster metrics
    const knowledgeGapCount = groupNodes.filter((n) => n.isKnowledgeGap).length;
    const avgCertainty =
      groupNodes.reduce((sum, n) => sum + (n.overallCertaintyScore || n.certainty || 0.5), 0) /
      groupNodes.length;

    // Position nodes within cluster using force-directed layout
    const clusterRadius = Math.sqrt(groupNodes.length) * 15;
    positionNodesInCluster(groupNodes, clusterX, clusterY, clusterRadius);

    // Track bounds
    groupNodes.forEach((node) => {
      minX = Math.min(minX, node.x || 0);
      maxX = Math.max(maxX, node.x || 0);
      minY = Math.min(minY, node.y || 0);
      maxY = Math.max(maxY, node.y || 0);
    });

    clusters.push({
      discipline,
      center: { x: clusterX, y: clusterY },
      radius: clusterRadius,
      nodes: groupNodes,
      knowledgeGapCount,
      avgCertainty,
      color: getDisiplineColor(discipline),
    });
  });

  return {
    clusters,
    totalNodes: nodes.length,
    totalGaps: nodes.filter((n) => n.isKnowledgeGap).length,
    bounds: { minX, maxX, minY, maxY },
  };
}

// Position nodes within a cluster using force simulation
function positionNodesInCluster(
  nodes: WebGLNetworkNode[],
  centerX: number,
  centerY: number,
  radius: number
) {
  // Simple force-directed positioning
  const iterations = 50;
  const repulsionStrength = 30;
  const attractionStrength = 0.01;

  // Initialize positions randomly within cluster
  nodes.forEach((node) => {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius * 0.8;
    node.x = centerX + Math.cos(angle) * r;
    node.y = centerY + Math.sin(angle) * r;
  });

  // Apply forces
  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = (nodes[j].x || 0) - (nodes[i].x || 0);
        const dy = (nodes[j].y || 0) - (nodes[i].y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy) + 0.01;

        if (distance < repulsionStrength * 2) {
          const force = repulsionStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          nodes[i].x = (nodes[i].x || 0) - fx;
          nodes[i].y = (nodes[i].y || 0) - fy;
          nodes[j].x = (nodes[j].x || 0) + fx;
          nodes[j].y = (nodes[j].y || 0) + fy;
        }
      }
    }

    // Attraction to center
    nodes.forEach((node) => {
      const dx = centerX - (node.x || 0);
      const dy = centerY - (node.y || 0);
      node.x = (node.x || 0) + dx * attractionStrength;
      node.y = (node.y || 0) + dy * attractionStrength;

      // Keep within cluster bounds
      const dist = Math.sqrt(
        Math.pow((node.x || 0) - centerX, 2) + Math.pow((node.y || 0) - centerY, 2)
      );
      if (dist > radius) {
        const scale = radius / dist;
        node.x = centerX + ((node.x || 0) - centerX) * scale;
        node.y = centerY + ((node.y || 0) - centerY) * scale;
      }
    });
  }

  // Sort nodes by importance (knowledge gaps and low certainty first)
  nodes.sort((a, b) => {
    const scoreA = (a.isKnowledgeGap ? 2 : 0) + (1 - (a.certainty || 0.5));
    const scoreB = (b.isKnowledgeGap ? 2 : 0) + (1 - (b.certainty || 0.5));
    return scoreB - scoreA;
  });
}

// Get discipline color
function getDisiplineColor(discipline: MESDiscipline): string {
  const colors: Record<MESDiscipline, string> = {
    bioelectrochemistry: '#00ff41',
    electron_transfer: '#39ff14',
    electrode_materials: '#57ff14',
    reactor_design: '#7fff00',
    microbial_communities: '#adff2f',
    environmental_systems: '#32cd32',
    system_control: '#00fa9a',
    techno_economics: '#00ff7f',
  };
  return colors[discipline] || '#39ff14';
}

// Calculate optimal zoom level for viewing
export function calculateOptimalZoom(layout: HierarchicalLayout): number {
  const { bounds } = layout;
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const maxDimension = Math.max(width, height);

  // Calculate zoom to fit all content with padding
  return Math.min(1, 800 / (maxDimension * 1.2));
}

// Get cluster at position
export function getClusterAtPosition(
  layout: HierarchicalLayout,
  x: number,
  y: number
): DisciplineCluster | null {
  for (const cluster of layout.clusters) {
    const dx = x - cluster.center.x;
    const dy = y - cluster.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= cluster.radius) {
      return cluster;
    }
  }
  return null;
}

// Get recommended exploration path
export function getExplorationPath(layout: HierarchicalLayout): DisciplineCluster[] {
  // Sort clusters by knowledge gap density
  return [...layout.clusters].sort((a, b) => {
    const gapRatioA = a.knowledgeGapCount / a.nodes.length;
    const gapRatioB = b.knowledgeGapCount / b.nodes.length;
    return gapRatioB - gapRatioA;
  });
}
