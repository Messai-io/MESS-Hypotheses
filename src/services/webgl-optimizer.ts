import * as THREE from 'three';
import type { WebGLNetworkNode } from '../WebGLRadialNetwork';

/**
 * WebGL Performance Optimizer for Large-Scale Knowledge Graph Visualization
 * Implements instanced rendering, LOD, and frustum culling for 2000+ nodes
 */
export class WebGLOptimizer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;

  // Instanced mesh for nodes
  private nodeInstancedMesh: THREE.InstancedMesh | null = null;
  private linkInstancedMesh: THREE.InstancedMesh | null = null;

  // LOD (Level of Detail) groups
  private lodGroups: Map<string, THREE.LOD> = new Map();

  // Performance metrics
  private frameCount = 0;
  private lastFPSUpdate = 0;
  private currentFPS = 60;

  // Culling parameters
  private frustum = new THREE.Frustum();
  private frustumMatrix = new THREE.Matrix4();

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // Enable performance optimizations
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.sortObjects = false; // We'll handle sorting ourselves
  }

  /**
   * Create instanced mesh for nodes
   */
  createNodeInstances(nodes: WebGLNetworkNode[], maxInstances: number = 5000): THREE.InstancedMesh {
    // Clean up existing instances
    if (this.nodeInstancedMesh) {
      this.scene.remove(this.nodeInstancedMesh);
      this.nodeInstancedMesh.geometry.dispose();
      (this.nodeInstancedMesh.material as THREE.Material).dispose();
    }

    // Create optimized geometry (lower poly count for better performance)
    const geometry = new THREE.SphereGeometry(1, 8, 6); // Reduced segments

    // Create material with vertex colors for per-instance coloring
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      emissive: new THREE.Color(0x111111),
      emissiveIntensity: 0.1,
    });

    // Create instanced mesh
    this.nodeInstancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    this.nodeInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.nodeInstancedMesh.frustumCulled = false; // We'll do custom culling

    // Set up instance data
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    const colors = new Float32Array(maxInstances * 3);

    nodes.forEach((node, index) => {
      if (index >= maxInstances) return;

      // Set position and scale
      const scale = node.radius || 5;
      matrix.makeScale(scale, scale, scale);
      matrix.setPosition(node.position?.x || 0, node.position?.y || 0, node.position?.z || 0);
      this.nodeInstancedMesh!.setMatrixAt(index, matrix);

      // Set color based on discipline
      color.set(this.getDisciplineColor(node.discipline));
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;

      // Set color at index
      this.nodeInstancedMesh!.setColorAt(index, color);
    });

    // Update instance count
    this.nodeInstancedMesh.count = Math.min(nodes.length, maxInstances);
    this.nodeInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.nodeInstancedMesh.instanceColor) {
      this.nodeInstancedMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.nodeInstancedMesh);

    return this.nodeInstancedMesh;
  }

  /**
   * Create LOD levels for detailed node representations
   */
  createNodeLOD(node: WebGLNetworkNode): THREE.LOD {
    const lod = new THREE.LOD();

    // High detail (close range) - Full sphere with text
    const highDetail = new THREE.Group();
    const highGeometry = new THREE.SphereGeometry(node.radius || 5, 16, 12);
    const highMaterial = new THREE.MeshPhongMaterial({
      color: this.getDisciplineColor(node.discipline),
      emissive: new THREE.Color(0x111111),
      emissiveIntensity: 0.2,
    });
    const highMesh = new THREE.Mesh(highGeometry, highMaterial);
    highDetail.add(highMesh);
    lod.addLevel(highDetail, 0);

    // Medium detail (medium range) - Lower poly sphere
    const mediumGeometry = new THREE.SphereGeometry(node.radius || 5, 8, 6);
    const mediumMaterial = new THREE.MeshPhongMaterial({
      color: this.getDisciplineColor(node.discipline),
    });
    const mediumMesh = new THREE.Mesh(mediumGeometry, mediumMaterial);
    lod.addLevel(mediumMesh, 100);

    // Low detail (far range) - Billboard/sprite
    const spriteMap = this.createNodeSprite(node);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: spriteMap,
      sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set((node.radius || 5) * 2, (node.radius || 5) * 2, 1);
    lod.addLevel(sprite, 300);

    // Position the LOD
    lod.position.set(node.position?.x || 0, node.position?.y || 0, node.position?.z || 0);

    this.lodGroups.set(node.id, lod);

    return lod;
  }

  /**
   * Create sprite texture for distant nodes
   */
  private createNodeSprite(node: WebGLNetworkNode): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;

    // Draw circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 28;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.fillStyle = this.getDisciplineColor(node.discipline);
    context.fill();

    // Add border for knowledge gaps
    if (node.isKnowledgeGap) {
      context.strokeStyle = '#ff0000';
      context.lineWidth = 3;
      context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Perform frustum culling to hide off-screen objects
   */
  performFrustumCulling(nodes: WebGLNetworkNode[]): number {
    // Update frustum from camera
    this.frustumMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.frustumMatrix);

    let visibleCount = 0;
    const tempSphere = new THREE.Sphere();

    nodes.forEach((node, index) => {
      if (!node.position) return;

      // Create bounding sphere for node
      tempSphere.center.set(node.position.x, node.position.y, node.position.z || 0);
      tempSphere.radius = (node.radius || 5) * 2; // Include some margin

      // Check if in frustum
      const isVisible = this.frustum.intersectsSphere(tempSphere);

      // Update visibility
      if (this.nodeInstancedMesh && index < this.nodeInstancedMesh.count) {
        // For instanced mesh, we can't hide individual instances
        // Instead, we move them far away or scale them to 0
        if (!isVisible) {
          const matrix = new THREE.Matrix4();
          matrix.makeScale(0, 0, 0); // Hide by scaling to 0
          this.nodeInstancedMesh.setMatrixAt(index, matrix);
        }
      }

      // Update LOD visibility
      const lod = this.lodGroups.get(node.id);
      if (lod) {
        lod.visible = isVisible;
      }

      if (isVisible) visibleCount++;
    });

    if (this.nodeInstancedMesh) {
      this.nodeInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    return visibleCount;
  }

  /**
   * Update LOD levels based on camera distance
   */
  updateLODs(): void {
    this.lodGroups.forEach((lod) => {
      lod.update(this.camera);
    });
  }

  /**
   * Optimize render order for transparency and performance
   */
  optimizeRenderOrder(transparentObjects: THREE.Object3D[]): void {
    // Sort transparent objects back to front
    transparentObjects.sort((a, b) => {
      const distA = a.position.distanceToSquared(this.camera.position);
      const distB = b.position.distanceToSquared(this.camera.position);
      return distB - distA;
    });

    // Update render order
    transparentObjects.forEach((obj, index) => {
      obj.renderOrder = index;
    });
  }

  /**
   * Batch geometry updates for better performance
   */
  batchGeometryUpdates(
    updates: Array<{ node: WebGLNetworkNode; property: string; value: any }>
  ): void {
    const matricesToUpdate = new Set<number>();
    const colorsToUpdate = new Set<number>();

    updates.forEach(({ node, property, value }) => {
      const index = this.getNodeIndex(node);
      if (index === -1 || !this.nodeInstancedMesh) return;

      switch (property) {
        case 'position':
          const matrix = new THREE.Matrix4();
          this.nodeInstancedMesh.getMatrixAt(index, matrix);
          matrix.setPosition(value.x, value.y, value.z || 0);
          this.nodeInstancedMesh.setMatrixAt(index, matrix);
          matricesToUpdate.add(index);
          break;

        case 'color':
          const color = new THREE.Color(value);
          this.nodeInstancedMesh.setColorAt(index, color);
          colorsToUpdate.add(index);
          break;

        case 'scale':
          const scaleMatrix = new THREE.Matrix4();
          this.nodeInstancedMesh.getMatrixAt(index, scaleMatrix);
          scaleMatrix.makeScale(value, value, value);
          this.nodeInstancedMesh.setMatrixAt(index, scaleMatrix);
          matricesToUpdate.add(index);
          break;
      }
    });

    // Apply updates in batch
    if (matricesToUpdate.size > 0 && this.nodeInstancedMesh) {
      this.nodeInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    if (colorsToUpdate.size > 0 && this.nodeInstancedMesh?.instanceColor) {
      this.nodeInstancedMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Calculate and display FPS
   */
  updateFPS(): number {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFPSUpdate >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.lastFPSUpdate = now;
    }

    return this.currentFPS;
  }

  /**
   * Enable/disable shadows dynamically based on performance
   */
  toggleShadows(enable: boolean): void {
    this.renderer.shadowMap.enabled = enable;

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = enable;
        object.receiveShadow = enable;
      }
    });
  }

  /**
   * Adjust quality settings based on performance
   */
  autoAdjustQuality(targetFPS: number = 30): void {
    const fps = this.updateFPS();

    if (fps < targetFPS - 5) {
      // Reduce quality
      this.toggleShadows(false);
      this.renderer.setPixelRatio(1);
    } else if (fps > targetFPS + 10) {
      // Increase quality
      this.toggleShadows(true);
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }
  }

  /**
   * Get discipline color
   */
  private getDisciplineColor(discipline: string): string {
    const colors: Record<string, string> = {
      bioelectrochemistry: '#001a3d',
      electron_transfer: '#ff6b00',
      electrode_materials: '#2a2a2a',
      reactor_design: '#4a5568',
      microbial_communities: '#22c55e',
      environmental_systems: '#0ea5e9',
      system_control: '#8b5cf6',
      techno_economics: '#f59e0b',
    };

    return colors[discipline] || '#666666';
  }

  /**
   * Get node index in instanced mesh
   */
  private getNodeIndex(node: WebGLNetworkNode): number {
    // This would need to be tracked in a Map for real implementation
    // For now, return -1 to indicate not found
    return -1;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Dispose instanced meshes
    if (this.nodeInstancedMesh) {
      this.nodeInstancedMesh.geometry.dispose();
      (this.nodeInstancedMesh.material as THREE.Material).dispose();
      this.scene.remove(this.nodeInstancedMesh);
    }

    if (this.linkInstancedMesh) {
      this.linkInstancedMesh.geometry.dispose();
      (this.linkInstancedMesh.material as THREE.Material).dispose();
      this.scene.remove(this.linkInstancedMesh);
    }

    // Dispose LODs
    this.lodGroups.forEach((lod) => {
      lod.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.scene.remove(lod);
    });

    this.lodGroups.clear();
  }
}
