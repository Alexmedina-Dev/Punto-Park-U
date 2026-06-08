import React, { useRef, useCallback, useMemo } from 'react';
import {
  Animated,
  FlatList,
  FlatListProps,
  StyleSheet,
  View,
  ViewabilityConfig,
} from 'react-native';
import { useStaggeredList } from '../hooks/useAnimation';
import { ANIMATION } from '../constants/app';

// ── Types ─────────────────────────────────────────────────────────────

export interface AnimatedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: (info: { item: T; index: number; animatedStyle: { opacity: Animated.Value; transform: { translateY: Animated.Value }[] } }) => React.ReactElement | null;
  staggerMs?: number;
  initialDelay?: number;
}

// ── Config ────────────────────────────────────────────────────────────

const VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 100,
};

// ── Component ─────────────────────────────────────────────────────────

export default function AnimatedList<T>({
  data,
  renderItem,
  staggerMs = ANIMATION.stagger.normal,
  keyExtractor,
  contentContainerStyle,
  ListEmptyComponent,
  ...rest
}: AnimatedListProps<T>) {
  const itemCount = data?.length ?? 0;
  const { getAnimatedStyle } = useStaggeredList(itemCount, staggerMs);

  const renderAnimatedItem = useCallback(
    (info: { item: T; index: number }) => {
      const animatedStyle = getAnimatedStyle(info.index);
      return renderItem({ ...info, animatedStyle });
    },
    [renderItem, getAnimatedStyle]
  );

  return (
    <FlatList
      data={data}
      renderItem={renderAnimatedItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={contentContainerStyle}
      ListEmptyComponent={ListEmptyComponent}
      showsVerticalScrollIndicator={false}
      viewabilityConfig={VIEWABILITY_CONFIG}
      {...rest}
    />
  );
}
