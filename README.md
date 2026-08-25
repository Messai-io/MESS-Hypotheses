# MESS-Hypotheses

<!-- MIRROR_DISCLOSURE_START -->

> **This repository is a downstream mirror.** Source of truth lives in the
> `messai-ai` monorepo; this mirror is updated on each release. Issues and
> Discussions are welcome here. PRs against this mirror will be redirected — see
> [CONTRIBUTING.md](./CONTRIBUTING.md).
>
> History was reset as part of the 2026 monorepo consolidation. Versions tagged
> before that (e.g. `v0.2.0`) remain accessible as historical refs.

<!-- MIRROR_DISCLOSURE_END -->

**Research gap identification and hypothesis generation for MES research**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

MESS-Hypotheses provides tools for identifying research gaps and generating
hypotheses:

- **Knowledge Gap Visualization** - WebGL network visualization (10K+ nodes at
  60 FPS)
- **Confidence Scoring** - Multi-factor confidence methodology
- **Gap Prioritization** - Urgency/Impact/Feasibility scoring
- **Contradiction Detection** - Find conflicting research findings
- **Discipline Clustering** - Cross-domain analysis

## Installation

> **Not yet published to npm.** This package is source-available here while its
> public API stabilises. Use it by cloning the mirror:

```bash
git clone https://github.com/Messai-io/MESS-Hypotheses.git
cd MESS-Hypotheses && pnpm install && pnpm build
```

