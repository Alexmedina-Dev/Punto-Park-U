// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Animations — reusable Animated value configs and helpers           ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Animated, Easing } from 'react-native';

// ── Easing Presets ────────────────────────────────────────────────────

export const EASING = {
  spring: { friction: 7, tension: 80, useNativeDriver: true } as const,
  gentleSpring: { friction: 10, tension: 60, useNativeDriver: true } as const,
  bouncySpring: { friction: 5, tension: 100, useNativeDriver: true } as const,
  smooth: {
    duration: 300,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    useNativeDriver: true,
  } as const,
  fast: {
    duration: 150,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    useNativeDriver: true,
  } as const,
  slow: {
    duration: 500,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    useNativeDriver: true,
  } as const,
};

// ── Value Factories ───────────────────────────────────────────────────

export function createFadeAnim(initial = 0): Animated.Value {
  return new Animated.Value(initial);
}

export function createSlideAnim(initial = 30): Animated.Value {
  return new Animated.Value(initial);
}

export function createScaleAnim(initial = 0.8): Animated.Value {
  return new Animated.Value(initial);
}

// ── Animation Builders ────────────────────────────────────────────────

export function fadeIn(
  value: Animated.Value,
  config: Partial<Animated.TimingAnimationConfig> = {}
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue: 1,
    ...EASING.smooth,
    ...config,
  });
}

export function fadeOut(
  value: Animated.Value,
  config: Partial<Animated.TimingAnimationConfig> = {}
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue: 0,
    ...EASING.smooth,
    ...config,
  });
}

export function slideUp(
  value: Animated.Value,
  config: Partial<Animated.SpringAnimationConfig> = {}
): Animated.CompositeAnimation {
  return Animated.spring(value, {
    toValue: 0,
    ...EASING.gentleSpring,
    ...config,
  });
}

export function scaleIn(
  value: Animated.Value,
  config: Partial<Animated.SpringAnimationConfig> = {}
): Animated.CompositeAnimation {
  return Animated.spring(value, {
    toValue: 1,
    ...EASING.bouncySpring,
    ...config,
  });
}

// ── Staggered Sequence ────────────────────────────────────────────────

export function staggeredFadeIn(
  values: Animated.Value[],
  staggerMs = 80,
  config: Partial<Animated.TimingAnimationConfig> = {}
): Animated.CompositeAnimation {
  const animations = values.map((v) =>
    Animated.timing(v, {
      toValue: 1,
      ...EASING.smooth,
      ...config,
    })
  );
  return Animated.stagger(staggerMs, animations);
}

export function staggeredSlideUp(
  values: Animated.Value[],
  staggerMs = 80,
  config: Partial<Animated.SpringAnimationConfig> = {}
): Animated.CompositeAnimation {
  const animations = values.map((v) =>
    Animated.spring(v, {
      toValue: 0,
      ...EASING.gentleSpring,
      ...config,
    })
  );
  return Animated.stagger(staggerMs, animations);
}

// ── Pulse / Shimmer ───────────────────────────────────────────────────

export function createPulseAnim(
  value: Animated.Value,
  min = 0.3,
  max = 1,
  duration = 800
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: max,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: min,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
}

// ── Checkmark Animation ───────────────────────────────────────────────

export function createCheckmarkAnimation(
  scale: Animated.Value,
  opacity: Animated.Value
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }),
  ]);
}

// ── Shake (for error feedback) ────────────────────────────────────────

export function createShakeAnim(value: Animated.Value): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.timing(value, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: 8, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: -8, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
}

// ── Interpolation Helpers ─────────────────────────────────────────────

export const interpolateOpacity = (value: Animated.Value): Animated.AnimatedInterpolation<string | number> =>
  value.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

export const interpolateTranslateY = (
  value: Animated.Value,
  from = 30,
  to = 0
): Animated.AnimatedInterpolation<string | number> =>
  value.interpolate({
    inputRange: [0, 1],
    outputRange: [from, to],
  });
