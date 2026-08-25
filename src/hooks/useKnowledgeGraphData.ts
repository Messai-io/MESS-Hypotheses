'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiEndpoint, debugLog, errorLog } from '../lib/config';
import type { WebGLNetworkNode, WebGLNetworkLink } from '../visualization/webgl-network-types';
import type { MESDiscipline, ResearchRelationship } from '../visualization/scientific-data-types';

interface KnowledgeGraphFilters {
  yearStart?: number;
  yearEnd?: number;
  minCompleteness?: number;
  disciplines?: MESDiscipline[];
  includeGaps?: boolean;
  includeRelationships?: boolean;
  limit?: number;
}

interface PapersApiResponse {
  data: {
    papers: Array<{
      id: string;
      title: string;
      authors: Array<{ name: string; affiliation: string }>;
      abstract: string;
      year: number;
      journal: { name: string; impactFactor: number };
      doi: string;
      citation: { citationCount: number };
      qualityScore: number;
      aiConfidenceScore: number;
      researchFocus: string[];
      performanceMetrics: {
        maxPowerDensity?: number | null;
        coulombicEfficiency?: number | null;
      };
      aiSummary: string;
      aiKeyFindings: any;
      dataCompleteness: number;
      reproducibilityScore?: number | null;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
    stats: {
      totalResults: number;
    };
  };
  error: any;
}

// Map research focus to MES discipline
function mapResearchFocusToDiscipline(researchFocus: string[]): MESDiscipline {
  if (!researchFocus || researchFocus.length === 0) return 'bioelectrochemistry';

  const focus = researchFocus[0].toLowerCase();

  console.log('🧬 Mapping discipline for:', focus);

  // Direct abbreviation matches (most common in our data)
  if (focus === 'mfc' || focus.includes('fuel')) return 'bioelectrochemistry';
  if (focus === 'mec' || focus.includes('electrolysis')) return 'electron_transfer';
  if (focus === 'mdc' || focus.includes('desalination')) return 'environmental_systems';

  // Detailed keyword matches
  if (focus.includes('electrode') || focus.includes('material') || focus.includes('carbon'))
    return 'electrode_materials';
  if (focus.includes('reactor') || focus.includes('design') || focus.includes('chamber'))
    return 'reactor_design';
  if (focus.includes('microbial') || focus.includes('community') || focus.includes('bacteria'))
    return 'microbial_communities';
  if (
    focus.includes('environmental') ||
    focus.includes('wastewater') ||
    focus.includes('treatment')
  )
    return 'environmental_systems';
  if (focus.includes('control') || focus.includes('monitoring') || focus.includes('optimization'))
    return 'system_control';
  if (focus.includes('economic') || focus.includes('cost') || focus.includes('commercial'))
    return 'techno_economics';

  return 'bioelectrochemistry'; // Default for unknowns
}

// Transform API response to WebGL format
function transformToWebGLFormat(response: PapersApiResponse): {
  nodes: WebGLNetworkNode[];
  links: WebGLNetworkLink[];
} {
  debugLog('Transform to WebGL: Starting transformation', {
    paperCount: response.data.papers.length,
    firstPaper: response.data.papers[0]?.title,
    totalResults: response.data.stats.totalResults,
  });

  // Create node map for quick lookup
  const nodeMap = new Map<string, WebGLNetworkNode>();

  // Transform nodes
  const nodes = response.data.papers.map((paper, index) => {
    // Map research focus to MES discipline
    const discipline = mapResearchFocusToDiscipline(paper.researchFocus);

    // Enhanced certainty calculation with multiple factors
    const certainty =
      (paper.qualityScore + paper.aiConfidenceScore + paper.dataCompleteness * 100) / 300;

    // Detect knowledge gaps based on low data completeness or quality scores
    const isKnowledgeGap = paper.dataCompleteness < 0.5 || paper.qualityScore < 50;

    // Calculate impact score for visual hierarchy (combines citations, quality, and recency)
    const citationCount = paper.citation?.citationCount || 0;
    const citationScore = Math.min(citationCount / 10, 1); // Normalize to 0-1
    const qualityScore = paper.qualityScore / 100;
    const recencyBonus = Math.max(0, (paper.year - 2015) / 10); // More recent = higher
    const impactScore = citationScore * 0.4 + qualityScore * 0.4 + recencyBonus * 0.2;

    // Calculate position based on certainty and discipline
    const angle = (index / response.data.papers.length) * Math.PI * 2;
    const radius = (1 - certainty) * 100 + 50; // Higher certainty = closer to center

    const webglNode: WebGLNetworkNode = {
      id: paper.id,
      label: paper.title.length > 50 ? paper.title.substring(0, 47) + '...' : paper.title,
      discipline: discipline,
      subDisciplines: paper.researchFocus.length > 1 ? [discipline] : undefined,
      application: paper.researchFocus[0] as any,
      scale: 'laboratory', // Default, could be enhanced based on paper analysis
      certainty: certainty,
      overallCertaintyScore: certainty,
      isKnowledgeGap: isKnowledgeGap,
      gapType: isKnowledgeGap ? ('experimental' as any) : undefined,
      topicKeywords: paper.title
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 3),
      researchQuestion: isKnowledgeGap
        ? `How can we improve research in ${discipline}?`
        : undefined,
      findings: paper.aiSummary || undefined,
      limitations: paper.dataCompleteness < 0.5 ? 'Limited data completeness' : undefined,
      futureWork: isKnowledgeGap ? 'Further research needed to fill this gap' : undefined,
      connections: [], // Will be filled from relationships if available
      relationships: [], // Will be filled from relationships if available
      // Position properties directly on node for d3-force compatibility
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: certainty * 20 - 10, // Certainty affects z-position
      position: [Math.cos(angle) * radius, Math.sin(angle) * radius, certainty * 20 - 10], // Array format for Three.js
      radius: Math.max(2, 3 + impactScore * 5), // Size based on combined impact score (2-8 range)
      color: undefined, // Will be set by visualization
      opacity: isKnowledgeGap ? 0.6 : Math.min(0.95, 0.7 + impactScore * 0.25), // Higher impact = more visible
      visible: true,
      lodLevel: 0,
      // Additional metadata for tooltips
      metadata: {
        authors: paper.authors.map((a) => a.name),
        doi: paper.doi,
        journal: paper.journal?.name,
        year: paper.year,
        powerOutput: paper.performanceMetrics?.maxPowerDensity,
        efficiency: paper.performanceMetrics?.coulombicEfficiency,
        aiSummary: paper.aiSummary,
        reproducibilityScore: paper.reproducibilityScore,
        impactScore: Math.round(impactScore * 100), // Show as percentage
        citationCount: citationCount,
      } as any,
    };

    nodeMap.set(paper.id, webglNode);
    return webglNode;
  });

