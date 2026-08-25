'use client';

import { WebGLNetworkNode } from './webgl-network-types';
import { MESDiscipline } from './scientific-data-types';

/**
 * Hexagonal Layout Engine for MES Knowledge Visualization
 * Positions nodes based on certainty (center=high, edges=low) and discipline sectors
 */

// Map 8 disciplines to 6 hexagonal segments
export const DISCIPLINE_TO_SEGMENT: Record<MESDiscipline, number> = {
  bioelectrochemistry: 0, // Segment 0 (merged with electron_transfer)
  electron_transfer: 0, // Segment 0
  electrode_materials: 1, // Segment 1
  reactor_design: 2, // Segment 2
  microbial_communities: 3, // Segment 3
  environmental_systems: 4, // Segment 4
  system_control: 5, // Segment 5 (merged with techno_economics)
  techno_economics: 5, // Segment 5
};

// Segment names for the 6 hexagon sides
export const HEXAGON_SEGMENTS = [
  'Core Bioelectrochemistry', // bioelectrochemistry + electron_transfer
  'Materials Engineering', // electrode_materials
  'System Architecture', // reactor_design
  'Biological Systems', // microbial_communities
  'Environmental Applications', // environmental_systems
  'Operations & Economics', // system_control + techno_economics
] as const;

// Vertical stratification based on knowledge type
export enum KnowledgeLayer {
  FOUNDATION = 0, // Bottom - fundamental principles
  VALIDATED = 1, // Lower middle - experimental validation
  CONTEXTUAL = 2, // Middle - context-dependent findings
  EMERGING = 3, // Upper middle - pilot/emerging results
  SPECULATIVE = 4, // Top - theoretical/gaps
}

export interface HexagonalPosition {
  // Hexagonal coordinates
  ring: number; // 0 = center, increases outward
  segment: number; // 0-5 for 6 hexagon sides
  segmentPosition: number; // Position within segment

  // Cartesian coordinates
  x: number;
  y: number;
  z: number; // Elevation for 3D effect

  // Metadata
  angle: number; // Radial angle from center
  distance: number; // Distance from center
  layer: KnowledgeLayer;
  certaintyScore: number;
}

export class HexagonalLayoutEngine {
  private baseRadius: number = 50;
  private ringSpacing: number = 80;
  private maxRings: number = 8;
  private verticalSpacing: number = 30;
  private nodePositions: Map<string, HexagonalPosition> = new Map();

  constructor(private viewportWidth: number = 1200, private viewportHeight: number = 800) {
    // Adjust base radius based on viewport
    this.baseRadius = Math.min(viewportWidth, viewportHeight) * 0.05;
    this.ringSpacing = Math.min(viewportWidth, viewportHeight) * 0.08;
  }

  /**
   * Calculate hexagonal position for a node based on certainty and discipline
   */
  calculatePosition(node: WebGLNetworkNode): HexagonalPosition {
    // Determine ring based on certainty (inverted - high certainty = center)
    const certainty = node.overallCertaintyScore || node.certainty || 0.5;
    const ring = this.calculateRing(certainty);

    // Determine segment based on discipline
    const segment = DISCIPLINE_TO_SEGMENT[node.discipline];

    // Calculate position within segment
    const segmentPosition = this.calculateSegmentPosition(node, segment, ring);

    // Determine vertical layer based on knowledge type
    const layer = this.determineKnowledgeLayer(node);

    // Convert to Cartesian coordinates
    const { x, y, angle, distance } = this.hexagonalToCartesian(
      ring,
      segment,
      segmentPosition,
      layer
    );

    // Calculate elevation based on layer
    const z = this.calculateElevation(layer, certainty);

    const position: HexagonalPosition = {
      ring,
      segment,
      segmentPosition,
      x,
      y,
      z,
      angle,
      distance,
      layer,
      certaintyScore: certainty,
    };

    // Cache position for later reference
    this.nodePositions.set(node.id, position);

    return position;
  }

  /**
   * Calculate ring based on certainty score
   * High certainty (0.8-1.0) = center rings (0-2)
   * Medium certainty (0.5-0.8) = middle rings (3-5)
   * Low certainty (0-0.5) = outer rings (6-8)
   */
  private calculateRing(certainty: number): number {
    const invertedCertainty = 1 - certainty;
    return Math.floor(invertedCertainty * this.maxRings);
  }

