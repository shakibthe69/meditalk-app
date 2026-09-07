import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette, typography, spacing } from '../../theme';
import { AdherenceStats } from '../../types';

interface AdherenceRingProps {
  stats: AdherenceStats;
  size?: number;
  strokeWidth?: number;
}

export const AdherenceRing: React.FC<AdherenceRingProps> = ({
  stats,
  size = 110,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(stats.takenPercentage, 0), 100);
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={palette.slate100}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={palette.teal600}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </Svg>

        {/* Center Percentage Display */}
        <View style={styles.centerTextContainer}>
          <Text style={styles.percentageText}>{percentage}%</Text>
          <Text style={styles.labelText}>Adherence</Text>
        </View>
      </View>

      {/* Breakdown Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <View style={[styles.dot, { backgroundColor: palette.success500 }]} />
          <Text style={styles.metricLabel}>Taken</Text>
          <Text style={styles.metricValue}>{stats.takenPercentage}%</Text>
        </View>

        <View style={styles.metricItem}>
          <View style={[styles.dot, { backgroundColor: palette.danger500 }]} />
          <Text style={styles.metricLabel}>Missed</Text>
          <Text style={styles.metricValue}>{stats.missedPercentage}%</Text>
        </View>

        <View style={styles.metricItem}>
          <View style={[styles.dot, { backgroundColor: palette.warning500 }]} />
          <Text style={styles.metricLabel}>Skipped</Text>
          <Text style={styles.metricValue}>{stats.skippedPercentage}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: palette.slate900,
  },
  labelText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: '600',
    color: palette.slate500,
    textTransform: 'uppercase',
  },
  metricsContainer: {
    flex: 1,
    marginLeft: spacing.lg,
    justifyContent: 'space-around',
    height: 90,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  metricLabel: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
    flex: 1,
  },
  metricValue: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate900,
  },
});
