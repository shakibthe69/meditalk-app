import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { Button, Input, Card } from '../common';
import { useMedicineStore } from '../../store';
import { FoodInstruction, DoseFrequency } from '../../types';
import { X, Pill, Clock, Calendar } from 'lucide-react-native';

interface AddMedicineModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onSuccess?: () => void;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  visible,
  onClose,
  onSaved,
  onSuccess,
}) => {
  const { addMedicine } = useMedicineStore();

  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dose, setDose] = useState('500mg');
  const [frequency, setFrequency] = useState<DoseFrequency>('TWICE_DAILY');
  const [foodInstruction, setFoodInstruction] = useState<FoodInstruction>('AFTER_MEAL');
  const [durationDays, setDurationDays] = useState('10');
  const [instructions, setInstructions] = useState('');
  const [morningTime, setMorningTime] = useState('08:00 AM');
  const [nightTime, setNightTime] = useState('10:00 PM');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !dose.trim()) {
      Alert.alert('Validation Error', 'Medicine name and dose are required.');
      return;
    }

    setIsSaving(true);
    try {
      const schedules = [
        {
          time: morningTime,
          label: 'MORNING' as const,
          dosageAmount: '1 Tablet',
          foodInstruction,
          isEnabled: true,
        },
      ];

      if (frequency === 'TWICE_DAILY' || frequency === 'THRICE_DAILY') {
        schedules.push({
          time: nightTime,
          label: 'NIGHT' as const,
          dosageAmount: '1 Tablet',
          foodInstruction,
          isEnabled: true,
        });
      }

      await addMedicine({
        name,
        genericName,
        dose,
        form: 'TABLET',
        frequency,
        foodInstruction,
        startDate: new Date().toISOString().split('T')[0],
        durationDays: parseInt(durationDays, 10) || 10,
        instructions: instructions || `${foodInstruction.replace('_', ' ')} for ${durationDays} days`,
        isActive: true,
        schedules: schedules as any,
      });

      Alert.alert('Success', 'Medicine and daily reminder schedules created!');
      (onSaved || onSuccess)?.();
      onClose();
      // Reset
      setName('');
      setGenericName('');
      setInstructions('');
    } catch (e) {
      Alert.alert('Error', 'Failed to save medication.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Medicine</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={palette.slate600} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Input
            label="Medicine Brand Name *"
            placeholder="e.g. Napa, Omeprazole, Lipitor"
            value={name}
            onChangeText={setName}
            leftIcon={<Pill size={18} color={palette.slate400} />}
          />

          <Input
            label="Generic / Molecule Name"
            placeholder="e.g. Paracetamol, Omeprazole Magnesium"
            value={genericName}
            onChangeText={setGenericName}
          />

          <View style={styles.row}>
            <Input
              label="Dosage *"
              placeholder="e.g. 500mg, 20mg"
              value={dose}
              onChangeText={setDose}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Duration (Days)"
              placeholder="10"
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
          </View>

          {/* Food Instruction Selector */}
          <Text style={styles.sectionLabel}>Food Timing</Text>
          <View style={styles.chipsRow}>
            {[
              { key: 'BEFORE_MEAL', label: 'Before Meal' },
              { key: 'AFTER_MEAL', label: 'After Meal' },
              { key: 'WITH_MEAL', label: 'With Meal' },
              { key: 'EMPTY_STOMACH', label: 'Empty Stomach' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.chip, foodInstruction === item.key && styles.chipActive]}
                onPress={() => setFoodInstruction(item.key as FoodInstruction)}
              >
                <Text style={[styles.chipText, foodInstruction === item.key && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Frequency Selector */}
          <Text style={styles.sectionLabel}>Frequency</Text>
          <View style={styles.chipsRow}>
            {[
              { key: 'ONCE_DAILY', label: '1x Daily' },
              { key: 'TWICE_DAILY', label: '2x Daily (Morning & Night)' },
              { key: 'THRICE_DAILY', label: '3x Daily' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.chip, frequency === item.key && styles.chipActive]}
                onPress={() => setFrequency(item.key as DoseFrequency)}
              >
                <Text style={[styles.chipText, frequency === item.key && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Special Instructions"
            placeholder="e.g. Take with a full glass of water at bedtime"
            value={instructions}
            onChangeText={setInstructions}
          />

          <Button
            title="Save Medicine & Schedule"
            onPress={handleSave}
            loading={isSaving}
            size="lg"
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.slate900,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.slate700,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
  },
  chipActive: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate700,
  },
  chipTextActive: {
    color: palette.white,
  },
});
