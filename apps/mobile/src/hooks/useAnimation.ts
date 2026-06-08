// ╔══════════════════════════════════════════════════════════════════════╗
// ║  useAnimation — animated value hooks for entry/exit transitions     ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useRef, useEffect, useCallback, useState } from 'react';
import { Animated } from 'react-native';
import {
  createFadeAnim,
  createSlideAnim,
  createScaleAnim,
  fadeIn,
  fadeOut,
  slideUp,
  scaleIn,
  staggeredFadeIn,
  staggeredSlideUp,
} from '../utils/animations';

// ── useFadeIn ─────────────────────────────────────────────────────────

export function useFadeIn(initialValue = 0, autoPlay = true) {
  const opacity = useRef(createFadeAnim(initialValue)).current;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (autoPlay) {
      setIsVisible(true);
      fadeIn(opacity).start();
    }
  }, [autoPlay, opacity]);

  const animateIn = useCallback(() => {
    setIsVisible(true);
    fadeIn(opacity).start();
  }, [opacity]);

  const animateOut = useCallback(() => {
    fadeOut(opacity).start(() => setIsVisible(false));
  }, [opacity]);

  return { opacity, isVisible, animateIn, animateOut };
}

// ── useSlideIn ────────────────────────────────────────────────────────

export function useSlideIn(initialOffset = 30, autoPlay = true) {
  const translateY = useRef(createSlideAnim(initialOffset)).current;
  const opacity = useRef(createFadeAnim(0)).current;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (autoPlay) {
      setIsVisible(true);
      Animated.parallel([
        slideUp(translateY),
        fadeIn(opacity),
      ]).start();
    }
  }, [autoPlay, translateY, opacity]);

  const animateIn = useCallback(() => {
    setIsVisible(true);
    Animated.parallel([slideUp(translateY), fadeIn(opacity)]).start();
  }, [translateY, opacity]);

  const animateOut = useCallback(() => {
    const resetTranslate = Animated.timing(translateY, {
      toValue: initialOffset,
      duration: 200,
      useNativeDriver: true,
    });
    Animated.parallel([resetTranslate, fadeOut(opacity)]).start(() =>
      setIsVisible(false)
    );
  }, [translateY, opacity, initialOffset]);

  return { translateY, opacity, isVisible, animateIn, animateOut };
}

// ── useScaleIn ────────────────────────────────────────────────────────

export function useScaleIn(initialScale = 0.8, autoPlay = true) {
  const scale = useRef(createScaleAnim(initialScale)).current;
  const opacity = useRef(createFadeAnim(0)).current;

  useEffect(() => {
    if (autoPlay) {
      Animated.parallel([scaleIn(scale), fadeIn(opacity)]).start();
    }
  }, [autoPlay, scale, opacity]);

  const animateIn = useCallback(() => {
    Animated.parallel([scaleIn(scale), fadeIn(opacity)]).start();
  }, [scale, opacity]);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: initialScale,
        duration: 200,
        useNativeDriver: true,
      }),
      fadeOut(opacity),
    ]).start();
  }, [scale, opacity, initialScale]);

  return { scale, opacity, animateIn, animateOut };
}

// ── useStaggeredList ──────────────────────────────────────────────────

export function useStaggeredList(itemCount: number, staggerMs = 80) {
  const opacities = useRef<Animated.Value[]>(
    Array.from({ length: itemCount }, () => createFadeAnim(0))
  ).current;

  const slideValues = useRef<Animated.Value[]>(
    Array.from({ length: itemCount }, () => createSlideAnim(20))
  ).current;

  useEffect(() => {
    const animations = opacities.map((opacity, i) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideValues[i], {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(staggerMs, animations).start();
  }, [opacities, slideValues, staggerMs]);

  const getAnimatedStyle = useCallback(
    (index: number) => ({
      opacity: opacities[index],
      transform: [{ translateY: slideValues[index] }],
    }),
    [opacities, slideValues]
  );

  return { getAnimatedStyle };
}

// ── usePulse ──────────────────────────────────────────────────────────

export function usePulse(initialValue = 0.3, targetValue = 1, duration = 800) {
  const value = useRef(createFadeAnim(initialValue)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: targetValue,
          duration,
          easing: Animated.Easing.inOut(Animated.Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: initialValue,
          duration,
          easing: Animated.Easing.inOut(Animated.Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [value, initialValue, targetValue, duration]);

  return value;
}
