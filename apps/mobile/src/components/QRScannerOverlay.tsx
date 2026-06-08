import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

// ── Constants ──────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCAN_FRAME_SIZE = SCREEN_WIDTH * 0.7;
const CORNER_SIZE = 26;
const CORNER_THICKNESS = 3.5;

// ── Types ──────────────────────────────────────────────────────────

export interface QRScannerOverlayProps {
  title?: string;
  subtitle?: string;
}

// ── Scanning Line Animation ────────────────────────────────────────

function ScanLine() {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: SCAN_FRAME_SIZE - 4,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [translateY]);

  return (
    <Animated.View
      style={[
        styles.scanLine,
        { transform: [{ translateY }] },
      ]}
    />
  );
}

// ── Corner Border ──────────────────────────────────────────────────

function CornerBorder() {
  return (
    <>
      {/* Top-Left */}
      <View style={[styles.corner, styles.cornerTL]} />
      {/* Top-Right */}
      <View style={[styles.corner, styles.cornerTR]} />
      {/* Bottom-Left */}
      <View style={[styles.corner, styles.cornerBL]} />
      {/* Bottom-Right */}
      <View style={[styles.corner, styles.cornerBR]} />
    </>
  );
}

// ── Component ──────────────────────────────────────────────────────

export default function QRScannerOverlay({
  title = 'Escanear QR',
  subtitle = 'Posicioná el código QR dentro del marco',
}: QRScannerOverlayProps) {
  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Semi-transparent border area */}
      <View style={styles.topSection}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Scan frame row */}
      <View style={styles.middleSection}>
        {/* Left overlay */}
        <View style={styles.sideOverlay} />

        {/* Scan frame */}
        <View style={styles.scanFrame}>
          <CornerBorder />
          <ScanLine />
        </View>

        {/* Right overlay */}
        <View style={styles.sideOverlay} />
      </View>

      {/* Bottom overlay */}
      <View style={styles.bottomSection} />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  middleSection: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 2,
    backgroundColor: '#1a73e8',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 6,
  },
  bottomSection: {
    flex: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
