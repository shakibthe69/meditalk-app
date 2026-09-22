import React, { useState, useEffect } from 'react';
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
import { Button, Input } from '../common';
import { useMedicineStore, useSettingsStore } from '../../store';
import { FoodInstruction, DoseFrequency } from '../../types';
import { voiceService } from '../../services/voice';
import { X, Pill, Languages, Volume2 } from 'lucide-react-native';

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
  const { addMedicine, fetchTodayLogs, fetchMedicines } = useMedicineStore();
  const { language, t } = useSettingsStore();

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

  useEffect(() => {
    if (visible) {
      if (language === 'bn') {
        voiceService.speak('নতুন ওষুধ ও সময়সূচি যোগ করার ফর্ম খোলা হয়েছে।', 'bn');
      } else {
        voiceService.speak('Add new medicine form opened.', 'en');
      }
    }
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim() || !dose.trim()) {
      Alert.alert(
        language === 'bn' ? 'তথ্য প্রয়োজন' : 'Validation Error',
        language === 'bn' ? 'ওষুধের নাম এবং মাত্রা আবশ্যক।' : 'Medicine name and dose are required.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const schedules: Array<{
        time: string;
        label: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'CUSTOM';
        dosageAmount: string;
        foodInstruction: any;
        isEnabled: boolean;
      }> = [
        {
          time: morningTime,
          label: 'MORNING',
          dosageAmount: `1 ${dose.toLowerCase().includes('ml') ? 'Spoon' : 'Tablet'}`,
          foodInstruction,
          isEnabled: true,
        },
      ];

      if (frequency === 'TWICE_DAILY' || frequency === 'THRICE_DAILY') {
        schedules.push({
          time: nightTime,
          label: 'NIGHT' as const,
          dosageAmount: `1 ${dose.toLowerCase().includes('ml') ? 'Spoon' : 'Tablet'}`,
          foodInstruction,
          isEnabled: true,
        });
      }

      if (frequency === 'THRICE_DAILY') {
        schedules.push({
          time: '02:00 PM',
          label: 'AFTERNOON' as const,
          dosageAmount: `1 ${dose.toLowerCase().includes('ml') ? 'Spoon' : 'Tablet'}`,
          foodInstruction,
          isEnabled: true,
        });
      }

      await addMedicine({
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        dose: dose.trim(),
        form: dose.toLowerCase().includes('ml') ? 'SYRUP' : dose.toLowerCase().includes('cap') ? 'CAPSULE' : 'TABLET',
        frequency,
        foodInstruction,
        startDate: new Date().toISOString().split('T')[0],
        durationDays: parseInt(durationDays, 10) || 10,
        instructions: instructions.trim() || `${foodInstruction.replace('_', ' ')} for ${durationDays} days`,
        isActive: true,
        schedules: schedules as any,
      });

      await Promise.all([fetchMedicines(), fetchTodayLogs()]);

      if (language === 'bn') {
        voiceService.speak(`${name} ওষুধ ডাটাবেজে যুক্ত হয়েছে এবং দৈনিক রিমাইন্ডার সেট হয়েছে।`, 'bn');
      } else {
        voiceService.speak(`${name} added to database and reminders scheduled.`, 'en');
      }

      Alert.alert(
        language === 'bn' ? 'সফল' : 'Success',
        language === 'bn'
          ? 'নতুন ওষুধ ডাটাবেজে সংরক্ষিত হয়েছে এবং আজকের সময়সূচিতে যুক্ত হয়েছে।'
          : 'Medicine and daily reminder schedules created in database!'
      );

      (onSaved || onSuccess)?.();
      onClose();

      // Reset
      setName('');
      setGenericName('');
      setInstructions('');
    } catch (e) {
      console.warn('Failed to save medicine:', e);
      Alert.alert(
        language === 'bn' ? 'ব্যর্থ' : 'Error',
        language === 'bn' ? 'ওষুধ সংরক্ষণ করা সম্ভব হয়নি।' : 'Failed to save medication.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{language === 'bn' ? 'নতুন ওষুধ যোগ করুন' : 'Add New Medicine'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={palette.slate600} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Input
            label={language === 'bn' ? 'ওষুধের ব্র্যান্ড নাম *' : 'Medicine Brand Name *'}
            placeholder="e.g. Napa, Seclo, Maxpro, Rosuva"
            value={name}
            onChangeText={setName}
            leftIcon={<Pill size={18} color={palette.teal700} />}
          />

          <Input
            label={language === 'bn' ? 'জেনেরিক / উপাদান নাম' : 'Generic / Molecule Name'}
            placeholder="e.g. Paracetamol, Omeprazole, Rosuvastatin"
            value={genericName}
            onChangeText={setGenericName}
          />

          <View style={styles.row}>
            <Input
              label={language === 'bn' ? 'মাত্রা (Dose) *' : 'Dosage *'}
              placeholder="e.g. 500mg, 20mg, 10ml"
              value={dose}
              onChangeText={setDose}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label={language === 'bn' ? 'মেয়াদ (দিন)' : 'Duration (Days)'}
              placeholder="10"
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
          </View>

          {/* Food Instruction Selector */}
          <Text style={styles.sectionLabel}>{t.mealInstruction}</Text>
          <View style={styles.chipsRow}>
            {[
              { key: 'AFTER_MEAL', label: t.afterMeal },
              { key: 'BEFORE_MEAL', label: t.beforeMeal },
              { key: 'EMPTY_STOMACH', label: t.emptyStomach },
              { key: 'WITH_MEAL', label: t.withMeal },
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
          <Text style={styles.sectionLabel}>{language === 'bn' ? 'সেবনের পৌনঃপুনিকতা' : 'Frequency'}</Text>
          <View style={styles.chipsRow}>
            {[
              { key: 'ONCE_DAILY', label: language === 'bn' ? 'দিনে ১ বার (1x)' : '1x Daily' },
              { key: 'TWICE_DAILY', label: language === 'bn' ? 'দিনে ২ বার (সকাল ও রাত)' : '2x Daily (Morning & Night)' },
              { key: 'THRICE_DAILY', label: language === 'bn' ? 'দিনে ৩ বার (সকাল, দুপুর ও রাত)' : '3x Daily' },
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
            label={language === 'bn' ? 'বিশেষ নির্দেশাবলি' : 'Special Instructions'}
            placeholder="e.g. ভরা পেটে প্রচুর পানি দিয়ে সেবন করুন"
            value={instructions}
            onChangeText={setInstructions}
          />

          <Button
            title={language === 'bn' ? 'ওষুধ সংরক্ষণ ও শিডিউল সেট করুন' : 'Save Medicine & Schedule'}
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
