import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { palette, typography, spacing, borderRadius, shadows } from '../../theme';
import { useRealtimeStore } from '../../store/useRealtimeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { CallSession, CallType } from '../../types';
import {
  X,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
} from 'lucide-react-native';

interface CallHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}m ${rest}s`;
}

function formatWhen(iso?: string): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    const isToday = date.toDateString() === new Date().toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
          ' · ' +
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Every call the signed-in user took part in, with a one-tap call back that
 * reuses the live ring flow.
 */
export const CallHistoryModal: React.FC<CallHistoryModalProps> = ({ visible, onClose }) => {
  const { callHistory, isLoadingHistory, fetchCallHistory, startCall, myUserId } =
    useRealtimeStore();
  const { t } = useSettingsStore();

  useEffect(() => {
    if (visible) {
      fetchCallHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const outcomeColor = (status: CallSession['status']) => {
    switch (status) {
      case 'ACCEPTED':
      case 'ENDED':
        return { bg: palette.success50, border: palette.success100, text: palette.success700 };
      case 'MISSED':
        return { bg: palette.danger50, border: palette.danger100, text: palette.danger700 };
      case 'DECLINED':
        return { bg: palette.warning50, border: palette.warning200, text: palette.warning700 };
      default:
        return { bg: palette.blue50, border: palette.blue100, text: palette.blue700 };
    }
  };

  const outcomeLabel = (status: CallSession['status']) => {
    switch (status) {
      case 'MISSED':
        return t.missedCall;
      case 'DECLINED':
        return t.declinedCall;
      case 'ENDED':
        return t.callEnded;
      case 'ACCEPTED':
        return t.connected;
      default:
        return t.ringing;
    }
  };

  const handleCallBack = (item: CallSession) => {
    const ok = startCall(
      item.peerUserId,
      item.peerName,
      (item.callType as CallType) || 'AUDIO'
    );
    if (ok) onClose();
  };

  const renderItem = ({ item }: { item: CallSession }) => {
    const outgoing = myUserId != null && String(item.initiatedByUserId) === myUserId;
    const missed = item.status === 'MISSED';
    const colors = outcomeColor(item.status);
    const isVideo = item.callType === 'VIDEO';

    const DirectionIcon = missed
      ? PhoneMissed
      : outgoing
        ? PhoneOutgoing
        : PhoneIncoming;

    return (
      <View style={styles.row}>
        <View style={[styles.iconCircle, outgoing ? styles.iconOutgoing : styles.iconIncoming]}>
          <DirectionIcon
            size={18}
            color={missed ? palette.danger600 : outgoing ? palette.teal700 : palette.blue600}
          />
        </View>

        <View style={styles.rowMain}>
          <View style={styles.rowTop}>
            <Text style={styles.peerName} numberOfLines={1}>
              {item.peerName || '—'}
            </Text>
            <View
              style={[styles.outcomeChip, { backgroundColor: colors.bg, borderColor: colors.border }]}
            >
              <Text style={[styles.outcomeText, { color: colors.text }]}>
                {outcomeLabel(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.rowMeta}>
            {isVideo ? (
              <Video size={11} color={palette.slate400} />
            ) : (
              <Phone size={11} color={palette.slate400} />
            )}
            <Text style={styles.metaText}>
              {outgoing ? t.outgoingCall : t.incomingCall}
              {formatDuration(item.durationSeconds) ? ` · ${formatDuration(item.durationSeconds)}` : ''}
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{formatWhen(item.createdAt)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.callBackBtn}
          activeOpacity={0.8}
          onPress={() => handleCallBack(item)}
        >
          {isVideo ? (
            <Video size={16} color={palette.white} />
          ) : (
            <Phone size={16} color={palette.white} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t.callHistory}</Text>
              <Text style={styles.subtitle}>
                {callHistory.length} {t.calls.toLowerCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={palette.slate500} />
            </TouchableOpacity>
          </View>

          {isLoadingHistory && callHistory.length === 0 ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color={palette.teal600} />
            </View>
          ) : callHistory.length === 0 ? (
            <View style={styles.centerWrap}>
              <Phone size={40} color={palette.slate300} />
              <Text style={styles.emptyText}>{t.noCallHistory}</Text>
            </View>
          ) : (
            <FlatList
              data={callHistory}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              renderItem={renderItem}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: '800',
    color: palette.slate900,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
  },
  centerWrap: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
  },
  list: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.slate50,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconOutgoing: {
    backgroundColor: palette.teal50,
  },
  iconIncoming: {
    backgroundColor: palette.blue50,
  },
  rowMain: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  peerName: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    flexShrink: 1,
  },
  outcomeChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  outcomeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
  metaDot: {
    fontSize: typography.sizes.xs,
    color: palette.slate300,
  },
  callBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.teal600,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
