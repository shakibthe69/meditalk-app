import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { Card, Badge, NotificationBell } from '../../src/components';
import { adminApi, AdminDashboard } from '../../src/services/api';
import { formatDateTime, priorityStatus, priorityLabel } from '../../src/utils/admin';
import { Users, UserCheck, UserX, Pill, AlertTriangle, ClipboardList, LifeBuoy, ScrollText, MessageSquare, Stethoscope, ChevronRight } from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const dashboard = await adminApi.dashboard();
      setData(dashboard);
    } catch (err) {
      console.warn('Failed to load admin dashboard:', err);
      setError('Could not load the dashboard. Pull down to retry.');
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

  const onRefresh = () => {
    setRefreshing(true);
    load();
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

  const stats = [
    { label: 'Total patients', value: data?.totalPatients ?? 0, color: palette.teal600, Icon: Users },
    { label: 'Active today', value: data?.activeToday ?? 0, color: palette.success600, Icon: UserCheck },
    { label: 'Inactive 2+ days', value: data?.inactive2PlusDays ?? 0, color: palette.warning600, Icon: UserX },
    { label: 'Missed dose alerts', value: data?.missedMedicationAlerts ?? 0, color: palette.danger600, Icon: Pill },
    { label: 'High priority', value: data?.highPriorityFollowUps ?? 0, color: palette.danger600, Icon: AlertTriangle },
    { label: 'Open follow-ups', value: data?.openFollowUps ?? 0, color: palette.blue600, Icon: ClipboardList },
    { label: 'Support requests', value: data?.openSupportRequests ?? 0, color: palette.purple600, Icon: LifeBuoy },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSub}>Patient monitoring & follow-up overview</Text>
          </View>
          <NotificationBell />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/admin-chat')} activeOpacity={0.8}>
            <MessageSquare size={15} color={palette.teal700} />
            <Text style={styles.logBtnText}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/admin-messages')} activeOpacity={0.8}>
            <MessageSquare size={15} color={palette.teal700} />
            <Text style={styles.logBtnText}>
              Messages{data?.openSupportRequests ? ` (${data.openSupportRequests})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/admin-audit')} activeOpacity={0.8}>
            <ScrollText size={15} color={palette.teal700} />
            <Text style={styles.logBtnText}>Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.teal600} />}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.grid}>
          {stats.map((s) => (
            <Card key={s.label} style={styles.statCard} variant="outlined">
              <View style={[styles.statIcon, { backgroundColor: `${s.color}18` }]}>
                <s.Icon size={16} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/admin-doctors')}>
          <Card style={styles.doctorsCard} variant="outlined">
            <View style={styles.doctorsIcon}>
              <Stethoscope size={18} color={palette.teal700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorsTitle}>Registered Doctors</Text>
              <Text style={styles.doctorsSub}>
                View every doctor account, profile & availability
              </Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </Card>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent attention signals</Text>
        {data?.alerts && data.alerts.length > 0 ? (
          data.alerts.map((alert, index) => (
            <Card key={`${alert.type}-${alert.patientId ?? 'x'}-${index}`} style={styles.alertCard} variant="outlined">
              <View style={styles.alertHeader}>
                <Badge label={priorityLabel(alert.priority)} status={priorityStatus(alert.priority)} />
                <Text style={styles.alertTime}>{formatDateTime(alert.at)}</Text>
              </View>
              <Text style={styles.alertMessage}>{alert.message || alert.type}</Text>
              {alert.patientName ? <Text style={styles.alertPatient}>{alert.patientName}</Text> : null}
              {alert.patientId != null ? (
                <TouchableOpacity
                  style={styles.alertLink}
                  onPress={() => router.push(`/admin-patient/${alert.patientId}`)}
                >
                  <Text style={styles.alertLinkText}>View patient →</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          ))
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No open attention signals right now.</Text>
          </Card>
        )}

        <Text style={styles.noteText}>
          Inactivity and medication signals are follow-up prompts only. They are never a medical
          diagnosis.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate50 },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: '800', color: palette.slate900 },
  headerSub: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 2 },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  logBtnText: { fontSize: typography.sizes.xs, fontWeight: '700', color: palette.teal700 },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing['3xl'] },
  errorText: { fontSize: typography.sizes.sm, color: palette.danger600, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    width: '31%',
    minWidth: 100,
    flexGrow: 1,
    padding: spacing.sm + 2,
    gap: spacing.xs,
    ...shadows.sm,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: typography.sizes.xl, fontWeight: '800', color: palette.slate900 },
  statLabel: { fontSize: typography.sizes.xs, color: palette.slate500, lineHeight: 15 },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '800',
    color: palette.slate900,
    marginTop: spacing.sm,
  },
  doctorsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  doctorsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorsTitle: { fontSize: typography.sizes.sm, fontWeight: '800', color: palette.slate900 },
  doctorsSub: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 1 },
  alertCard: { padding: spacing.md, gap: spacing.xs },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTime: { fontSize: typography.sizes.xs, color: palette.slate400 },
  alertMessage: { fontSize: typography.sizes.sm, color: palette.slate700, fontWeight: '600' },
  alertPatient: { fontSize: typography.sizes.xs, color: palette.slate500 },
  alertLink: { marginTop: spacing.xs },
  alertLinkText: { fontSize: typography.sizes.xs, fontWeight: '700', color: palette.teal600 },
  emptyCard: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.sizes.sm, color: palette.slate500 },
  noteText: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
    lineHeight: 16,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
});
