'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useSpring } from '@react-spring/web';
import { SPRING_CONFIGS } from './useEnhancedInteractions';

export interface AccessibilityOptions {
  announceChanges?: boolean;
  enableKeyboardNav?: boolean;
  respectReducedMotion?: boolean;
  highContrastMode?: boolean;
  focusTrapping?: boolean;
}

export interface KeyboardNavigation {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
  onTab?: (shift: boolean) => void;
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  navigation: KeyboardNavigation,
  enabled: boolean = true,
  preventDefault: string[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const key = event.key;
      const shiftKey = event.shiftKey;

      // Prevent default for specified keys
      if (preventDefault.includes(key)) {
        event.preventDefault();
      }

      switch (key) {
        case 'ArrowUp':
          navigation.onArrowUp?.();
          break;
        case 'ArrowDown':
          navigation.onArrowDown?.();
          break;
        case 'ArrowLeft':
          navigation.onArrowLeft?.();
          break;
        case 'ArrowRight':
          navigation.onArrowRight?.();
          break;
        case 'Enter':
          navigation.onEnter?.();
          break;
        case 'Escape':
          navigation.onEscape?.();
          break;
        case ' ':
          if (preventDefault.includes('Space')) {
            event.preventDefault();
          }
          navigation.onSpace?.();
          break;
        case 'Tab':
          navigation.onTab?.(shiftKey);
          break;
      }
    },
    [navigation, enabled, preventDefault]
  );

  return { onKeyDown: handleKeyDown };
}

// Hook for focus management with smooth visual feedback
export function useFocusManagement(initialFocusIndex: number = 0) {
  const [focusedIndex, setFocusedIndex] = useState(initialFocusIndex);
  const [items, setItems] = useState<HTMLElement[]>([]);
  const containerRef = useRef<HTMLElement>(null);

  const focusSpring = useSpring({
    transform: `translateY(${focusedIndex * 40}px)`, // Adjust based on item height
    opacity: 1,
    config: SPRING_CONFIGS.snappy,
  });

  const registerItem = useCallback((element: HTMLElement | null, index: number) => {
    if (!element) return;

    setItems((prev) => {
      // Only update if the element at this index is different
      if (prev[index] === element) {
        return prev;
      }

      const newItems = [...prev];
      newItems[index] = element;
      return newItems;
    });
  }, []);

  const focusItem = useCallback(
    (index: number) => {
      if (index >= 0 && index < items.length && items[index]) {
        setFocusedIndex(index);
        items[index].focus();

        // Scroll into view if needed
        if (containerRef.current) {
          const container = containerRef.current;
          const item = items[index];
          const containerRect = container.getBoundingClientRect();
          const itemRect = item.getBoundingClientRect();

          if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    },
    [items]
  );

  const moveFocus = useCallback(
    (direction: 'up' | 'down' | 'first' | 'last') => {
      let newIndex: number;

      switch (direction) {
        case 'up':
          newIndex = Math.max(0, focusedIndex - 1);
          break;
        case 'down':
          newIndex = Math.min(items.length - 1, focusedIndex + 1);
          break;
        case 'first':
          newIndex = 0;
          break;
        case 'last':
          newIndex = items.length - 1;
          break;
      }

      focusItem(newIndex);
    },
    [focusedIndex, items.length, focusItem]
  );

  return {
    focusedIndex,
    focusSpring,
    containerRef,
    registerItem,
    focusItem,
    moveFocus,
  };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) {
      // Create announcement element if it doesn't exist
      const element = document.createElement('div');
      element.setAttribute('aria-live', priority);
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      document.body.appendChild(element);
      announcementRef.current = element;
    }

    // Clear previous message and set new one
    announcementRef.current.textContent = '';
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
    }, 100);
  }, []);

  const announceNodeSelection = useCallback(
    (nodeName: string, discipline: string, isKnowledgeGap: boolean) => {
      const gapText = isKnowledgeGap ? ' - Knowledge Gap' : '';
      announce(`Selected node: ${nodeName}, ${discipline.replace('_', ' ')}${gapText}`, 'polite');
    },
    [announce]
  );

  const announceFilter = useCallback(
    (filterType: string, value: string) => {
      announce(`Filter applied: ${filterType} set to ${value}`, 'polite');
    },
    [announce]
  );

  const announceSearchResult = useCallback(
    (count: number, query: string) => {
      const resultText = count === 1 ? 'result' : 'results';
      announce(`${count} ${resultText} found for "${query}"`, 'polite');
    },
    [announce]
  );

  return {
    announce,
    announceNodeSelection,
    announceFilter,
    announceSearchResult,
  };
}

// Hook for focus trapping within a modal or panel
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll(selectors)) as HTMLElement[];
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive || event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [isActive, getFocusableElements]
  );

  useEffect(() => {
    if (isActive) {
      // Store previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus first focusable element
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      // Add event listener
      document.addEventListener('keydown', handleKeyDown);
    } else {
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }

      // Remove event listener
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, getFocusableElements, handleKeyDown]);

  return { containerRef };
}

