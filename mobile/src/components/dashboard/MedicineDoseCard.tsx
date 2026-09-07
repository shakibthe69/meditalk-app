import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { palette, typography, borderRadius, spacing } from '../../theme';
import { MedicineLog } from '../../types';
import { Check, X, Clock, Utensils } from 'lucide-react-native';

interface MedicineDoseCardProps {
  log: MedicineLog;
  onTake: (id: string) => void;
  onSkip: (id: string) => void;
}

export const MedicineDoseCard: React.FC<MedicineDoseCardProps> = ({
  log,
  onTake,
  onSkip,
}) => {
  const isTaken = log.status === 'TAKEN';
  const isSkipped = log.status === 'SKIPPED';
  const isMissed = log.status === 'MISSED';
  const isPending = log.status === 'PENDING';

  const formatFoodInstruction = (inst?: string) => {
    switch (inst) {
      case 'BEFORE_MEAL':
        return 'Before breakfast / meal';
      case 'AFTER_MEAL':
        return 'After lunch / meal';
      case 'WITH_MEAL':
        return 'With meal';
      case 'EMPTY_STOMACH':
        return 'On empty stomach';
      default:
        return 'No food restriction';
    }
  };

  return (
    <Card
      style={[
        styles.card,
        isTaken && styles.cardTaken,
        isSkipped && styles.cardSkipped,
        isMissed && styles.cardMissed,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.timeContainer}>
          <Clock size={16} color={palette.slate500} />
          <Text style={styles.timeText}>{log.scheduledTime}</Text>
        </View>

        <Badge
          label={log.status}
          status={log.status}
          size="sm"
        />
      </View>

      <View style={styles.mainInfo}>
        <Text style={styles.medicineName}>{log.medicineName}</Text>
        <Text style={styles.dosageText}>Dosage: {log.dose}</Text>

        <View style={styles.foodRow}>
          <Utensils size={14} color={palette.teal700} />
          <Text style={styles.foodText}>{formatFoodInstruction(log.foodInstruction)}</Text>
        </View>
      </View>

      {isPending ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.actionButton, styles.skipButton]}
            onPress={() => onSkip(log.id)}
          >
            <X size={16} color={palette.slate600} />
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.actionButton, styles.takeButton]}
            onPress={() => onTake(log.id)}
          >
            <Check size={16} color={palette.white} />
            <Text style={styles.takeButtonText}>Take Medicine</Text>
          </TouchableOpacity>
        </View>
      ) : isTaken ? (
        <View style={styles.completedRow}>
          <Check size={16} color={palette.success600} />
          <Text style={styles.completedText}>
            Taken at {log.takenTime || 'Scheduled time'}
          </Text>
        </View>
      ) : isSkipped ? (
        <View style={styles.completedRow}>
          <X size={16} color={palette.warning600} />
          <Text style={styles.skippedText}>Dose skipped</Text>
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
  },
  cardTaken: {
    borderColor: palette.success100,
    backgroundColor: '#F8FFF9',
  },
  cardSkipped: {
    borderColor: palette.warning100,
    backgroundColor: '#FFFCF5',
  },
  cardMissed: {
    borderColor: palette.danger100,
    backgroundColor: '#FFF8F8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate800,
  },
  mainInfo: {
    marginBottom: spacing.md,
  },
  medicineName: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: 2,
  },
  dosageText: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
    marginBottom: spacing.xs,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.teal50,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 2,
  },
  foodText: {
    fontSize: typography.sizes.xs,
    color: palette.teal800,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  skipButton: {
    flex: 1,
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  skipButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.slate700,
  },
  takeButton: {
    flex: 2,
    backgroundColor: palette.teal600,
  },
  takeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.white,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  completedText: {
    fontSize: typography.sizes.sm,
    color: palette.success600,
    fontWeight: '600',
  },
  skippedText: {
    fontSize: typography.sizes.sm,
    color: palette.warning600,
    fontWeight: '600',
  },
});
