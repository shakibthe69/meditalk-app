import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { Card, Badge, Button } from '../../src/components';
import { adminApi, PatientSummary } from '../../src/services/api';
import { formatDate } from '../../src/utils/admin';
import { Phone, Bell, X, TrendingUp, ChevronRight, RefreshCw } from 'lucide-react-native';

/** Colour for an adherence percentage: red < 70, amber < 85, green otherwise. */
function adherenceColor(percent: number | null): string {
  if (percent == null) return palette.slate400;
  if (percent < 70) return palette.danger600;
  if (percent < 85) return palette.warning600;
  return palette.success600;
}

export default function AdminAdherenceScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<PatientSummary | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.adherenceList();
      setPatients(data);
    } catch (err) {
      console.warn('Failed to load adherence list:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const callUser = (patient: PatientSummary) => {
    if (!patient.phone) {
      Alert.alert('No phone number', 'This patient has no phone number on file.');
      return;
    }
    Linking.openURL(`tel:${patient.phone.replace(/\s+/g, '')}`).catch(() =>
      Alert.alert('Cannot call', 'This device cannot place phone calls.')
    );
  };

  const openNotify = (patient: PatientSummary) => {
    setNotifyTarget(patient);
    setTitle('A message from the Meditalk care team');
    setMessage('');
  };

  const sendNotification = async () => {
    if (!notifyTarget) return;
    if (!message.trim()) {
      Alert.alert('Missing message', 'Please write a short message for the patient.');
      return;
    }
    setIsSaving(true);
    try {
      await adminApi.sendNotification(notifyTarget.id, title.trim() || 'Meditalk Care Team', message.trim());
      setNotifyTarget(null);
      setMessage('');
      Alert.alert('Sent', 'The in-app message was sent to the patient.');
    } catch (err) {
      console.warn('Failed to send notification:', err);
      Alert.alert('Error', 'Could not send the message.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={palette.teal600} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Medication Adherence</Text>
          <Text style={styles.headerSub}>Lowest adherence first — call or message to follow up</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { setIsLoading(true); load(); }}>
          <RefreshCw size={16} color={palette.teal700} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={palette.teal600}
          />
        }
        ListEmptyComponent={
          <View style={styles.centerWrap}>
            <TrendingUp size={44} color={palette.slate300} />
            <Text style={styles.emptyText}>No medication records yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const percent = item.adherencePercent;
          const color = adherenceColor(percent);
          return (
            <Card style={styles.card} variant="outlined">
              <View style={styles.cardHeader}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/admin-patient/${item.id}`)}>
                  <Text style={styles.name}>{item.name || 'Unnamed patient'}</Text>
                  <Text style={styles.meta}>{item.phone || item.email || `ID #${item.id}`}</Text>
                </TouchableOpacity>
                <View style={[styles.percentPill, { backgroundColor: `${color}18`, borderColor: color }]}>
                  <Text style={[styles.percentText, { color }]}>
                    {percent != null ? `${percent}%` : '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{item.takenDoses}</Text>
                  <Text style={styles.statLabel}>Taken</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: palette.danger600 }]}>{item.missedDoses}</Text>
                  <Text style={styles.statLabel}>Missed</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: palette.warning600 }]}>{item.unconfirmedDoses}</Text>
                  <Text style={styles.statLabel}>Unconfirmed</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{item.scheduledDoses}</Text>
                  <Text style={styles.statLabel}>Doses</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaSmall}>Last active: {formatDate(item.lastActiveAt)}</Text>
                {item.inactiveDays != null && item.inactiveDays > 0 ? (
                  <Badge label={`${item.inactiveDays}d inactive`} status="WARNING" />
                ) : null}
                {percent != null && percent < 70 ? <Badge label="Low adherence" status="DANGER" /> : null}
              </View>

              <View style={styles.actionRow}>
                <Button
                  title="Call"
                  size="sm"
                  icon={<Phone size={15} color={palette.white} />}
                  onPress={() => callUser(item)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Message"
                  size="sm"
                  variant="secondary"
                  icon={<Bell size={15} color={palette.teal700} />}
                  onPress={() => openNotify(item)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Details"
                  size="sm"
                  variant="outline"
                  icon={<ChevronRight size={15} color={palette.teal600} />}
                  onPress={() => router.push(`/admin-patient/${item.id}`)}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          );
        }}
      />

      <Modal visible={!!notifyTarget} transparent animationType="slide" onRequestClose={() => setNotifyTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message patient</Text>
              <TouchableOpacity onPress={() => setNotifyTarget(null)}>
                <X size={22} color={palette.slate500} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>{notifyTarget?.name || 'Patient'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={palette.slate400}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Message about their medication schedule"
              placeholderTextColor={palette.slate400}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <Button title="Send message" onPress={sendNotification} loading={isSaving} fullWidth style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: '800', color: palette.slate900 },
  headerSub: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 2 },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.teal50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: typography.sizes.sm, color: palette.slate500 },
  listContent: { padding: spacing.base, gap: spacing.sm, paddingBottom: spacing['3xl'] },
  card: { padding: spacing.md, gap: spacing.xs, ...shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: typography.sizes.base, fontWeight: '700', color: palette.slate900 },
  meta: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 2 },
  percentPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  percentText: { fontSize: typography.sizes.sm, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: typography.sizes.base, fontWeight: '800', color: palette.slate900 },
  statLabel: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  metaSmall: { fontSize: typography.sizes.xs, color: palette.slate400 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    gap: spacing.sm,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: typography.sizes.lg, fontWeight: '800', color: palette.slate900 },
  modalSub: { fontSize: typography.sizes.sm, color: palette.slate500 },
  input: {
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});
