/**
 * Performance optimization utilities for WebGL radial network visualization
 * Handles LOD, virtualization, and efficient data processing for 10,000+ nodes
 */

import * as THREE from 'three';
import { WebGLNetworkNode, WebGLNetworkLink } from './webgl-network-types';

// LOD configuration for different performance levels
export const LOD_CONFIG = {
  HIGH: {
    maxNodes: 1000,
    sphereSegments: 32,
    edgeOpacity: 0.8,
    labelDetail: 'full',
    animationQuality: 'high',
  },
  MEDIUM: {
    maxNodes: 5000,
    sphereSegments: 16,
    edgeOpacity: 0.5,
    labelDetail: 'reduced',
    animationQuality: 'medium',
  },
  LOW: {
    maxNodes: 10000,
    sphereSegments: 8,
    edgeOpacity: 0.3,
    labelDetail: 'none',
    animationQuality: 'low',
  },
};

// Spatial indexing for efficient nearest neighbor queries
export class SpatialIndex {
  private grid: Map<string, WebGLNetworkNode[]> = new Map();
  private cellSize: number;
  private bounds: { minX: number; maxX: number; minY: number; maxY: number };

  constructor(nodes: WebGLNetworkNode[], cellSize = 50) {
    this.cellSize = cellSize;
    this.bounds = this.calculateBounds(nodes);
    this.buildIndex(nodes);
  }

