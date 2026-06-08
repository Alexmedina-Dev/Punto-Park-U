import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReservationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Reservas</Text>
      {/* Reservations list will be implemented in a follow-up PR */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 8,
  },
});
