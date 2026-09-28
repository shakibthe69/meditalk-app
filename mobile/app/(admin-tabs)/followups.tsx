import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Badge, Button } from '../../src/components';
import { adminApi, FollowUp } from '../../src/services/api';
import { formatDateTime, priorityStatus, priorityLabel } from '../../src/utils/admin';
import { ClipboardList, Check, ChevronRight, RefreshCw } from 'lucide-react-native';

type StatusFilter = 'OPEN' | 'RESOLVED' | 'ALL';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'OPEN', label: 'Open' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'ALL', label: 'All' },
];

export default function AdminFollowUpsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('OPEN');

  const load = useCallback(async (status: StatusFilter) => {
    try {
      const data = await adminApi.followUps(status === 'ALL' ? undefined : status);
      setItems(data);
    } catch (err) {
      console.warn('Failed to load follow-ups:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      load(filter);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter])
  );

  const resolve = (item: FollowUp) => {
    Alert.alert('Resolve follow-up', `Mark ${item.patientName || 'this patient'} as resolved?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: async () => {
          try {
            await adminApi.resolveFollowUp(item.id);
            await load(filter);
          } catch (err) {
            console.warn('Failed to resolve follow-up:', err);
            Alert.alert('Error', 'Could not resolve this follow-up.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Follow-up Queue</Text>
          <Text style={styles.headerSub}>Patients flagged for administrative follow-up</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { setIsLoading(true); load(filter); }}>
          <RefreshCw size={16} color={palette.teal700} />
        </TouchableOpacity>
      </View>

      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={palette.teal600} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <ClipboardList size={44} color={palette.slate300} />
              <Text style={styles.emptyText}>Nothing in this queue.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card} variant="outlined">
              <View style={styles.cardHeader}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => item.patientId != null && router.push(`/admin-patient/${item.patientId}`)}>
                  <Text style={styles.name}>{item.patientName || `Patient #${item.patientId ?? '—'}`}</Text>
                  <Text style={styles.reason}>{item.reason || 'Follow-up required'}</Text>
                </TouchableOpacity>
                <Badge label={priorityLabel(item.priority)} status={priorityStatus(item.priority)} />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>Inactive {item.inactiveDays} day(s)</Text>
                <Text style={styles.meta}>· Unconfirmed {item.unconfirmedDoses}</Text>
                {item.adherencePercent != null ? (
                  <Text style={styles.meta}>· {item.adherencePercent}% adherence</Text>
                ) : null}
              </View>
              <Text style={styles.metaSmall}>
                Created {formatDateTime(item.createdAt)}
                {item.lastContactedAt ? ` · Last contact ${formatDateTime(item.lastContactedAt)}` : ''}
              </Text>

              <View style={styles.actionRow}>
                {item.patientId != null ? (
                  <Button
                    title="Open"
                    size="sm"
                    variant="secondary"
                    icon={<ChevronRight size={15} color={palette.teal700} />}
                    onPress={() => router.push(`/admin-patient/${item.patientId}`)}
                    style={{ flex: 1 }}
                  />
                ) : null}
                {item.status !== 'RESOLVED' ? (
                  <Button
                    title="Resolve"
                    size="sm"
                    variant="success"
                    icon={<Check size={15} color={palette.white} />}
                    onPress={() => resolve(item)}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <Badge label={`Resolved ${item.resolvedAt ? formatDateTime(item.resolvedAt) : ''}`} status="SUCCESS" />
                )}
              </View>
            </Card>
          )}
        />
      )}
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
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
  },
  chipActive: { backgroundColor: palette.teal600, borderColor: palette.teal600 },
  chipText: { fontSize: typography.sizes.xs, fontWeight: '600', color: palette.slate600 },
  chipTextActive: { color: palette.white },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: typography.sizes.sm, color: palette.slate500 },
  listContent: { padding: spacing.base, gap: spacing.sm, paddingBottom: spacing['3xl'] },
  card: { padding: spacing.md, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  name: { fontSize: typography.sizes.base, fontWeight: '700', color: palette.slate900 },
  reason: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  meta: { fontSize: typography.sizes.xs, color: palette.slate600 },
  metaSmall: { fontSize: typography.sizes.xs, color: palette.slate400 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignItems: 'center' },
});
