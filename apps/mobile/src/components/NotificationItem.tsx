import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// ── Types ──────────────────────────────────────────────────────────

export interface NotificationData {
  id: string;
  type: 'reservation_reminder' | 'payment_confirmed' | 'entry_alert' | 'exit_alert' | 'system_alert';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface NotificationItemProps {
  notification: NotificationData;
  onPress?: (notification: NotificationData) => void;
  onMarkAsRead?: (notification: NotificationData) => void;
}

// ── Notification Icon Map ──────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  reservation_reminder: '📅',
  payment_confirmed: '💰',
  entry_alert: '🚗',
  exit_alert: '🚗',
  system_alert: '⚙️',
};

const TYPE_COLORS: Record<string, string> = {
  reservation_reminder: '#1a73e8',
  payment_confirmed: '#4caf50',
  entry_alert: '#ff9800',
  exit_alert: '#00897b',
  system_alert: '#7b1fa2',
};

// ── Format Date ────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

// ── Component ──────────────────────────────────────────────────────

export default function NotificationItem({
  notification,
  onPress,
  onMarkAsRead,
}: NotificationItemProps) {
  const icon = TYPE_ICONS[notification.type] || '🔔';
  const accentColor = TYPE_COLORS[notification.type] || '#888';
  const timeAgo = formatRelativeTime(notification.createdAt);

  const handlePress = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification);
    }
    onPress?.(notification);
  };

  return (
    <TouchableOpacity
      style={[styles.container, !notification.read && styles.unread]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Unread indicator */}
      {!notification.read && <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />}

      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !notification.read && styles.titleUnread]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>

      {/* Mark as read hint */}
      {!notification.read && (
        <View style={styles.markReadHint}>
          <View style={[styles.hintDot, { backgroundColor: accentColor }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    position: 'relative',
    overflow: 'hidden',
  },
  unread: {
    backgroundColor: '#f0f7ff',
    borderColor: '#1a73e820',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '500',
  },
  message: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  markReadHint: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
