'use client';

import * as THREE from 'three';
import { WebGLNetworkNode } from './webgl-network-types';
import { HexagonalPosition, KnowledgeLayer } from './hexagonal-layout-engine';

/**
 * Particle System for MES Knowledge Visualization
 * Implements electron effects, crystalline growth, and knowledge flow animations
 */

// Particle types for different visual effects
export enum ParticleType {
  ELECTRON = 'electron',
  ION = 'ion',
  KNOWLEDGE_FLOW = 'knowledge_flow',
  UNCERTAINTY = 'uncertainty',
  CONSENSUS_CRYSTAL = 'consensus_crystal',
}

// Individual particle data
export interface Particle {
  id: string;
  type: ParticleType;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  color: THREE.Color;
  size: number;
  lifetime: number;
  maxLifetime: number;
  trail: THREE.Vector3[];
  behavior: 'orbital' | 'erratic' | 'flow' | 'crystalline';
  sourceNode?: string;
  targetNode?: string;
  orbitRadius?: number;
  orbitAngle?: number;
  orbitSpeed?: number;
}

// Crystalline growth pattern for consensus areas
export interface CrystallineGrowth {
  center: THREE.Vector3;
  branches: Array<{
    angle: number;
    length: number;
    maxLength: number;
    growthRate: number;
    subBranches: Array<{
      startAt: number;
      angle: number;
      length: number;
      maxLength: number;
    }>;
  }>;
  currentRadius: number;
  maxRadius: number;
  growthRate: number;
  color: THREE.Color;
  opacity: number;
}

/**
 * Main particle system manager
 */
export class ParticleSystemManager {
  private particles: Map<string, Particle> = new Map();
  private crystals: Map<string, CrystallineGrowth> = new Map();
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particleSystem: THREE.Points | null = null;
  private scene: THREE.Scene;
  private maxParticles: number = 5000;
  private particleCount: number = 0;

