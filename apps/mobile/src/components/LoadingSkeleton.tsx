import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

// ── Types ──────────────────────────────────────────────────────────

export interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

// ── Animated Skeleton Block ─────────────────────────────────────────

function SkeletonBlock({ width = '100%', height = 20, borderRadius = 8, style }: LoadingSkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── Preset Skeletons ───────────────────────────────────────────────

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <SkeletonBlock width={48} height={48} borderRadius={12} />
        <View style={styles.cardText}>
          <SkeletonBlock width="60%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="40%" height={14} />
        </View>
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

export function StatsSkeleton() {
  return (
    <View style={styles.statsRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.statCard}>
          <SkeletonBlock width={32} height={32} borderRadius={8} style={{ marginBottom: 12 }} />
          <SkeletonBlock width="70%" height={24} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="50%" height={14} />
        </View>
      ))}
    </View>
  );
}

// ── Default Export ─────────────────────────────────────────────────

export default SkeletonBlock;

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#e0e0e0',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 12,
  },
  listContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
