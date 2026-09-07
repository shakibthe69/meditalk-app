import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useMedicineStore } from '../../src/store';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { Card, Badge, Header, AddMedicineModal } from '../../src/components';
import {
  Search,
  Plus,
  Pill,
  Clock,
  Utensils,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react-native';

export default function MedicinesScreen() {
  const { medicines, toggleMedicineStatus, deleteMedicine, fetchMedicines, isLoading } = useMedicineStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMedicines();
    setRefreshing(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Remove Medication',
      `Are you sure you want to remove "${name}" from your active schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteMedicine(id),
        },
      ]
    );
  };

  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'ACTIVE') return matchesSearch && med.isActive;
    if (filter === 'INACTIVE') return matchesSearch && !med.isActive;
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Medicines"
        subtitle={`${medicines.length} total recorded medications`}
        rightAction={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
          >
            <Plus size={20} color={palette.white} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={palette.slate400} style={styles.searchIcon} />
          <TextInput
            placeholder="Search medicine or generic name..."
            placeholderTextColor={palette.slate400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterPill,
                filter === item && styles.filterPillActive,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filter === item && styles.filterPillTextActive,
                ]}
              >
                {item === 'ALL' ? 'All Medications' : item === 'ACTIVE' ? 'Active' : 'Completed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Medicine List */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.teal600} />
          }
        >
          {filteredMedicines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Pill size={48} color={palette.slate300} />
              <Text style={styles.emptyTitle}>No medications found</Text>
              <Text style={styles.emptySubtitle}>
                Add your active prescriptions or tap below to enter a medicine schedule.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
              >
                <Plus size={16} color={palette.white} />
                <Text style={styles.emptyActionBtnText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredMedicines.map((med) => (
              <Card key={med.id} style={styles.medCard}>
                <View style={styles.medHeaderRow}>
                  <View style={styles.medIconBadge}>
                    <Pill size={20} color={palette.teal700} />
                  </View>

                  <View style={styles.medNameContainer}>
                    <Text style={styles.medName}>{med.name}</Text>
                    {med.genericName && (
                      <Text style={styles.genericName}>{med.genericName}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleMedicineStatus(med.id)}
                    activeOpacity={0.7}
                  >
                    <Badge
                      label={med.isActive ? 'Active' : 'Inactive'}
                      status={med.isActive ? 'PRIMARY' : 'DEFAULT'}
                      size="sm"
                    />
                  </TouchableOpacity>
                </View>

                {/* Details Section */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Dosage</Text>
                    <Text style={styles.detailValue}>{med.dose || '1 tablet'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Frequency</Text>
                    <Text style={styles.detailValue}>
                      {med.frequency ? med.frequency.replace(/_/g, ' ') : 'DAILY'}
                    </Text>
                  </View>
                </View>

                {/* Schedules */}
                {med.schedules && med.schedules.length > 0 && (
                  <View style={styles.scheduleRow}>
                    <Clock size={14} color={palette.slate500} />
                    <Text style={styles.scheduleText}>
                      Schedules:{' '}
                      {med.schedules.map((s) => `${s.time} (${s.dosageAmount || '1 dose'})`).join(', ')}
                    </Text>
                  </View>
                )}

                {/* Instructions */}
                {med.instructions && (
                  <View style={styles.instructionBox}>
                    <Utensils size={14} color={palette.teal700} />
                    <Text style={styles.instructionText}>{med.instructions}</Text>
                  </View>
                )}

                {/* Footer / Delete */}
                <View style={styles.cardFooter}>
                  <View style={styles.dateInfo}>
                    <Calendar size={12} color={palette.slate400} />
                    <Text style={styles.dateText}>Started: {med.startDate || 'Current'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(med.id, med.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color={palette.danger500} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      </View>

      {/* Add Medicine Modal */}
      <AddMedicineModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => fetchMedicines()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 46,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  filterPillActive: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  filterPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate700,
  },
  filterPillTextActive: {
    color: palette.white,
  },
  listContent: {
    paddingBottom: spacing['4xl'],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.slate800,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal600,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  emptyActionBtnText: {
    color: palette.white,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  medCard: {
    marginBottom: spacing.md,
  },
  medHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  medIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: palette.teal100,
  },
  medNameContainer: {
    flex: 1,
  },
  medName: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  genericName: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.sizes.xs - 2,
    color: palette.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    color: palette.slate800,
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  scheduleText: {
    fontSize: typography.sizes.xs,
    color: palette.slate600,
    fontWeight: '500',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.teal50,
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  instructionText: {
    fontSize: typography.sizes.xs,
    color: palette.teal900,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
});
