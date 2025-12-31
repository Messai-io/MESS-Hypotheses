'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useSpring, useTrail } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';

export interface SpringConfig {
  tension: number;
  friction: number;
  mass?: number;
}

// Predefined spring configs for different interaction types
export const SPRING_CONFIGS = {
  gentle: { tension: 120, friction: 14, mass: 1 },
  snappy: { tension: 300, friction: 30, mass: 0.8 },
  wobbly: { tension: 180, friction: 12, mass: 1.2 },
  stiff: { tension: 400, friction: 40, mass: 0.6 },
  slow: { tension: 80, friction: 26, mass: 1.5 },
} as const;

export interface InteractionState {
  isHovered: boolean;
  isPressed: boolean;
  isFocused: boolean;
  isSelected: boolean;
  scale: number;
  rotation: number;
  opacity: number;
}

// Hook for smooth hover interactions with spring physics
export function useHoverSpring(config: SpringConfig = SPRING_CONFIGS.gentle) {
  const [isHovered, setIsHovered] = useState(false);

  const [spring, springApi] = useSpring(() => ({
    scale: 1,
    rotation: 0,
    opacity: 1,
    config,
  }));

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    springApi.start({
      scale: 1.15,
      rotation: 2,
      opacity: 1,
    });
  }, [springApi]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    springApi.start({
      scale: 1,
      rotation: 0,
      opacity: 0.85,
    });
  }, [springApi]);

  return {
    spring,
    isHovered,
    handlers: { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave },
  };
}

// Hook for press interactions with haptic-style feedback
export function usePressSpring(onPress?: () => void, config: SpringConfig = SPRING_CONFIGS.snappy) {
  const [isPressed, setIsPressed] = useState(false);

  const [spring, springApi] = useSpring(() => ({
    scale: 1,
    y: 0,
    config,
  }));

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    springApi.start({
      scale: 0.95,
      y: 2,
    });
  }, [springApi]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    springApi.start({
      scale: 1.05,
      y: -1,
    });
    // Add slight bounce back
    setTimeout(() => {
      springApi.start({ scale: 1, y: 0 });
    }, 100);
    onPress?.();
  }, [springApi, onPress]);

  return {
    spring,
    isPressed,
    handlers: { onMouseDown: handleMouseDown, onMouseUp: handleMouseUp },
  };
}

// Hook for selection state with smooth transitions
export function useSelectionSpring(
  selected: boolean,
  config: SpringConfig = SPRING_CONFIGS.gentle
) {
  const [spring, springApi] = useSpring(() => ({
    scale: selected ? 1.2 : 1,
    glowIntensity: selected ? 1 : 0,
    borderWidth: selected ? 3 : 1,
    config,
  }));

  useEffect(() => {
    springApi.start({
      scale: selected ? 1.2 : 1,
      glowIntensity: selected ? 1 : 0,
      borderWidth: selected ? 3 : 1,
    });
  }, [selected, springApi]);

  return spring;
}

// Hook for smooth focus transitions with accessibility support
export function useFocusSpring(config: SpringConfig = SPRING_CONFIGS.gentle) {
  const [isFocused, setIsFocused] = useState(false);

  const [spring, springApi] = useSpring(() => ({
    outlineWidth: 0,
    outlineOpacity: 0,
    scale: 1,
    config,
  }));

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    springApi.start({
      outlineWidth: 3,
      outlineOpacity: 1,
      scale: 1.05,
    });
  }, [springApi]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    springApi.start({
      outlineWidth: 0,
      outlineOpacity: 0,
      scale: 1,
    });
  }, [springApi]);

  return {
    spring,
    isFocused,
    handlers: { onFocus: handleFocus, onBlur: handleBlur },
  };
}

// Hook for drag interactions with momentum and boundaries
export function useDragInteraction(bounds?: {
  left: number;
  right: number;
  top: number;
  bottom: number;
}) {
  const [spring, springApi] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    config: SPRING_CONFIGS.gentle,
  }));

  const bind = useGesture({
    onDrag: ({ offset: [x, y], dragging }) => {
      let constrainedX = x;
      let constrainedY = y;

      // Apply bounds if provided
      if (bounds) {
        constrainedX = Math.max(bounds.left, Math.min(bounds.right, x));
        constrainedY = Math.max(bounds.top, Math.min(bounds.bottom, y));
      }

      springApi.start({
        x: constrainedX,
        y: constrainedY,
        scale: dragging ? 1.1 : 1,
        immediate: dragging,
      });
    },
    onDragEnd: ({ velocity: [vx, vy] }) => {
      // Add momentum-based animation
      springApi.start({
        x: spring.x.get() + vx * 50,
        y: spring.y.get() + vy * 50,
        config: { ...SPRING_CONFIGS.gentle, velocity: [vx, vy] },
      });
    },
  });

  return { spring, bind };
}

