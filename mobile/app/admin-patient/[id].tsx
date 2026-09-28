import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Badge, Button, Header } from '../../src/components';
import { adminApi, PatientDetail, MedicationInfo, PrescriptionInfo } from '../../src/services/api';
import { formatDate, formatDateTime, priorityStatus, priorityLabel } from '../../src/utils/admin';
import { Phone, Bell, StickyNote, X } from 'lucide-react-native';

export default function AdminPatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patientId = Array.isArray(id) ? id[0] : id;

  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      const data = await adminApi.patientDetail(patientId);
      setDetail(data);
    } catch (err) {
      console.warn('Failed to load patient detail:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const callUser = () => {
    const phone = detail?.summary.phone;
    if (!phone) {
      Alert.alert('No phone number', 'This patient has no phone number on file.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() =>
      Alert.alert('Cannot call', 'This device cannot place phone calls.')
    );
  };

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Missing details', 'Please enter a title and message.');
      return;
    }
    setIsSaving(true);
    try {
      await adminApi.sendNotification(patientId, title.trim(), message.trim());
      setNotifyOpen(false);
      setTitle('');
      setMessage('');
      await load();
      Alert.alert('Sent', 'Notification queued for the patient.');
    } catch (err) {
      console.warn('Failed to send notification:', err);
      Alert.alert('Error', 'Could not send the notification.');
    } finally {
      setIsSaving(false);
    }
  };

  const addNote = async () => {
    if (!noteBody.trim()) return;
    setIsSaving(true);
    try {
      await adminApi.addNote(patientId, noteBody.trim());
      setNoteOpen(false);
      setNoteBody('');
      await load();
    } catch (err) {
      console.warn('Failed to add note:', err);
      Alert.alert('Error', 'Could not save the note.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Patient" showBack />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={palette.teal600} />
        </View>
      </SafeAreaView>
    );
  }

  const summary = detail?.summary;

  return (
    <SafeAreaView style={styles.container}>
      <Header title={summary?.name || 'Patient'} subtitle={`ID #${summary?.id ?? '—'}`} showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
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
        showsVerticalScrollIndicator={false}
      >
        {/* Actions */}
        <View style={styles.actionRow}>
          <Button title="Call" size="sm" icon={<Phone size={15} color={palette.white} />} onPress={callUser} style={{ flex: 1 }} />
          <Button
            title="Notify"
            size="sm"
            variant="secondary"
            icon={<Bell size={15} color={palette.teal700} />}
            onPress={() => setNotifyOpen(true)}
            style={{ flex: 1 }}
          />
          <Button
            title="Note"
            size="sm"
            variant="secondary"
            icon={<StickyNote size={15} color={palette.teal700} />}
            onPress={() => setNoteOpen(true)}
            style={{ flex: 1 }}
          />
        </View>

        {/* Basic profile */}
        <Section title="Basic Profile">
          <Row label="Full name" value={summary?.name} />
          <Row label="Email" value={summary?.email} />
          <Row label="Date of birth" value={detail?.dateOfBirth} />
          <Row label="Blood group" value={summary?.bloodGroup} />
          <Row label="Allergies" value={detail?.allergies} />
          <Row label="Chronic conditions" value={detail?.chronicConditions} />
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <Row label="Phone" value={summary?.phone} />
          <Row label="Emergency contact" value={detail?.emergencyContactName} />
          <Row label="Emergency phone" value={detail?.emergencyContactPhone} />
          <Row label="Help requests opt-in" value={detail?.helpRequestsOptIn ? 'Yes' : 'No'} />
        </Section>

        {/* Account status */}
        <Section title="Account Status">
          <Row label="Registered" value={formatDate(summary?.createdAt)} />
          <Row label="Prescription status" value={summary?.prescriptionStatus} />
          <Row label="Follow-up priority" value={priorityLabel(summary?.followUpPriority)} />
          <Row label="Follow-up status" value={summary?.followUpStatus} />
          <Row
            label="Adherence"
            value={summary?.adherencePercent != null ? `${summary.adherencePercent}%` : undefined}
          />
        </Section>

        {/* Last activity */}
        <Section title="Last Activity">
          <Row label="Last app activity" value={formatDateTime(summary?.lastActiveAt)} />
          <Row
            label="Inactive days"
            value={summary?.inactiveDays != null ? `${summary.inactiveDays} day(s)` : '0'}
          />
          <Row label="Last medication interaction" value={formatDateTime(detail?.activity.lastMedicationInteraction)} />
          {detail?.activity.recentActions?.length ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Recent actions</Text>
              {detail.activity.recentActions.map((action, i) => (
                <Text key={i} style={styles.bullet}>• {action}</Text>
              ))}
            </View>
          ) : null}
        </Section>

        {/* Prescriptions */}
        <Section title={`Prescriptions (${detail?.prescriptions.length ?? 0})`}>
          {detail?.prescriptions?.length ? (
            detail.prescriptions.map((p: PrescriptionInfo) => (
              <View key={String(p.id)} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{p.diagnosis || 'Prescription'}</Text>
                  <Badge label={p.status || 'ACTIVE'} status="INFO" />
                </View>
                <Text style={styles.itemMeta}>
                  {p.doctorName || 'Doctor n/a'} · {formatDate(p.prescriptionDate)}
                </Text>
                {p.medicines?.length ? (
                  <Text style={styles.itemMeta}>{p.medicines.join(', ')}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No prescriptions on record.</Text>
          )}
        </Section>

        {/* Medications */}
        <Section title={`Medications (${detail?.medications.length ?? 0})`}>
          {detail?.medications?.length ? (
            detail.medications.map((m: MedicationInfo) => (
              <View key={String(m.id)} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{m.name}</Text>
                  <Badge label={m.active ? 'Active' : 'Stopped'} status={m.active ? 'SUCCESS' : 'DEFAULT'} />
                </View>
                <Text style={styles.itemMeta}>
                  {m.dose || '—'} · {m.frequency || '—'}
                </Text>
                <Text style={styles.itemMeta}>
                  Taken {m.taken} · Missed {m.missed} · Pending {m.pending}
                  {m.adherencePercent != null ? ` · ${m.adherencePercent}% adherence` : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No medications on record.</Text>
          )}
        </Section>

        {/* Notes */}
        <Section title={`Admin Notes (${detail?.notes.length ?? 0})`}>
          {detail?.notes?.length ? (
            detail.notes.map((n) => (
              <View key={String(n.id)} style={styles.itemCard}>
                <Text style={styles.itemMeta}>{n.body}</Text>
                <Text style={styles.itemSmall}>
                  {n.adminName || 'Admin'} · {formatDateTime(n.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No notes yet.</Text>
          )}
        </Section>

        {/* Contacts */}
        <Section title={`Contact History (${detail?.contacts.length ?? 0})`}>
          {detail?.contacts?.length ? (
            detail.contacts.map((c) => (
              <View key={String(c.id)} style={styles.itemCard}>
                <Text style={styles.itemMeta}>
                  {c.type}: {c.result || 'contacted'}
                </Text>
                {c.note ? <Text style={styles.itemSmall}>{c.note}</Text> : null}
                <Text style={styles.itemSmall}>
                  {c.adminName || 'Admin'} · {formatDateTime(c.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No contact history.</Text>
          )}
        </Section>

        <Text style={styles.footerNote}>
          Secrets such as passwords and tokens are never exposed here. Only the fields the app stores
          are shown.
        </Text>
      </ScrollView>

      {/* Notification modal */}
      <Modal visible={notifyOpen} transparent animationType="slide" onRequestClose={() => setNotifyOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Notification</Text>
              <TouchableOpacity onPress={() => setNotifyOpen(false)}>
                <X size={22} color={palette.slate500} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={palette.slate400}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Message"
              placeholderTextColor={palette.slate400}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <Button title="Send" onPress={sendNotification} loading={isSaving} fullWidth style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>

      {/* Note modal */}
      <Modal visible={noteOpen} transparent animationType="slide" onRequestClose={() => setNoteOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Admin Note</Text>
              <TouchableOpacity onPress={() => setNoteOpen(false)}>
                <X size={22} color={palette.slate500} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Internal note about this patient"
              placeholderTextColor={palette.slate400}
              value={noteBody}
              onChangeText={setNoteBody}
              multiline
            />
            <Button title="Save Note" onPress={addNote} loading={isSaving} fullWidth style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Card style={styles.section} variant="outlined">
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </Card>
);

const Row: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value && String(value).length ? String(value) : '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate50 },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing['3xl'] },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  section: { padding: spacing.md, gap: spacing.xs },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  rowLabel: { fontSize: typography.sizes.xs, color: palette.slate500, flex: 1 },
  rowValue: { fontSize: typography.sizes.xs, color: palette.slate800, fontWeight: '600', flex: 1.4, textAlign: 'right' },
  block: { marginTop: spacing.xs },
  blockLabel: { fontSize: typography.sizes.xs, color: palette.slate500, marginBottom: 2 },
  bullet: { fontSize: typography.sizes.xs, color: palette.slate700, lineHeight: 17 },
  itemCard: {
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.xs,
    gap: 2,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: typography.sizes.sm, fontWeight: '700', color: palette.slate900, flex: 1 },
  itemMeta: { fontSize: typography.sizes.xs, color: palette.slate600, lineHeight: 16 },
  itemSmall: { fontSize: typography.sizes.xs, color: palette.slate400 },
  empty: { fontSize: typography.sizes.xs, color: palette.slate400, fontStyle: 'italic' },
  footerNote: { fontSize: typography.sizes.xs, color: palette.slate400, lineHeight: 16, paddingHorizontal: spacing.xs },
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