  // For now, create simple connections between papers with similar research focus
  const links: WebGLNetworkLink[] = [];

  // Group nodes by discipline and create connections within groups
  const disciplineGroups = new Map<MESDiscipline, WebGLNetworkNode[]>();
  nodes.forEach((node) => {
    if (!disciplineGroups.has(node.discipline)) {
      disciplineGroups.set(node.discipline, []);
    }
    disciplineGroups.get(node.discipline)!.push(node);
  });

  // Create links between papers in the same discipline
  disciplineGroups.forEach((groupNodes, discipline) => {
    if (groupNodes.length > 1) {
      for (let i = 0; i < groupNodes.length && i < 3; i++) {
        for (let j = i + 1; j < groupNodes.length && j < 4; j++) {
          const sourceNode = groupNodes[i];
          const targetNode = groupNodes[j];

          // Add to connections arrays
          sourceNode.connections.push(targetNode.id);
          targetNode.connections.push(sourceNode.id);

          // Add to relationships arrays
          sourceNode.relationships.push({
            targetId: targetNode.id,
            type: 'complements',
            strength: 0.6,
            evidence: `Both papers focus on ${discipline}`,
          });

          targetNode.relationships.push({
            targetId: sourceNode.id,
            type: 'complements',
            strength: 0.6,
            evidence: `Both papers focus on ${discipline}`,
          });

          // Create link
          links.push({
            source: sourceNode,
            target: targetNode,
            relationshipType: 'complements',
            strength: 0.6,
            isContradiction: false,
            evidence: `Both papers focus on ${discipline}`,
          } as WebGLNetworkLink);
        }
      }
    }
  });

  return { nodes, links };
}

interface GraphStats {
  totalPapers: number;
  knowledgeGaps: number;
  contradictions: number;
  averageCertainty: number;
}

