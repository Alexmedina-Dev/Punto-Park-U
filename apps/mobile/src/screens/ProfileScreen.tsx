import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@punto-park-u/shared-stores';
import ConfirmDialog from '../components/ConfirmDialog';

// ── Profile Sections ───────────────────────────────────────────────

interface ProfileMenuItem {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
}

// ── ProfileScreen ──────────────────────────────────────────────────

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = useCallback(() => {
    setShowLogoutDialog(false);
    logout();
  }, [logout]);

  // ── Menu Items ──

  const menuSections: { title?: string; items: ProfileMenuItem[] }[] = [
    {
      title: 'Cuenta',
      items: [
        {
          icon: '👤',
          label: 'Editar Perfil',
          subtitle: 'Nombre, email, teléfono',
          onPress: () => Alert.alert('Editar Perfil', 'Disponible próximamente'),
        },
        {
          icon: '🔒',
          label: 'Cambiar Contraseña',
          subtitle: 'Actualizá tu contraseña',
          onPress: () => Alert.alert('Contraseña', 'Disponible próximamente'),
        },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        {
          icon: '🔔',
          label: 'Notificaciones',
          subtitle: 'Alertas y recordatorios',
          onPress: () => Alert.alert('Notificaciones', 'Disponible próximamente'),
        },
        {
          icon: '🌐',
          label: 'Idioma',
          subtitle: 'Español',
          onPress: () => Alert.alert('Idioma', 'Disponible próximamente'),
        },
      ],
    },
    {
      title: 'Soporte',
      items: [
        {
          icon: '❓',
          label: 'Ayuda',
          subtitle: 'Preguntas frecuentes',
          onPress: () => Alert.alert('Ayuda', 'Disponible próximamente'),
        },
        {
          icon: '📝',
          label: 'Términos y Condiciones',
          onPress: () => Alert.alert('Términos', 'Disponible próximamente'),
        },
      ],
    },
  ];

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user?.nombres?.[0] || user?.username?.[0] || 'U').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>
            {user?.nombres || user?.username || 'Usuario'}
          </Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          {user?.rol && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleLabel}>
                {user.rol === 'admin'
                  ? 'Administrador'
                  : user.rol === 'operator'
                  ? 'Operador'
                  : 'Usuario'}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            {section.title && (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            <View style={styles.menuCard}>
              {section.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={iIdx}
                  style={[
                    styles.menuItem,
                    iIdx < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.6}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutDialog(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutLabel}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* App Info */}
        <Text style={styles.version}>Punto Park U v0.1.0</Text>
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Cerrar Sesión"
        message="¿Estás seguro de que querés cerrar sesión?"
        confirmLabel="Cerrar Sesión"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
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
  scrollContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#1a73e815',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a73e8',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  menuArrow: {
    fontSize: 22,
    color: '#ccc',
    fontWeight: '300',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e53935',
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53935',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#bbb',
    marginTop: 16,
  },
});