  /**
   * Calculate position within a segment
   */
  private calculateSegmentPosition(node: WebGLNetworkNode, segment: number, ring: number): number {
    // Use a hash of the node ID for consistent positioning
    const hash = this.hashCode(node.id);
    const nodesInRingSegment = this.getNodesPerRingSegment(ring);
    return hash % nodesInRingSegment;
  }

  /**
   * Determine knowledge layer based on node properties
   */
  private determineKnowledgeLayer(node: WebGLNetworkNode): KnowledgeLayer {
    // Check if it's a knowledge gap
    if (node.isKnowledgeGap) {
      return KnowledgeLayer.SPECULATIVE;
    }

    // Check evidence level if available
    if (node.certainty) {
      const evidenceLevel = node.certainty.evidenceLevel || 'experimental';

      if (evidenceLevel === 'theoretical' || evidenceLevel === 'speculative') {
        return KnowledgeLayer.SPECULATIVE;
      }

      if (evidenceLevel === 'computational') {
        return KnowledgeLayer.EMERGING;
      }

      // Check data source
      const dataSource = node.certainty.dataSource;
      if (dataSource === 'direct_measurement') {
        return KnowledgeLayer.VALIDATED;
      }

      if (dataSource === 'literature_review') {
        return KnowledgeLayer.CONTEXTUAL;
      }
    }

    // Check certainty score
    const certainty = node.overallCertaintyScore || 0.5;
    if (certainty > 0.9) return KnowledgeLayer.FOUNDATION;
    if (certainty > 0.7) return KnowledgeLayer.VALIDATED;
    if (certainty > 0.5) return KnowledgeLayer.CONTEXTUAL;
    if (certainty > 0.3) return KnowledgeLayer.EMERGING;
    return KnowledgeLayer.SPECULATIVE;
  }

  /**
   * Convert hexagonal coordinates to Cartesian
   */
  private hexagonalToCartesian(
    ring: number,
    segment: number,
    segmentPosition: number,
    layer: KnowledgeLayer
  ): { x: number; y: number; angle: number; distance: number } {
    // Calculate radius for this ring
    const radius = this.baseRadius + ring * this.ringSpacing;

    // Calculate base angle for segment (60 degrees per segment)
    const segmentAngle = segment * 60;

    // Add variation within segment
    const nodesInSegment = this.getNodesPerRingSegment(ring);
    const angleVariation = (segmentPosition / nodesInSegment) * 50 - 25; // ±25 degrees

    // Final angle
    const angle = segmentAngle + angleVariation;
    const angleRad = (angle * Math.PI) / 180;

    // Apply vertical offset based on layer
    const verticalOffset = this.getVerticalOffset(layer);

    // Calculate Cartesian coordinates
    const x = radius * Math.cos(angleRad);
    const y = radius * Math.sin(angleRad) + verticalOffset;

    // Calculate distance from center
    const distance = Math.sqrt(x * x + y * y);

    return { x, y, angle, distance };
  }

  /**
   * Calculate elevation (z-coordinate) based on knowledge layer
   */
  private calculateElevation(layer: KnowledgeLayer, certainty: number): number {
    const baseElevation = {
      [KnowledgeLayer.FOUNDATION]: -20, // Depressed (foundation)
      [KnowledgeLayer.VALIDATED]: -10,
      [KnowledgeLayer.CONTEXTUAL]: 0,
      [KnowledgeLayer.EMERGING]: 10,
      [KnowledgeLayer.SPECULATIVE]: 20, // Elevated (gaps/theoretical)
    };

    // Add slight variation based on certainty
    const variation = (1 - certainty) * 5;

    return baseElevation[layer] + variation;
  }

  /**
   * Get vertical offset for layer positioning
   */
  private getVerticalOffset(layer: KnowledgeLayer): number {
    // Foundation at bottom, speculative at top
    const offsets = {
      [KnowledgeLayer.FOUNDATION]: this.viewportHeight * 0.3, // Bottom
      [KnowledgeLayer.VALIDATED]: this.viewportHeight * 0.15,
      [KnowledgeLayer.CONTEXTUAL]: 0, // Center
      [KnowledgeLayer.EMERGING]: -this.viewportHeight * 0.15,
      [KnowledgeLayer.SPECULATIVE]: -this.viewportHeight * 0.3, // Top
    };

    return offsets[layer];
  }

