/**
 * Runtime configuration for the MESSAI public API.
 *
 * These hooks talk to MESSAI's open, unauthenticated read API. Both endpoints
 * they use are public:
 *
 *   GET /api/papers          — paper corpus (paginated)
 *   GET /api/external-search — DOI/PubMed enrichment
 *
 * By default requests go to https://messai.io. Point them elsewhere (a local
 * dev server, a self-hosted mirror) with `configure({ baseUrl })`, or pass a
 * relative base (`''`) when calling from a page served by MESSAI itself.
 */

export interface MessaiApiConfig {
  /** Origin the API is served from. No trailing slash. Default: https://messai.io */
  baseUrl: string;
  /** Emit verbose request/transform logs. Default: false. */
  debug: boolean;
}

const DEFAULT_CONFIG: MessaiApiConfig = {
  baseUrl: 'https://messai.io',
  debug: false,
};

let config: MessaiApiConfig = { ...DEFAULT_CONFIG };

/** Override the API base URL and/or debug logging. Merges with current config. */
export function configure(next: Partial<MessaiApiConfig>): void {
  config = { ...config, ...next };
}

/** Current effective configuration. */
export function getConfig(): Readonly<MessaiApiConfig> {
  return config;
}

/** Reset to library defaults. Primarily for tests. */
export function resetConfig(): void {
  config = { ...DEFAULT_CONFIG };
}

/**
 * Build a full URL for an API path.
 * `getApiEndpoint('papers?limit=10')` -> `https://messai.io/api/papers?limit=10`
 */
export function getApiEndpoint(path: string): string {
  const clean = path.replace(/^\/+/, '').replace(/^api\//, '');
  return `${config.baseUrl}/api/${clean}`;
}

/** Verbose log, suppressed unless `debug` is enabled. */
export function debugLog(...args: unknown[]): void {
  if (config.debug) console.debug('[mess-hypotheses]', ...args);
}

/** Error log. Always emitted. */
export function errorLog(...args: unknown[]): void {
  console.error('[mess-hypotheses]', ...args);
}

/** Minimal logger, shape-compatible with the app logger these hooks came from. */
export const logger = {
  debug: debugLog,
  error: errorLog,
  warn: (...args: unknown[]) => console.warn('[mess-hypotheses]', ...args),
  info: (...args: unknown[]) => debugLog(...args),
};
