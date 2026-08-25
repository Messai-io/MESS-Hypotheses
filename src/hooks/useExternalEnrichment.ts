import { useState, useCallback } from 'react';
import { logger, getApiEndpoint } from '../lib/config';

interface EnrichmentResult {
  paperId: string;
  enrichedData: {
    pubmedData?: any;
    crossrefData?: any;
    additionalKeywords?: string[];
    citationCount?: number;
    references?: string[];
  };
}

interface ExternalSearchResult {
  query: string;
  source: string;
  pubmed?: any[];
  crossref?: any[];
  localMatches?: any[];
}

/**
 * Hook for enriching papers with external API data
 */
export function useExternalEnrichment() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<{
    current: number;
    total: number;
    currentPaper?: string;
  }>({ current: 0, total: 0 });

  /**
   * Enrich a single paper with external data
   */
  const enrichPaper = useCallback(async (paperId: string): Promise<EnrichmentResult | null> => {
    try {
      const response = await fetch(getApiEndpoint(`external-search?enrichPaperId=${paperId}`));

      if (!response.ok) {
        throw new Error(`Failed to enrich paper: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Paper enrichment error:', error);
      return null;
    }
  }, []);

  /**
   * Enrich multiple papers in batch
   */
  const enrichPapers = useCallback(
    async (paperIds: string[]): Promise<Map<string, EnrichmentResult>> => {
      setIsEnriching(true);
      setEnrichmentProgress({ current: 0, total: paperIds.length });

      const results = new Map<string, EnrichmentResult>();

      for (let i = 0; i < paperIds.length; i++) {
        const paperId = paperIds[i];

        setEnrichmentProgress({
          current: i + 1,
          total: paperIds.length,
          currentPaper: paperId,
        });

        const result = await enrichPaper(paperId);
        if (result) {
          results.set(paperId, result);
        }

        // Rate limiting delay
        if (i < paperIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      setIsEnriching(false);
      setEnrichmentProgress({ current: 0, total: 0 });

      return results;
    },
    [enrichPaper]
  );

  /**
   * Search external sources
   */
  const searchExternal = useCallback(
    async (
      query: string,
      source: 'pubmed' | 'crossref' | 'both' = 'both',
      maxResults: number = 20
    ): Promise<ExternalSearchResult | null> => {
      try {
        const params = new URLSearchParams({
          query,
          source,
          maxResults: maxResults.toString(),
        });

        const response = await fetch(getApiEndpoint(`external-search?${params}`));

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        logger.error('External search error:', error);
        return null;
      }
    },
    []
  );

  /**
   * Import paper from external source
   */
  const importPaper = useCallback(
    async (
      identifier: { doi?: string; pmid?: string },
      source: 'pubmed' | 'crossref'
    ): Promise<{ paperId: string; paper: any } | null> => {
      try {
        const response = await fetch(getApiEndpoint('external-search'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...identifier,
            source,
          }),
        });

        if (!response.ok) {
          throw new Error(`Import failed: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        logger.error('Paper import error:', error);
        return null;
      }
    },
    []
  );

  /**
   * Find missing papers in external sources
   */
  const findMissingPapers = useCallback(
    async (knownDOIs: string[]): Promise<{ doi: string; found: boolean; source?: string }[]> => {
      const results: { doi: string; found: boolean; source?: string }[] = [];

      for (const doi of knownDOIs) {
        try {
          const response = await fetch(getApiEndpoint(`external-search?doi=${doi}`));

          if (response.ok) {
            const data = await response.json();
            results.push({
              doi,
              found: !!data.crossrefData,
              source: 'crossref',
            });
          } else {
            results.push({ doi, found: false });
          }

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          results.push({ doi, found: false });
        }
      }

      return results;
    },
    []
  );

  return {
    isEnriching,
    enrichmentProgress,
    enrichPaper,
    enrichPapers,
    searchExternal,
    importPaper,
    findMissingPapers,
  };
}
