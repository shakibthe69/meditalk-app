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
  Linking,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { palette, typography, spacing, borderRadius } from '../src/theme';
import { Card, Badge, Button, Header } from '../src/components';
import { adminApi, HelpRequest } from '../src/services/api';
import { formatDateTime } from '../src/utils/admin';
import { MessageSquare, Phone, Check } from 'lucide-react-native';

type StatusFilter = 'NEW' | 'ACKNOWLEDGED' | 'CONTACTED' | 'RESOLVED' | 'ALL';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'NEW', label: 'New' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'ALL', label: 'All' },
];

function statusBadge(status?: string): 'DANGER' | 'WARNING' | 'INFO' | 'SUCCESS' | 'DEFAULT' {
  switch ((status || '').toUpperCase()) {
    case 'NEW':
      return 'DANGER';
    case 'ACKNOWLEDGED':
      return 'WARNING';
    case 'CONTACTED':
      return 'INFO';
    case 'RESOLVED':
      return 'SUCCESS';
    default:
      return 'DEFAULT';
  }
}

export default function AdminMessagesScreen() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('NEW');

  const load = useCallback(async (status: StatusFilter) => {
    try {
      const data = await adminApi.helpRequests(status === 'ALL' ? undefined : status);
      setRequests(data);
    } catch (err) {
      console.warn('Failed to load help requests:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      load(filter);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter])
  );

  const update = async (request: HelpRequest, status: string, label: string) => {
    try {
      await adminApi.updateHelpRequest(request.id, status);
      await load(filter);
      Alert.alert('Updated', `Marked as ${label}.`);
    } catch (err) {
      console.warn('Failed to update help request:', err);
      Alert.alert('Error', 'Could not update this request.');
    }
  };

  const callPatient = (request: HelpRequest) => {
    if (!request.patientPhone) {
      Alert.alert('No phone number', 'This patient has no phone number on file.');
      return;
    }
    Linking.openURL(`tel:${request.patientPhone.replace(/\s+/g, '')}`).catch(() =>
      Alert.alert('Cannot call', 'This device cannot place phone calls.')
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Patient Messages" subtitle="Requests sent by users to admin" showBack />

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
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(filter);
              }}
              tintColor={palette.teal600}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <MessageSquare size={44} color={palette.slate300} />
              <Text style={styles.emptyText}>No requests in this view.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card} variant="outlined">
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.patientName || `Patient #${item.patientId ?? '—'}`}</Text>
                  <Text style={styles.type}>
                    {(item.type || 'GENERAL').replace('_', ' ')} · {formatDateTime(item.createdAt)}
                  </Text>
                </View>
                <Badge label={item.status || 'NEW'} status={statusBadge(item.status)} />
              </View>

              <Text style={styles.message}>{item.message}</Text>
              {item.resolutionNote ? (
                <Text style={styles.resolution}>Resolution: {item.resolutionNote}</Text>
              ) : null}
              {item.handledBy ? <Text style={styles.meta}>Handled by {item.handledBy}</Text> : null}

              <View style={styles.actionRow}>
                <Button
                  title="Call"
                  size="sm"
                  icon={<Phone size={15} color={palette.white} />}
                  onPress={() => callPatient(item)}
                  style={{ flex: 1 }}
                />
                {item.status === 'NEW' ? (
                  <Button
                    title="Acknowledge"
                    size="sm"
                    variant="secondary"
                    onPress={() => update(item, 'ACKNOWLEDGED', 'acknowledged')}
                    style={{ flex: 1 }}
                  />
                ) : null}
                {item.status !== 'RESOLVED' ? (
                  <Button
                    title="Resolve"
                    size="sm"
                    variant="success"
                    icon={<Check size={15} color={palette.white} />}
                    onPress={() => update(item, 'RESOLVED', 'resolved')}
                    style={{ flex: 1 }}
                  />
                ) : null}
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
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
  type: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 2 },
  message: { fontSize: typography.sizes.sm, color: palette.slate700, lineHeight: 20, marginTop: 2 },
  resolution: { fontSize: typography.sizes.xs, color: palette.success600 },
  meta: { fontSize: typography.sizes.xs, color: palette.slate400 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
