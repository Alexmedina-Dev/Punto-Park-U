import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePaymentStore } from '@punto-park-u/shared-stores';
import type { Payment } from '@punto-park-u/shared-types';
import PaymentCard from '../components/PaymentCard';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { useRefreshControl } from '../hooks/useRefreshControl';

// ── PaymentListScreen ──────────────────────────────────────────────

export default function PaymentListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { payments, isLoading, fetchPayments, stats } = usePaymentStore();

  const { refreshing, onRefresh } = useRefreshControl(async () => {
    await fetchPayments();
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  // ── Handlers ──

  const handlePress = useCallback(
    (payment: Payment) => {
      navigation?.navigate('PaymentDetail', { payment });
    },
    [navigation]
  );

  // ── Render ──

  const renderItem = useCallback(
    ({ item }: { item: Payment }) => (
      <PaymentCard payment={item} onPress={() => handlePress(item)} />
    ),
    [handlePress]
  );

  const keyExtractor = useCallback((item: Payment) => item.id, []);

  // ── Loading ──

  if (isLoading && payments.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Pagos</Text>
        </View>
        <ListSkeleton count={4} />
      </View>
    );
  }

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Pagos</Text>
      </View>

      {/* Stats row */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ${(stats.totals?.totalAmount ?? 0).toLocaleString('es-CO')}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totals?.count ?? 0}</Text>
            <Text style={styles.statLabel}>Pagos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ${(stats.totals?.avgAmount ?? 0).toLocaleString('es-CO')}
            </Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          payments.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1a73e8"
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="💳"
            title="Sin pagos"
            message="Tus pagos aparecerán aquí cuando realices una reserva."
          />
        }
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  listEmpty: {
    flex: 1,
  },
});