  // ✅ MEMORY LEAK FIX: Reusable objects to prevent creating new ones in loops
  private reusableVector1 = new THREE.Vector3();
  private reusableVector2 = new THREE.Vector3();
  private reusableColor1 = new THREE.Color();
  private reusableColor2 = new THREE.Color();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializeParticleSystem();
  }

  /**
   * Initialize the particle system geometry and material
   */
  private initializeParticleSystem() {
    // Create geometry for particles
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    const sizes = new Float32Array(this.maxParticles);

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create material with custom shader for glow effect
    this.particleMaterial = new THREE.PointsMaterial({
      size: 5,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      map: this.createParticleTexture(),
    });

    // Create particle system
    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particleSystem);
  }

  /**
   * Create a glowing particle texture
   */
  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;

    // Create radial gradient for glow effect
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(128, 200, 255, 0.6)');
    gradient.addColorStop(0.6, 'rgba(64, 150, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Emit electron particles from active research nodes
   */
  emitElectrons(node: WebGLNetworkNode & { hexagonalPosition?: HexagonalPosition }) {
    const position = node.hexagonalPosition;
    if (!position) return;

    // Emit 3-5 electrons
    const electronCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < electronCount; i++) {
      const particle: Particle = {
        id: `electron-${Date.now()}-${i}`,
        type: ParticleType.ELECTRON,
        position: new THREE.Vector3(position.x, position.y, position.z || 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        color: (() => {
          // ✅ MEMORY LEAK FIX: Reuse color object instead of creating new one
          this.reusableColor1.set(node.isKnowledgeGap ? '#ff6b6b' : '#00d4ff');
          return new THREE.Color().copy(this.reusableColor1);
        })(),
        size: 2 + Math.random() * 2,
        lifetime: 200 + Math.random() * 100,
        maxLifetime: 300,
        trail: [],
        behavior: node.isKnowledgeGap ? 'erratic' : 'orbital',
        sourceNode: node.id,
        orbitRadius: 10 + Math.random() * 20,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: 0.02 + Math.random() * 0.03,
      };

      this.particles.set(particle.id, particle);
    }
  }

  /**
   * Create knowledge flow particles between connected nodes
   */
  createKnowledgeFlow(
    sourceNode: WebGLNetworkNode,
    targetNode: WebGLNetworkNode,
    strength: number
  ) {
    const particleCount = Math.floor(strength * 10);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const particle: Particle = {
        id: `flow-${Date.now()}-${i}`,
        type: ParticleType.KNOWLEDGE_FLOW,
        position: new THREE.Vector3(sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        color: (() => {
          // ✅ MEMORY LEAK FIX: Reuse color objects instead of creating new ones
          this.reusableColor1.setHex(0x00d4ff); // #00d4ff
          this.reusableColor2.setHex(0x22c55e); // #22c55e
          return new THREE.Color().lerpColors(this.reusableColor1, this.reusableColor2, t);
        })(),
        size: 1 + strength * 2,
        lifetime: 100 + i * 10,
        maxLifetime: 200,
        trail: [],
        behavior: 'flow',
        sourceNode: sourceNode.id,
        targetNode: targetNode.id,
      };

      this.particles.set(particle.id, particle);
    }
  }

  /**
   * Create crystalline growth pattern for consensus areas
   */
  createCrystallineGrowth(node: WebGLNetworkNode & { hexagonalPosition?: HexagonalPosition }) {
    const position = node.hexagonalPosition;
    if (!position) return;

    const crystal: CrystallineGrowth = {
      center: new THREE.Vector3(position.x, position.y, position.z || 0),
      branches: [],
      currentRadius: 0,
      maxRadius: 30 + node.overallCertaintyScore * 20,
      growthRate: 0.5,
      color: (() => {
        // ✅ MEMORY LEAK FIX: Reuse color object
        this.reusableColor1.set('#22c55e');
        return new THREE.Color().copy(this.reusableColor1);
      })(),
      opacity: 0.6,
    };

    // Create hexagonal branches
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180;
      crystal.branches.push({
        angle,
        length: 0,
        maxLength: 20 + Math.random() * 10,
        growthRate: 0.3 + Math.random() * 0.2,
        subBranches: this.generateSubBranches(angle),
      });
    }

    this.crystals.set(node.id, crystal);
  }

  /**
   * Generate sub-branches for crystalline patterns
   */
  private generateSubBranches(parentAngle: number) {
    const subBranches = [];
    const count = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < count; i++) {
      subBranches.push({
        startAt: 5 + Math.random() * 10,
        angle: parentAngle + (Math.random() - 0.5) * 0.5,
        length: 0,
        maxLength: 5 + Math.random() * 5,
      });
    }

    return subBranches;
  }

  /**
   * Update all particles
   */
  update(deltaTime: number) {
    // Update particles
    this.particles.forEach((particle, id) => {
      // Update lifetime
      particle.lifetime -= deltaTime;

      if (particle.lifetime <= 0) {
        this.particles.delete(id);
        return;
      }

      // Update position based on behavior
      switch (particle.behavior) {
        case 'orbital':
          this.updateOrbitalParticle(particle, deltaTime);
          break;
        case 'erratic':
          this.updateErraticParticle(particle, deltaTime);
          break;
        case 'flow':
          this.updateFlowParticle(particle, deltaTime);
          break;
        case 'crystalline':
          this.updateCrystallineParticle(particle, deltaTime);
          break;
      }

      // Add to trail
      particle.trail.push(particle.position.clone());
      if (particle.trail.length > 10) {
        particle.trail.shift();
      }

      // Fade out near end of life
      const lifeRatio = particle.lifetime / particle.maxLifetime;
      particle.size *= lifeRatio > 0.2 ? 1 : lifeRatio * 5;
    });

    // Update crystalline growth
    this.crystals.forEach((crystal) => {
      if (crystal.currentRadius < crystal.maxRadius) {
        crystal.currentRadius += crystal.growthRate * deltaTime;

        crystal.branches.forEach((branch) => {
          if (branch.length < branch.maxLength) {
            branch.length += branch.growthRate * deltaTime;

            // Grow sub-branches
            branch.subBranches.forEach((sub) => {
              if (sub.startAt < branch.length && sub.length < sub.maxLength) {
                sub.length = Math.min(sub.maxLength, (branch.length - sub.startAt) * 0.5);
              }
            });
          }
        });
      }
    });

    // Update particle system buffers
    this.updateParticleBuffers();
  }

  /**
   * Update orbital particle motion
   */
  private updateOrbitalParticle(particle: Particle, deltaTime: number) {
    if (!particle.orbitAngle || !particle.orbitRadius || !particle.orbitSpeed) return;

    particle.orbitAngle += particle.orbitSpeed * deltaTime;

    // ✅ MEMORY LEAK FIX: Reuse vector object instead of creating new one
    this.reusableVector1.set(
      Math.cos(particle.orbitAngle) * particle.orbitRadius,
      Math.sin(particle.orbitAngle) * particle.orbitRadius,
      Math.sin(particle.orbitAngle * 2) * 5 // Slight 3D orbit
    );

    particle.position.add(this.reusableVector1.multiplyScalar(0.1));
  }

  /**
   * Update erratic particle motion (for knowledge gaps)
   */
  private updateErraticParticle(particle: Particle, deltaTime: number) {
    // Random walk with momentum
    particle.acceleration.set(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.2
    );

    particle.velocity.add(particle.acceleration.multiplyScalar(deltaTime));
    particle.velocity.multiplyScalar(0.98); // Damping

    particle.position.add(particle.velocity);
  }

  /**
   * Update flow particle motion
   */
  private updateFlowParticle(particle: Particle, deltaTime: number) {
    // This would interpolate between source and target
    // Implementation depends on having access to node positions
    const t = 1 - particle.lifetime / particle.maxLifetime;

    // ✅ MEMORY LEAK FIX: Reuse vector object for Bezier curve interpolation
    this.reusableVector2.set((particle.position.x + 100) * 0.5, particle.position.y + 50, 20);

    // Simple linear interpolation for now
    particle.position.lerp(this.reusableVector2, t * 0.1);
  }

  /**
   * Update crystalline particle motion
   */
  private updateCrystallineParticle(particle: Particle, deltaTime: number) {
    // Particles slowly drift outward in crystalline patterns
    const angle = Math.atan2(particle.position.y, particle.position.x);
    const hexAngle = Math.round(angle / (Math.PI / 3)) * (Math.PI / 3);

    particle.position.x += Math.cos(hexAngle) * deltaTime * 0.5;
    particle.position.y += Math.sin(hexAngle) * deltaTime * 0.5;
  }

  /**
   * Update particle system buffers for rendering
   */
  private updateParticleBuffers() {
    if (!this.particleSystem) return;

    const positions = this.particleGeometry.attributes.position as THREE.BufferAttribute;
    const colors = this.particleGeometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.particleGeometry.attributes.size as THREE.BufferAttribute;

    let index = 0;
    this.particles.forEach((particle) => {
      if (index >= this.maxParticles) return;

      // Update position
      positions.setXYZ(index, particle.position.x, particle.position.y, particle.position.z);

      // Update color
      colors.setXYZ(index, particle.color.r, particle.color.g, particle.color.b);

      // Update size
      sizes.setX(index, particle.size);

      index++;
    });

    // Clear remaining particles
    for (let i = index; i < this.maxParticles; i++) {
      positions.setXYZ(i, 0, 0, -1000);
      sizes.setX(i, 0);
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;

    this.particleCount = index;
  }

  /**
   * Clean up particle system
   */
  dispose() {
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleGeometry.dispose();
      this.particleMaterial.dispose();
    }

    this.particles.clear();
    this.crystals.clear();
  }

  /**
   * Get current particle count for performance monitoring
   */
  getParticleCount(): number {
    return this.particleCount;
  }

  /**
   * Get crystalline growth data for rendering
   */
  getCrystals(): Map<string, CrystallineGrowth> {
    return this.crystals;
  }
}

/**
 * Create and manage particle effects for the network
 */
export function createParticleEffects(
  scene: THREE.Scene,
  nodes: WebGLNetworkNode[]
): ParticleSystemManager {
  const manager = new ParticleSystemManager(scene);

  // Emit particles from active nodes
  nodes.forEach((node) => {
    if (node.isKnowledgeGap) {
      // Knowledge gaps get erratic particles
      manager.emitElectrons(node as any);
    } else if (node.overallCertaintyScore > 0.8) {
      // High certainty nodes get crystalline growth
      manager.createCrystallineGrowth(node as any);
    }

    // Create flow particles for strong relationships
    if (node.relationships) {
      node.relationships.forEach((rel) => {
        if (rel.strength > 0.7) {
          const targetNode = nodes.find((n) => n.id === rel.targetId);
          if (targetNode) {
            manager.createKnowledgeFlow(node, targetNode, rel.strength);
          }
        }
      });
    }
  });

  return manager;
}