  /**
   * Calculate how many nodes fit in each ring segment
   */
  private getNodesPerRingSegment(ring: number): number {
    // More nodes fit in outer rings
    return Math.max(1, ring * 3 + 1);
  }

  /**
   * Simple hash function for consistent positioning
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get hexagon vertices for drawing guides
   */
  getHexagonVertices(
    radius: number = this.baseRadius * 3
  ): Array<{ x: number; y: number; z: number }> {
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180;
      vertices.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        z: 0,
      });
    }
    return vertices;
  }

  /**
   * Get segment boundaries for visual guides
   */
  getSegmentBoundaries(): Array<{
    start: { x: number; y: number; z: number };
    end: { x: number; y: number; z: number };
  }> {
    const boundaries = [];
    const maxRadius = this.baseRadius + this.maxRings * this.ringSpacing;

    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180;
      boundaries.push({
        start: { x: 0, y: 0, z: 0 },
        end: {
          x: maxRadius * Math.cos(angle),
          y: maxRadius * Math.sin(angle),
          z: 0,
        },
      });
    }

    return boundaries;
  }

  /**
   * Get ring guides for visual reference
   */
  getRingGuides(): Array<{ radius: number; certaintyRange: [number, number] }> {
    const guides = [];

    for (let ring = 0; ring <= this.maxRings; ring++) {
      const radius = this.baseRadius + ring * this.ringSpacing;
      const certaintyMin = 1 - (ring + 1) / this.maxRings;
      const certaintyMax = 1 - ring / this.maxRings;

      guides.push({
        radius,
        certaintyRange: [certaintyMin, certaintyMax] as [number, number],
      });
    }

    return guides;
  }

  /**
   * Layout all nodes and return positioned data
   */
  layoutNodes(nodes: WebGLNetworkNode[]): WebGLNetworkNode[] {
    // Clear previous positions
    this.nodePositions.clear();

    // Calculate positions for all nodes
    const positionedNodes = nodes.map((node) => {
      const position = this.calculatePosition(node);

      return {
        ...node,
        x: position.x,
        y: position.y,
        z: position.z,
        position: {
          x: position.x,
          y: position.y,
          z: position.z,
        },
        // Store additional metadata
        hexagonalPosition: position,
      } as WebGLNetworkNode & { hexagonalPosition: HexagonalPosition };
    });

    // Apply force-directed adjustments within segments to prevent overlap
    return this.applyLocalForces(positionedNodes);
  }

  /**
   * Apply local force-directed layout within each segment
   */
  private applyLocalForces(
    nodes: (WebGLNetworkNode & { hexagonalPosition: HexagonalPosition })[]
  ): WebGLNetworkNode[] {
    // Group nodes by segment and ring
    const segments = new Map<string, typeof nodes>();

    nodes.forEach((node) => {
      const key = `${node.hexagonalPosition.segment}-${node.hexagonalPosition.ring}`;
      if (!segments.has(key)) {
        segments.set(key, []);
      }
      segments.get(key)!.push(node);
    });

    // Apply repulsion within each segment group
    segments.forEach((segmentNodes) => {
      for (let i = 0; i < segmentNodes.length; i++) {
        for (let j = i + 1; j < segmentNodes.length; j++) {
          const node1 = segmentNodes[i];
          const node2 = segmentNodes[j];

          const dx = node2.x! - node1.x!;
          const dy = node2.y! - node1.y!;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 30) {
            // Minimum separation
            const force = (30 - distance) / distance;
            const fx = dx * force * 0.5;
            const fy = dy * force * 0.5;

            node1.x! -= fx;
            node1.y! -= fy;
            node2.x! += fx;
            node2.y! += fy;
          }
        }
      }
    });

    return nodes;
  }
}

// Singleton instance for consistent layout across components
let layoutEngine: HexagonalLayoutEngine | null = null;

export function getHexagonalLayoutEngine(
  viewportWidth?: number,
  viewportHeight?: number
): HexagonalLayoutEngine {
  if (!layoutEngine || (viewportWidth && viewportHeight)) {
    layoutEngine = new HexagonalLayoutEngine(viewportWidth, viewportHeight);
  }
  return layoutEngine;
}