  private calculateBounds(nodes: WebGLNetworkNode[]) {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x || 0);
      maxX = Math.max(maxX, node.x || 0);
      minY = Math.min(minY, node.y || 0);
      maxY = Math.max(maxY, node.y || 0);
    });

    return { minX, maxX, minY, maxY };
  }

  private buildIndex(nodes: WebGLNetworkNode[]) {
    nodes.forEach((node) => {
      const key = this.getGridKey(node.x || 0, node.y || 0);
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key)!.push(node);
    });
  }

  private getGridKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    return `${gridX},${gridY}`;
  }

  // Get nodes within a viewport for frustum culling
  getNodesInRegion(centerX: number, centerY: number, radius: number): WebGLNetworkNode[] {
    const result: WebGLNetworkNode[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerGridX = Math.floor(centerX / this.cellSize);
    const centerGridY = Math.floor(centerY / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerGridX + dx},${centerGridY + dy}`;
        const cellNodes = this.grid.get(key);

        if (cellNodes) {
          cellNodes.forEach((node) => {
            const distance = Math.sqrt(
              Math.pow((node.x || 0) - centerX, 2) + Math.pow((node.y || 0) - centerY, 2)
            );
            if (distance <= radius) {
              result.push(node);
            }
          });
        }
      }
    }

    return result;
  }

  // Efficient nearest neighbor search
  findNearestNodes(x: number, y: number, k = 5): WebGLNetworkNode[] {
    const candidates: { node: WebGLNetworkNode; distance: number }[] = [];
    const searchRadius = this.cellSize * 2;

    const nearbyNodes = this.getNodesInRegion(x, y, searchRadius);

    nearbyNodes.forEach((node) => {
      const distance = Math.sqrt(Math.pow((node.x || 0) - x, 2) + Math.pow((node.y || 0) - y, 2));
      candidates.push({ node, distance });
    });

    return candidates
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k)
      .map((c) => c.node);
  }
}

// Edge bundling for visual clarity with large networks
export class EdgeBundling {
  private nodes: WebGLNetworkNode[];
  private links: WebGLNetworkLink[];
  private bundleWidth: number;

  constructor(nodes: WebGLNetworkNode[], links: WebGLNetworkLink[], bundleWidth = 10) {
    this.nodes = nodes;
    this.links = links;
    this.bundleWidth = bundleWidth;
  }

  // Hierarchical edge bundling algorithm
  generateBundles(): { controlPoints: THREE.Vector3[]; bundledLinks: WebGLNetworkLink[] } {
    const bundles: Map<string, WebGLNetworkLink[]> = new Map();
    const controlPoints: THREE.Vector3[] = [];

    // Group links by angular similarity and proximity
    this.links.forEach((link) => {
      const source = link.source as WebGLNetworkNode;
      const target = link.target as WebGLNetworkNode;

      if (source && target) {
        const bundleKey = this.getBundleKey(source, target);

        if (!bundles.has(bundleKey)) {
          bundles.set(bundleKey, []);
        }
        bundles.get(bundleKey)!.push(link);
      }
    });

    // Generate control points for each bundle
    const bundledLinks: WebGLNetworkLink[] = [];
    bundles.forEach((bundleLinks, key) => {
      if (bundleLinks.length > 1) {
        const controls = this.generateControlPoints(bundleLinks);
        controlPoints.push(...controls);

        // Create bundled versions of links
        bundleLinks.forEach((link) => {
          bundledLinks.push({
            ...link,
            controlPoints: controls,
          } as WebGLNetworkLink & { controlPoints: THREE.Vector3[] });
        });
      } else {
        bundledLinks.push(...bundleLinks);
      }
    });

    return { controlPoints, bundledLinks };
  }

  private getBundleKey(source: WebGLNetworkNode, target: WebGLNetworkNode): string {
    const sourceAngle = Math.atan2(source.y || 0, source.x || 0);
    const targetAngle = Math.atan2(target.y || 0, target.x || 0);

    // Quantize angles for bundling
    const quantizedSource = Math.round(sourceAngle / (Math.PI / 12)) * (Math.PI / 12);
    const quantizedTarget = Math.round(targetAngle / (Math.PI / 12)) * (Math.PI / 12);

    return `${quantizedSource.toFixed(2)}-${quantizedTarget.toFixed(2)}`;
  }

  private generateControlPoints(bundleLinks: WebGLNetworkLink[]): THREE.Vector3[] {
    // Calculate bundle center point
    let centerX = 0,
      centerY = 0;
    let count = 0;

    bundleLinks.forEach((link) => {
      const source = link.source as WebGLNetworkNode;
      const target = link.target as WebGLNetworkNode;

      if (source && target) {
        centerX += ((source.x || 0) + (target.x || 0)) / 2;
        centerY += ((source.y || 0) + (target.y || 0)) / 2;
        count++;
      }
    });

    if (count === 0) return [];

    centerX /= count;
    centerY /= count;

    // Create control points for smooth curves
    return [
      new THREE.Vector3(centerX * 0.3, centerY * 0.3, 0),
      new THREE.Vector3(centerX * 0.7, centerY * 0.7, 0),
    ];
  }
}

// Frustum culling for viewport-based node filtering
export class ViewportCuller {
  private camera: THREE.Camera;
  private frustum = new THREE.Frustum();
  private matrix = new THREE.Matrix4();

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  updateFrustum() {
    this.matrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.matrix);
  }

  isNodeVisible(node: WebGLNetworkNode, nodeRadius = 5): boolean {
    const sphere = new THREE.Sphere(new THREE.Vector3(node.x || 0, node.y || 0, 0), nodeRadius);
    return this.frustum.intersectsSphere(sphere);
  }

  cullNodes(nodes: WebGLNetworkNode[]): WebGLNetworkNode[] {
    this.updateFrustum();
    return nodes.filter((node) => this.isNodeVisible(node));
  }
}

// Progressive loading for massive datasets
export class ProgressiveLoader {
  private data: WebGLNetworkNode[];
  private batchSize: number;
  private loadedBatches: number = 0;

  constructor(data: WebGLNetworkNode[], batchSize = 1000) {
    this.data = data;
    this.batchSize = batchSize;
  }

  getNextBatch(): { nodes: WebGLNetworkNode[]; hasMore: boolean; progress: number } {
    const start = this.loadedBatches * this.batchSize;
    const end = Math.min(start + this.batchSize, this.data.length);

    const nodes = this.data.slice(start, end);
    this.loadedBatches++;

    return {
      nodes,
      hasMore: end < this.data.length,
      progress: end / this.data.length,
    };
  }

  reset() {
    this.loadedBatches = 0;
  }

  // Prioritize loading based on viewport proximity
  getPrioritizedBatch(centerX: number, centerY: number, radius: number): WebGLNetworkNode[] {
    const unloaded = this.data.slice(this.loadedBatches * this.batchSize);

    // Sort by distance from viewport center
    const prioritized = unloaded
      .map((node) => ({
        node,
        distance: Math.sqrt(
          Math.pow((node.x || 0) - centerX, 2) + Math.pow((node.y || 0) - centerY, 2)
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, this.batchSize)
      .map((item) => item.node);

    this.loadedBatches++;
    return prioritized;
  }
}

// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager;
  private geometryCache = new Map<string, THREE.BufferGeometry>();
  private materialCache = new Map<string, THREE.Material>();
  private textureCache = new Map<string, THREE.Texture>();

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Cache frequently used geometries
  getGeometry(type: string, params: any[]): THREE.BufferGeometry {
    const key = `${type}-${JSON.stringify(params)}`;

    if (!this.geometryCache.has(key)) {
      let geometry: THREE.BufferGeometry;

      switch (type) {
        case 'sphere':
          geometry = new THREE.SphereGeometry(params[0], params[1], params[2]);
          break;
        case 'circle':
          geometry = new THREE.CircleGeometry(params[0], params[1]);
          break;
        default:
          geometry = new THREE.BufferGeometry();
      }

      this.geometryCache.set(key, geometry);
    }

    return this.geometryCache.get(key)!;
  }

  // Cache materials for performance
  getMaterial(type: string, params: any): THREE.Material {
    const key = `${type}-${JSON.stringify(params)}`;

    if (!this.materialCache.has(key)) {
      let material: THREE.Material;

      switch (type) {
        case 'phong':
          material = new THREE.MeshPhongMaterial(params);
          break;
        case 'basic':
          material = new THREE.MeshBasicMaterial(params);
          break;
        case 'line':
          material = new THREE.LineBasicMaterial(params);
          break;
        default:
          material = new THREE.MeshBasicMaterial();
      }

      this.materialCache.set(key, material);
    }

    return this.materialCache.get(key)!;
  }

  // Clean up resources
  dispose() {
    this.geometryCache.forEach((geometry) => geometry.dispose());
    this.materialCache.forEach((material) => material.dispose());
    this.textureCache.forEach((texture) => texture.dispose());

    this.geometryCache.clear();
    this.materialCache.clear();
    this.textureCache.clear();
  }

  // Monitor memory usage
  getMemoryStats(): { geometries: number; materials: number; textures: number } {
    return {
      geometries: this.geometryCache.size,
      materials: this.materialCache.size,
      textures: this.textureCache.size,
    };
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fpsHistory: number[] = [];
  private maxHistoryLength = 60;

  update(): number {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.fpsHistory.push(fps);

      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }

      this.frameCount = 0;
      this.lastTime = now;

      return fps;
    }

    return this.getAverageFPS();
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
  }

  getMinFPS(): number {
    return this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory) : 60;
  }

  getMaxFPS(): number {
    return this.fpsHistory.length > 0 ? Math.max(...this.fpsHistory) : 60;
  }

  reset() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
  }
}

// Adaptive quality settings based on performance
export class AdaptiveQuality {
  private performanceMonitor: PerformanceMonitor;
  private targetFPS = 60;
  private minFPS = 30;
  private currentLOD = 0;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
  }

  update(): { lodLevel: number; shouldReduceQuality: boolean; shouldIncreaseQuality: boolean } {
    const currentFPS = this.performanceMonitor.update();
    const avgFPS = this.performanceMonitor.getAverageFPS();

    let shouldReduceQuality = false;
    let shouldIncreaseQuality = false;

    // Reduce quality if performance is poor
    if (avgFPS < this.minFPS && this.currentLOD < 2) {
      this.currentLOD++;
      shouldReduceQuality = true;
    }

    // Increase quality if performance is good
    if (avgFPS > this.targetFPS && this.currentLOD > 0) {
      this.currentLOD--;
      shouldIncreaseQuality = true;
    }

    return {
      lodLevel: this.currentLOD,
      shouldReduceQuality,
      shouldIncreaseQuality,
    };
  }

  getCurrentQualitySettings() {
    return LOD_CONFIG[this.currentLOD === 0 ? 'HIGH' : this.currentLOD === 1 ? 'MEDIUM' : 'LOW'];
  }

  reset() {
    this.currentLOD = 0;
    this.performanceMonitor.reset();
  }
}