// Hook for smooth zoom interactions with focal point preservation
export function useZoomInteraction(
  minZoom: number = 0.1,
  maxZoom: number = 5,
  initialZoom: number = 1
) {
  const [zoom, setZoom] = useState(initialZoom);
  const [center, setCenter] = useState({ x: 0, y: 0 });

  const [spring, springApi] = useSpring(() => ({
    scale: initialZoom,
    x: 0,
    y: 0,
    config: SPRING_CONFIGS.gentle,
  }));

  const zoomTo = useCallback(
    (newZoom: number, focalPoint?: { x: number; y: number }) => {
      const constrainedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

      if (focalPoint) {
        // Preserve focal point during zoom
        const deltaZoom = constrainedZoom / zoom;
        const newCenterX = focalPoint.x - (focalPoint.x - center.x) * deltaZoom;
        const newCenterY = focalPoint.y - (focalPoint.y - center.y) * deltaZoom;

        setCenter({ x: newCenterX, y: newCenterY });
        springApi.start({
          scale: constrainedZoom,
          x: newCenterX,
          y: newCenterY,
        });
      } else {
        springApi.start({ scale: constrainedZoom });
      }

      setZoom(constrainedZoom);
    },
    [zoom, center, minZoom, maxZoom, springApi]
  );

  const bind = useGesture({
    onWheel: ({ event, delta: [, dy] }) => {
      event.preventDefault();
      const newZoom = zoom * (1 - dy * 0.002);
      const rect = (event.target as Element).getBoundingClientRect();
      const focalPoint = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
      zoomTo(newZoom, focalPoint);
    },
    onPinch: ({ offset: [scale], origin: [ox, oy] }) => {
      const newZoom = zoom * scale;
      zoomTo(newZoom, { x: ox, y: oy });
    },
  });

  return { spring, zoom, zoomTo, bind };
}

// Hook for staggered animations of multiple elements
export function useStaggeredSpring<T>(
  items: T[],
  config: SpringConfig = SPRING_CONFIGS.gentle,
  staggerDelay: number = 50
) {
  const trail = useTrail(items.length, {
    from: { opacity: 0, scale: 0.8, y: 20 },
    to: { opacity: 1, scale: 1, y: 0 },
    config,
    trail: staggerDelay,
  });

  const reset = useCallback(() => {
    trail[1].start({
      from: { opacity: 0, scale: 0.8, y: 20 },
      to: { opacity: 1, scale: 1, y: 0 },
    });
  }, [trail]);

  return { trail, reset };
}

// Hook for smooth page/view transitions
export function useViewTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [spring, springApi] = useSpring(() => ({
    opacity: 1,
    scale: 1,
    x: 0,
    config: SPRING_CONFIGS.gentle,
  }));

  const transitionTo = useCallback(
    async (direction: 'left' | 'right' | 'up' | 'down' = 'right') => {
      setIsTransitioning(true);

      // Exit animation
      const exitProps: any = { opacity: 0, scale: 0.95 };
      if (direction === 'left') exitProps.x = -100;
      if (direction === 'right') exitProps.x = 100;
      if (direction === 'up') exitProps.y = -100;
      if (direction === 'down') exitProps.y = 100;

      await springApi.start(exitProps);

      // Reset position for enter animation
      const resetProps: any = { scale: 0.95, opacity: 0 };
      if (direction === 'left') resetProps.x = 100;
      if (direction === 'right') resetProps.x = -100;
      if (direction === 'up') resetProps.y = 100;
      if (direction === 'down') resetProps.y = -100;

      springApi.set(resetProps);

      // Enter animation
      await springApi.start({
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      });

      setIsTransitioning(false);
    },
    [springApi]
  );

  return { spring, isTransitioning, transitionTo };
}

// Hook for smooth momentum-based panning
export function useMomentumPan(bounds?: { width: number; height: number }) {
  const velocity = useRef({ x: 0, y: 0 });
  const lastTime = useRef(Date.now());

  const [spring, springApi] = useSpring(() => ({
    x: 0,
    y: 0,
    config: SPRING_CONFIGS.gentle,
  }));

  const bind = useGesture({
    onDrag: ({ movement: [mx, my], dragging, timeStamp }) => {
      if (dragging) {
        const dt = timeStamp - lastTime.current;
        velocity.current.x = mx / Math.max(dt, 1);
        velocity.current.y = my / Math.max(dt, 1);
        lastTime.current = timeStamp;

        springApi.start({
          x: mx,
          y: my,
          immediate: true,
        });
      }
    },
    onDragEnd: () => {
      // Apply momentum
      const momentumX = velocity.current.x * 200;
      const momentumY = velocity.current.y * 200;

      let finalX = spring.x.get() + momentumX;
      let finalY = spring.y.get() + momentumY;

      // Apply bounds if provided
      if (bounds) {
        finalX = Math.max(-bounds.width / 2, Math.min(bounds.width / 2, finalX));
        finalY = Math.max(-bounds.height / 2, Math.min(bounds.height / 2, finalY));
      }

      springApi.start({
        x: finalX,
        y: finalY,
        config: SPRING_CONFIGS.gentle,
      });

      velocity.current = { x: 0, y: 0 };
    },
  });

  const resetPosition = useCallback(() => {
    springApi.start({ x: 0, y: 0 });
  }, [springApi]);

  return { spring, bind, resetPosition };
}
