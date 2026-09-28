import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Badge } from '../../src/components';
import { adminApi, PatientSummary, PatientQuery } from '../../src/services/api';
import { formatDate, priorityStatus, priorityLabel } from '../../src/utils/admin';
import { Search, Phone, ChevronRight, Users } from 'lucide-react-native';

type FilterKey = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOW' | 'HIGH';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'INACTIVE', label: 'Inactive' },
  { key: 'LOW', label: 'Low adherence' },
  { key: 'HIGH', label: 'High priority' },
];

function queryFor(filter: FilterKey, search: string): PatientQuery {
  const query: PatientQuery = {};
  if (search.trim()) query.search = search.trim();
  switch (filter) {
    case 'ACTIVE':
      query.status = 'ACTIVE';
      break;
    case 'INACTIVE':
      query.status = 'INACTIVE';
      break;
    case 'LOW':
      query.adherence = 'LOW';
      break;
    case 'HIGH':
      query.priority = 'HIGH_PRIORITY';
      break;
    default:
      break;
  }
  return query;
}

export default function AdminPatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const load = useCallback(
    async (activeFilter: FilterKey, activeSearch: string) => {
      try {
        const data = await adminApi.patients(queryFor(activeFilter, activeSearch));
        setPatients(data);
      } catch (err) {
        console.warn('Failed to load patients:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      load(filter, search);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter])
  );

  const onSelectFilter = (next: FilterKey) => {
    setFilter(next);
    setIsLoading(true);
    load(next, search);
  };

  const onSubmitSearch = () => {
    setIsLoading(true);
    load(filter, search);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patients</Text>
        <Text style={styles.headerSub}>Search, filter and inspect patient records</Text>
      </View>

      <View style={styles.searchRow}>
        <Search size={16} color={palette.slate400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or phone"
          placeholderTextColor={palette.slate400}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSubmitSearch}
          returnKeyType="search"
        />
      </View>

      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => onSelectFilter(f.key)}
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
          data={patients}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <Users size={40} color={palette.slate300} />
              <Text style={styles.emptyText}>No patients match this view.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/admin-patient/${item.id}`)}>
              <Card style={styles.card} variant="outlined">
                <View style={styles.cardBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name || 'Unnamed patient'}</Text>
                    <Text style={styles.meta}>{item.email || '—'}</Text>
                    <View style={styles.metaRow}>
                      {item.phone ? (
                        <View style={styles.metaItem}>
                          <Phone size={12} color={palette.slate400} />
                          <Text style={styles.metaSmall}>{item.phone}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.metaSmall}>Last active: {formatDate(item.lastActiveAt)}</Text>
                    </View>
                    <View style={styles.badgeRow}>
                      <Badge label={priorityLabel(item.followUpPriority)} status={priorityStatus(item.followUpPriority)} />
                      {item.inactiveDays != null && item.inactiveDays > 0 ? (
                        <Badge label={`${item.inactiveDays}d inactive`} status="WARNING" />
                      ) : (
                        <Badge label="Active" status="SUCCESS" />
                      )}
                      {item.adherencePercent != null ? (
                        <Badge label={`${item.adherencePercent}% adherence`} status={item.adherencePercent < 70 ? 'DANGER' : 'INFO'} />
                      ) : null}
                    </View>
                  </View>
                  <ChevronRight size={20} color={palette.slate300} />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
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
  },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: '800', color: palette.slate900 },
  headerSub: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 2 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: typography.sizes.sm, color: palette.slate900 },
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
  card: { padding: spacing.md },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: typography.sizes.base, fontWeight: '700', color: palette.slate900 },
  meta: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaSmall: { fontSize: typography.sizes.xs, color: palette.slate400 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
});
