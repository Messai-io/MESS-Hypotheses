# MESS-Hypotheses

**Research gap identification and hypothesis generation for MES research**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/@messai-io%2Fmess-hypotheses.svg)](https://www.npmjs.com/package/@messai-io/mess-hypotheses)

## Overview

MESS-Hypotheses provides tools for identifying research gaps and generating hypotheses:

- **Knowledge Gap Visualization** - WebGL network visualization (10K+ nodes at 60 FPS)
- **Confidence Scoring** - Multi-factor confidence methodology
- **Gap Prioritization** - Urgency/Impact/Feasibility scoring
- **Contradiction Detection** - Find conflicting research findings
- **Discipline Clustering** - Cross-domain analysis

## Installation

```bash
npm install @messai-io/mess-hypotheses
```

## Features

### Knowledge Gap Visualization

```javascript
import { KnowledgeGapNetwork } from '@messai-io/mess-hypotheses';

const network = new KnowledgeGapNetwork({
  container: document.getElementById('visualization'),
  layout: 'radial',  // center = high certainty, edge = gaps
  maxNodes: 10000
});

// Load research data
await network.loadData(researchPapers);

// Highlight gaps in specific area
network.highlightGaps('biofilm_conductivity');

// Export identified gaps
const gaps = network.exportGaps();
```

### Confidence Scoring

```javascript
import { ConfidenceScorer } from '@messai-io/mess-hypotheses';

const scorer = new ConfidenceScorer();

// Score confidence in a research finding
const score = scorer.calculate({
  literatureSupport: 0.8,    // 12 supporting papers
  modelValidation: 0.6,      // Partial model agreement
  dataQuality: 0.9,          // High-quality experimental data
  reproducibility: 0.7,      // 70% reproduction rate
  sampleSize: 0.65           // Moderate sample sizes
});

console.log(score.overall);        // 0.73
console.log(score.breakdown);      // Factor-by-factor scores
console.log(score.recommendations); // How to improve confidence
```

### Gap Prioritization

```javascript
import { GapPrioritizer } from '@messai-io/mess-hypotheses';

const prioritizer = new GapPrioritizer();

// Prioritize research gaps
const prioritized = prioritizer.rank(gaps, {
  urgency: 0.3,      // Weight for time-sensitivity
  impact: 0.4,       // Weight for potential impact
  feasibility: 0.3   // Weight for research feasibility
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
    'systems_biology'
  ]
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

See [API Documentation](docs/API.md) for complete reference.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [MESSAI Platform](https://messai.io)
- [Documentation](https://docs.messai.io/hypotheses)
- [Examples](examples/)
