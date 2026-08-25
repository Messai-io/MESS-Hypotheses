import type { MESDiscipline, ResearchRelationship } from './scientific-data-types';

/** Outgoing edge descriptor, matching `MESKnowledgeNode['relationships']`. */
export interface NetworkRelationship {
  targetId: string;
  type: ResearchRelationship;
  /** Confidence in the relationship, 0–1. */
  strength: number;
  evidence?: string;
}

/**
 * Graph primitives for the WebGL radial-network renderer.
 *
 * These were previously imported from a `WebGLRadialNetwork` module that was
 * not carried across when this package was extracted, leaving six files with
 * unresolvable imports. The renderer component itself lives in the MESSAI
 * application; only these two structural types are needed here, so they are
 * declared locally and reconstructed from their use sites.
 */

/** A node in the radial knowledge network. */
export interface WebGLNetworkNode {
  id: string;
  label: string;
  /** Research discipline this node belongs to. Drives colour and ring placement. */
  discipline: MESDiscipline;
  /** Confidence in this node's underlying evidence, 0–1. */
  certainty: number;
  /** Aggregate certainty across the node's supporting papers, 0–1. */
  overallCertaintyScore?: number;
  /** True when the node represents an identified gap rather than established work. */
  isKnowledgeGap?: boolean;
  /** Ids of nodes this one links to. */
  connections?: string[];
  /** Typed outgoing relationships. */
  relationships?: NetworkRelationship[];
  /** Ids of nodes whose findings conflict with this one. */
  contradictions?: string[];
  topicKeywords?: string[];
  /** Layout position, assigned by the layout engine. */
  position?: { x: number; y: number; z?: number };
  /** Flattened coordinates, written by force/hierarchical layouts. */
  x?: number;
  y?: number;
  /** Render radius. */
  radius?: number;
  /** Render scale multiplier. */
  scale?: number;
}

/** A directed edge between two network nodes. */
export interface WebGLNetworkLink {
  source: string;
  target: string;
  /** Edge weight, 0–1. Drives thickness and particle throughput. */
  strength?: number;
  /** Id of the target node, retained for renderers that key off the edge itself. */
  targetId?: string;
}
