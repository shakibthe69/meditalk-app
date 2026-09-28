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
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Badge, Button } from '../../src/components';
import { adminApi, PatientSummary } from '../../src/services/api';
import { formatDate, priorityStatus, priorityLabel } from '../../src/utils/admin';
import { Phone, UserX, X, ChevronRight, RefreshCw } from 'lucide-react-native';

const OUTCOMES = ['Called user', 'Follow-up required', 'User responded', 'No answer'];

export default function AdminInactiveScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [active, setActive] = useState<PatientSummary | null>(null);
  const [outcome, setOutcome] = useState<string>('Called user');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.inactivePatients();
      setPatients(data);
    } catch (err) {
      console.warn('Failed to load inactive patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const startCall = (patient: PatientSummary) => {
    // Open the device dialer. The call is never placed silently — the user
    // must confirm in the OS dialer and grant permission where applicable.
    if (!patient.phone) {
      Alert.alert('No phone number', 'This patient has no phone number on file.');
      return;
    }
    const url = `tel:${patient.phone.replace(/\s+/g, '')}`;
    Linking.openURL(url).catch(() => Alert.alert('Cannot call', 'This device cannot place phone calls.'));
    setActive(patient);
    setOutcome('Called user');
    setNote('');
  };

  const saveOutcome = async () => {
    if (!active) return;
    setIsSaving(true);
    try {
      const detail = note.trim() ? `${outcome}: ${note.trim()}` : outcome;
      if (active.followUpId != null) {
        await adminApi.contactFollowUp(active.followUpId, {
          type: 'PHONE',
          result: outcome,
          note: note.trim() || undefined,
        });
      } else {
        await adminApi.addNote(active.id, `Follow-up contact — ${detail}`);
      }
      setActive(null);
      await load();
      Alert.alert('Recorded', 'The follow-up action was saved.');
    } catch (err) {
      console.warn('Failed to record contact:', err);
      Alert.alert('Error', 'Could not save the follow-up action. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Inactive Patients</Text>
          <Text style={styles.headerSub}>No qualifying activity for 3+ days</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { setIsLoading(true); load(); }}>
          <RefreshCw size={16} color={palette.teal700} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={palette.teal600} />
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <UserX size={44} color={palette.slate300} />
              <Text style={styles.emptyTitle}>No inactive patients</Text>
              <Text style={styles.emptySub}>Everyone has activity within the follow-up window.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card} variant="outlined">
              <View style={styles.cardHeader}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/admin-patient/${item.id}`)}>
                  <Text style={styles.name}>{item.name || 'Unnamed patient'}</Text>
                  <Text style={styles.meta}>ID #{item.id} · {item.email || 'no email'}</Text>
                </TouchableOpacity>
                <ChevronRight size={20} color={palette.slate300} />
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{item.phone || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last activity</Text>
                <Text style={styles.infoValue}>{formatDate(item.lastActiveAt)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Inactive days</Text>
                <Text style={styles.infoValue}>{item.inactiveDays ?? 0} day(s)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Badge label={priorityLabel(item.followUpPriority)} status={priorityStatus(item.followUpPriority)} />
              </View>

              <View style={styles.actionRow}>
                <Button
                  title="Call User"
                  size="sm"
                  icon={<Phone size={15} color={palette.white} />}
                  onPress={() => startCall(item)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Details"
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push(`/admin-patient/${item.id}`)}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}
        />
      )}

      <Modal visible={!!active} animationType="slide" transparent onRequestClose={() => setActive(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record follow-up</Text>
              <TouchableOpacity onPress={() => setActive(null)}>
                <X size={22} color={palette.slate500} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>{active?.name || 'Patient'}</Text>

            <Text style={styles.label}>Outcome</Text>
            <View style={styles.outcomeRow}>
              {OUTCOMES.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[styles.outcomeChip, outcome === o && styles.outcomeChipActive]}
                  onPress={() => setOutcome(o)}
                >
                  <Text style={[styles.outcomeText, outcome === o && styles.outcomeTextActive]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="What was discussed / next step"
              placeholderTextColor={palette.slate400}
              value={note}
              onChangeText={setNote}
              multiline
            />

            <Button
              title="Save action"
              onPress={saveOutcome}
              loading={isSaving}
              fullWidth
              style={{ marginTop: spacing.md }}
            />
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
  emptyTitle: { fontSize: typography.sizes.base, fontWeight: '700', color: palette.slate700 },
  emptySub: { fontSize: typography.sizes.sm, color: palette.slate500, textAlign: 'center' },
  listContent: { padding: spacing.base, gap: spacing.sm, paddingBottom: spacing['3xl'] },
  card: { padding: spacing.md, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: typography.sizes.base, fontWeight: '700', color: palette.slate900 },
  meta: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  infoLabel: { fontSize: typography.sizes.xs, color: palette.slate500 },
  infoValue: { fontSize: typography.sizes.xs, color: palette.slate800, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: typography.sizes.lg, fontWeight: '800', color: palette.slate900 },
  modalSub: { fontSize: typography.sizes.sm, color: palette.slate500, marginTop: 2, marginBottom: spacing.sm },
  label: { fontSize: typography.sizes.xs, fontWeight: '700', color: palette.slate700, marginTop: spacing.sm, marginBottom: spacing.xs },
  outcomeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  outcomeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.slate50,
  },
  outcomeChipActive: { backgroundColor: palette.teal600, borderColor: palette.teal600 },
  outcomeText: { fontSize: typography.sizes.xs, fontWeight: '600', color: palette.slate700 },
  outcomeTextActive: { color: palette.white },
  input: {
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
    minHeight: 64,
    textAlignVertical: 'top',
  },
});