// Hook for detecting user preferences
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState({
    reduceMotion: false,
    highContrast: false,
    forceFocus: false,
  });

  useEffect(() => {
    const updatePreferences = () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const forceFocus = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;

      setPreferences({
        reduceMotion,
        highContrast,
        forceFocus,
      });
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-transparency: reduce)'),
    ];

    mediaQueries.forEach((mq) => mq.addEventListener('change', updatePreferences));

    return () => {
      mediaQueries.forEach((mq) => mq.removeEventListener('change', updatePreferences));
    };
  }, []);

  return preferences;
}

// Hook for accessible tooltips
export function useAccessibleTooltip() {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState('');
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const show = useCallback((message: string) => {
    setContent(message);
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const tooltipProps = {
    role: 'tooltip',
    id: tooltipId.current,
    'aria-hidden': !isVisible,
  };

  const triggerProps = {
    'aria-describedby': isVisible ? tooltipId.current : undefined,
    onMouseEnter: () => show(content),
    onMouseLeave: hide,
    onFocus: () => show(content),
    onBlur: hide,
  };

  return {
    isVisible,
    content,
    triggerRef,
    tooltipProps,
    triggerProps,
    show,
    hide,
  };
}

// Hook for accessible form validation
export function useAccessibleValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback((fieldName: string, value: any, rules: any) => {
    let error = '';

    if (rules.required && (!value || value.toString().trim() === '')) {
      error = `${fieldName} is required`;
    } else if (rules.min && value < rules.min) {
      error = `${fieldName} must be at least ${rules.min}`;
    } else if (rules.max && value > rules.max) {
      error = `${fieldName} must not exceed ${rules.max}`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      error = rules.message || `${fieldName} format is invalid`;
    }

    setErrors((prev) => ({ ...prev, [fieldName]: error }));
    return error === '';
  }, []);

  const touch = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  const getFieldProps = useCallback(
    (fieldName: string) => {
      const hasError = touched[fieldName] && errors[fieldName];
      const errorId = `${fieldName}-error`;

      return {
        'aria-invalid': hasError ? 'true' : 'false',
        'aria-describedby': hasError ? errorId : undefined,
        onBlur: () => touch(fieldName),
      };
    },
    [touched, errors, touch]
  );

  const getErrorProps = useCallback(
    (fieldName: string) => {
      const hasError = touched[fieldName] && errors[fieldName];

      return {
        id: `${fieldName}-error`,
        role: 'alert',
        'aria-live': 'polite',
        style: { display: hasError ? 'block' : 'none' },
      };
    },
    [touched, errors]
  );

  return {
    errors,
    touched,
    validate,
    touch,
    getFieldProps,
    getErrorProps,
    hasErrors: Object.values(errors).some((error) => error !== ''),
  };
}

// Comprehensive accessibility hook for the knowledge gap visualization
export function useVisualizationAccessibility(options: AccessibilityOptions = {}) {
  const {
    announceChanges = true,
    enableKeyboardNav = true,
    respectReducedMotion = true,
    highContrastMode = false,
    focusTrapping = false,
  } = options;

  const screenReader = useScreenReader();
  const preferences = useAccessibilityPreferences();
  const { containerRef } = useFocusTrap(focusTrapping);

  // Combine preferences with explicit options
  const effectivePreferences = {
    reduceMotion: respectReducedMotion ? preferences.reduceMotion : false,
    highContrast: highContrastMode || preferences.highContrast,
    enableKeyboard: enableKeyboardNav,
    announcements: announceChanges,
  };

  const announceVisualizationState = useCallback(
    (totalNodes: number, visibleNodes: number, knowledgeGaps: number) => {
      if (!effectivePreferences.announcements) return;

      screenReader.announce(
        `Visualization updated: ${visibleNodes} of ${totalNodes} nodes visible, ${knowledgeGaps} knowledge gaps identified`,
        'polite'
      );
    },
    [screenReader, effectivePreferences.announcements]
  );

  const announceFilterChange = useCallback(
    (filterName: string, value: string) => {
      if (!effectivePreferences.announcements) return;

      screenReader.announceFilter(filterName, value);
    },
    [screenReader, effectivePreferences.announcements]
  );

  const announceNodeInteraction = useCallback(
    (
      action: 'selected' | 'focused' | 'activated',
      nodeName: string,
      discipline: string,
      isKnowledgeGap: boolean
    ) => {
      if (!effectivePreferences.announcements) return;

      const actionText =
        action === 'selected' ? 'Selected' : action === 'focused' ? 'Focused on' : 'Activated';
      const gapText = isKnowledgeGap ? ', marked as knowledge gap' : '';

      screenReader.announce(
        `${actionText} node: ${nodeName}, in ${discipline.replace('_', ' ')} discipline${gapText}`,
        action === 'selected' ? 'assertive' : 'polite'
      );
    },
    [screenReader, effectivePreferences.announcements]
  );

  return {
    containerRef,
    preferences: effectivePreferences,
    announceVisualizationState,
    announceFilterChange,
    announceNodeInteraction,
    ...screenReader,
  };
}
