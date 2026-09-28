import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { palette, typography, spacing, borderRadius } from '../src/theme';
import { Card, Header } from '../src/components';
import { adminApi, AuditEntry } from '../src/services/api';
import { formatDateTime } from '../src/utils/admin';
import { ScrollText } from 'lucide-react-native';

export default function AdminAuditScreen() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.auditLogs();
      setEntries(data);
    } catch (err) {
      console.warn('Failed to load audit log:', err);
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

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Admin Activity Log" subtitle="Administrative actions and contact records" showBack />
      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={palette.teal600} />
        </View>
      ) : (
        <FlatList
          data={entries}
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
              <ScrollText size={44} color={palette.slate300} />
              <Text style={styles.emptyText}>No admin activity recorded yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card} variant="outlined">
              <View style={styles.row}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.action}>{item.action}</Text>
                  {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>{item.adminName || 'Admin'}</Text>
                    {item.patientId != null ? <Text style={styles.meta}>· Patient #{item.patientId}</Text> : null}
                    <Text style={styles.meta}>· {formatDateTime(item.createdAt)}</Text>
                  </View>
                </View>
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
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: typography.sizes.sm, color: palette.slate500 },
  listContent: { padding: spacing.base, gap: spacing.sm, paddingBottom: spacing['3xl'] },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.teal500,
    marginTop: 5,
  },
  action: { fontSize: typography.sizes.sm, fontWeight: '700', color: palette.slate900 },
  detail: { fontSize: typography.sizes.xs, color: palette.slate600, marginTop: 2, lineHeight: 17 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  meta: { fontSize: typography.sizes.xs, color: palette.slate400 },
});
