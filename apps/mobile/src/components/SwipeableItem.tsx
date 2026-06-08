import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';

// ── Constants ──────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

// ── Types ──────────────────────────────────────────────────────────

export interface SwipeAction {
  label: string;
  icon?: string;
  color: string;
  onPress: () => void;
}

export interface SwipeableItemProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  onSwipeComplete?: () => void;
}

// ── Component ──────────────────────────────────────────────────────

export default function SwipeableItem({
  children,
  actions,
  onSwipeComplete,
}: SwipeableItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastGestureDx = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (
        _event: GestureResponderEvent,
        gesture: PanResponderGestureState
      ) => {
        return Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
      },
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gesture: PanResponderGestureState
      ) => {
        const newDx = Math.max(-ACTION_WIDTH * actions.length, Math.min(0, gesture.dx));
        translateX.setValue(newDx);
        lastGestureDx.current = newDx;
      },
      onPanResponderRelease: () => {
        if (Math.abs(lastGestureDx.current) > SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH * actions.length,
            useNativeDriver: true,
            tension: 50,
            friction: 10,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const close = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
    onSwipeComplete?.();
  };

  return (
    <View style={styles.container}>
      {/* Action buttons behind the item */}
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { backgroundColor: action.color, width: ACTION_WIDTH }]}
            onPress={() => {
              action.onPress();
              close();
            }}
            activeOpacity={0.8}
          >
            {action.icon && <Text style={styles.actionIcon}>{action.icon}</Text>}
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipeable content */}
      <Animated.View
        style={[{ transform: [{ translateX }] }, styles.content]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    backgroundColor: 'transparent',
  },
});