export function useKnowledgeGraphData(filters: KnowledgeGraphFilters = {}) {
  const [data, setData] = useState<WebGLNetworkNode[]>([]);
  const [links, setLinks] = useState<WebGLNetworkLink[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Debounce timer for filter changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Default filters
  const defaultFilters: KnowledgeGraphFilters = {
    yearStart: 2019,
    yearEnd: new Date().getFullYear(),
    minCompleteness: 0.7,
    includeGaps: true,
    includeRelationships: true,
    limit: 500, // Enhanced limit for knowledge graph visualization (v3-cache-bust)
    ...filters,
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters compatible with papers API
      const params = new URLSearchParams();
      if (defaultFilters.yearStart) params.set('yearStart', defaultFilters.yearStart.toString());
      if (defaultFilters.yearEnd) params.set('yearEnd', defaultFilters.yearEnd.toString());
      // Map minCompleteness to minQualityScore (0.7 -> 70)
      if (defaultFilters.minCompleteness)
        params.set('minQualityScore', (defaultFilters.minCompleteness * 100).toString());
      if (defaultFilters.limit) params.set('limit', defaultFilters.limit.toString());
      // Add default verified filter for better quality
      params.set('verified', 'true');
      // Add knowledge graph identifier for enhanced validation limits
      params.set('knowledgeGraph', 'true');
      // Add cache-busting parameter to force fresh request
      params.set('_t', Date.now().toString());

      const apiUrl = getApiEndpoint(`papers?${params.toString()}`);
      debugLog('Fetching research papers data:', apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        debugLog('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `Failed to fetch: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result: PapersApiResponse = await response.json();

      // Transform to WebGL format
      const { nodes, links: transformedLinks } = transformToWebGLFormat(result);

      setData(nodes);
      setLinks(transformedLinks);
      setStats({
        totalPapers: result.data.stats.totalResults,
        knowledgeGaps: nodes.filter((n) => n.isKnowledgeGap).length,
        contradictions: 0, // Not available in papers API
        averageCertainty: nodes.reduce((sum, n) => sum + n.certainty, 0) / nodes.length,
      });
      setIsCached(false); // Papers API doesn't provide cache info

      debugLog(
        `🎯 FINAL DATA SET: ${nodes.length} nodes and ${transformedLinks.length} relationships`,
        {
          sampleNodes: nodes.slice(0, 3).map((n) => ({
            id: n.id,
            label: n.label.substring(0, 30),
            discipline: n.discipline,
            certainty: n.certainty,
            isKnowledgeGap: n.isKnowledgeGap,
            position: n.position,
            color: n.color,
          })),
          disciplineDistribution: nodes.reduce((acc, n) => {
            acc[n.discipline] = (acc[n.discipline] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        }
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch knowledge graph data';
      errorLog('Knowledge graph fetch error:', err);
      setError(errorMessage);

      // Fall back to sample data if API fails - generate inline to avoid chunk loading issues
      try {
        // Generate simple fallback data without external imports
        const fallbackNodes: WebGLNetworkNode[] = [];
        const disciplines: MESDiscipline[] = [
          'bioelectrochemistry',
          'electron_transfer',
          'electrode_materials',
          'microbiology',
          'reactor_design',
          'computational_modeling',
        ];

        for (let i = 0; i < 50; i++) {
          const discipline = disciplines[i % disciplines.length];
          fallbackNodes.push({
            id: `fallback-${i}`,
            label: `Sample Node ${i + 1}`,
            discipline,
            nodeType: 'paper',
            position: [
              (Math.random() - 0.5) * 100,
              (Math.random() - 0.5) * 100,
              (Math.random() - 0.5) * 100,
            ],
            value: Math.random() * 10 + 1,
            year: 2020 + Math.floor(Math.random() * 5),
            completeness: Math.random() * 0.5 + 0.5,
            uncertainty: Math.random() * 0.3,
            connections: [],
          });
        }

        setData(fallbackNodes);
        debugLog('Fell back to sample data due to API error');
      } catch (fallbackError) {
        errorLog('Failed to load fallback data:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    defaultFilters.yearStart,
    defaultFilters.yearEnd,
    defaultFilters.minCompleteness,
    defaultFilters.disciplines?.join(','),
    defaultFilters.includeGaps,
    defaultFilters.includeRelationships,
    defaultFilters.limit,
  ]);

  // Fetch data with debouncing
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer (600ms debounce as per guidelines)
    debounceTimerRef.current = setTimeout(() => {
      fetchData();
    }, 600);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    // Invalidate cache first
    try {
      const params = new URLSearchParams();
      if (defaultFilters.yearStart) params.set('yearStart', defaultFilters.yearStart.toString());
      if (defaultFilters.yearEnd) params.set('yearEnd', defaultFilters.yearEnd.toString());
      if (defaultFilters.minCompleteness)
        params.set('minQualityScore', (defaultFilters.minCompleteness * 100).toString());

      const apiUrl = getApiEndpoint(`papers?${params.toString()}`);

      // Papers API doesn't support cache invalidation, skip this step
      // await fetch(apiUrl, { method: 'POST' });
      debugLog('Refresh requested - papers API does not use cache');
    } catch (err) {
      errorLog('Failed to invalidate cache:', err);
    }

    // Fetch fresh data
    await fetchData();
  }, [fetchData, defaultFilters]);

  return {
    nodes: data,
    links,
    stats,
    isLoading,
    error,
    isCached,
    refresh,
    totalNodes: data.length,
    totalLinks: links.length,
  };
}