Track [the packaging issue](https://github.com/Messai-io/MESS-Hypotheses/issues)
for the npm release.

## Features

### Knowledge Gap Visualization

```javascript
import { KnowledgeGapNetwork } from '@messai-io/mess-hypotheses';

const network = new KnowledgeGapNetwork({
  container: document.getElementById('visualization'),
  layout: 'radial', // center = high certainty, edge = gaps
  maxNodes: 10000,
});

// Load research data
await network.loadData(researchPapers);

// Highlight gaps in specific area
network.highlightGaps('biofilm_conductivity');

// Export identified gaps
const gaps = network.exportGaps();
```

### Confidence Scoring

The implemented confidence API is a set of **pure functions** in
[`src/algorithms/confidence.ts`](./src/algorithms/confidence.ts) — there is no
`ConfidenceScorer` class and no `loadData()` entry point. The primary function
is `calculateConfidence(factors)`.

```typescript
import { calculateConfidence } from '@messai-io/mess-hypotheses';

const score = calculateConfidence({
  literatureSupport: 12, // number of supporting papers (NOT a 0–1 fraction)
  modelValidation: 0.6, // R² / validation score, 0–1
  parameterRange: 'optimal', // 'optimal' | 'typical' | 'extreme'
  dataQuality: 'measured', // 'measured' | 'estimated' | 'theoretical'
  scaleValidation: 'pilot', // 'lab' | 'pilot' | 'industrial' | 'none'
  temporalStability: 0.7, // consistency over time, 0–1
  uncertaintyLevel: 20, // uncertainty percentage (lower is better)
});

console.log(score.overall); // integer 0–100
console.log(score.category); // 'high' | 'medium' | 'low'
console.log(score.explanation); // human-readable summary string
console.log(score.recommendations); // up to 3 improvement suggestions
```

**Scoring methodology (as implemented).** `calculateConfidence` merges the given
factors over defaults, converts each of seven factors to a 0–100 subscore, and
combines them as a fixed-weight sum:

| Factor              | Weight | Subscore mapping (verified in code)                       |
| ------------------- | ------ | --------------------------------------------------------- |
| `literatureSupport` | 0.25   | `min(100, papers × 5)` — 20 papers saturates at 100       |
| `modelValidation`   | 0.20   | `value × 100` (input is 0–1)                              |
| `parameterRange`    | 0.15   | `optimal → 100`, `typical → 75`, `extreme → 25`           |
| `dataQuality`       | 0.15   | `measured → 100`, `estimated → 60`, `theoretical → 30`    |
| `scaleValidation`   | 0.10   | `industrial → 100`, `pilot → 75`, `lab → 50`, `none → 25` |
| `temporalStability` | 0.10   | `value × 100` (input is 0–1)                              |
| `uncertaintyLevel`  | 0.05   | `max(0, 100 − uncertaintyPercent)`                        |

The weights sum to 1.0, so `overall` is a weighted average on the 0–100 scale
(rounded to an integer). Category thresholds: **`overall ≥ 70` → high**,
**`≥ 40` → medium**, otherwise **low**. The `explanation` string names the
strongest factor (subscore ≥ 80) and, if present, the weakest concerning factor
(subscore < 40); `recommendations` returns up to three improvement suggestions
triggered by low subscores.

**Related helpers** in the same module wrap `calculateConfidence` with
domain-specific defaults:

- `getParameterConfidence(parameter, value, optimalRange)` — scores a parameter
  value against an optimal `[min, max]` range.
- `getScaleUpConfidence(fromScale, toScale, validationData?)` — scores a
  scale-up prediction from the scale ratio.
- `getEconomicConfidence(timeHorizon, marketVolatility)` — scores an economic
  projection over a time horizon.
- `aggregateConfidence(scores[])` — combines multiple `ConfidenceScore`s
  (weights each by its own `overall`).
- `formatConfidence(score)` — returns display tokens (color / icon / label) for
  the score category.

> **Note on inputs.** `literatureSupport` here is a **paper count**, not a 0–1
> fraction, and `uncertaintyLevel` is a **percentage** where lower is better.
> The full `ConfidenceFactors` / `ConfidenceScore` interfaces are defined at the
> top of `src/algorithms/confidence.ts`.

### Gap Prioritization

```javascript
import { GapPrioritizer } from '@messai-io/mess-hypotheses';

const prioritizer = new GapPrioritizer();

// Prioritize research gaps
const prioritized = prioritizer.rank(gaps, {
  urgency: 0.3, // Weight for time-sensitivity
  impact: 0.4, // Weight for potential impact
  feasibility: 0.3, // Weight for research feasibility
});

console.log(prioritized[0].gap);
console.log(prioritized[0].score);
console.log(prioritized[0].rationale);
```

### Contradiction Detection

```javascript
import { ContradictionDetector } from '@messai-io/mess-hypotheses';

const detector = new ContradictionDetector();

// Find contradicting findings
const contradictions = detector.analyze(researchFindings);

for (const c of contradictions) {
  console.log(`Papers ${c.paper1} and ${c.paper2} contradict on:`);
  console.log(`  Topic: ${c.topic}`);
  console.log(`  Severity: ${c.severity}`);
  console.log(`  Resolution potential: ${c.resolutionPotential}`);
}
```

### Discipline Clustering

```javascript
import { DisciplineClustering } from '@messai-io/mess-hypotheses';

const clustering = new DisciplineClustering();

// Analyze cross-disciplinary connections
const analysis = clustering.analyze(papers, {
  disciplines: [
    'electrochemistry',
    'microbiology',
    'materials_science',
    'environmental_engineering',
    'biotechnology',
    'systems_biology',
  ],
});

console.log(analysis.clusters);
console.log(analysis.interdisciplinaryGaps);
console.log(analysis.collaborationOpportunities);
```

## Visualization Options

### Layout Types

- **radial** - Center = high certainty, edges = knowledge gaps
- **force** - Force-directed for relationship exploration
- **hierarchical** - Tree structure for categorical organization

### Performance

- GPU-accelerated WebGL rendering
- 60 FPS with 10,000+ nodes
- Edge bundling for visual clarity
- Level-of-detail for zoom

## API Reference

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [MESSAI Platform](https://messai.io)
- [Documentation](https://docs.messai.io/hypotheses)
- [Examples](examples/)
