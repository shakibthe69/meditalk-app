import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Button } from '../../src/components';
import { ShieldCheck, BellRing, ScanLine, FileText } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: BellRing,
    title: 'Never Miss a Dose',
    description: 'Smart medication reminders with customized morning, afternoon, and night schedules.',
    highlight: '92% Average Adherence',
  },
  {
    icon: ScanLine,
    title: 'AI Prescription Scanner',
    description: 'Instantly digitize doctor prescriptions with OCR and structured AI parsing with your verification.',
    highlight: 'Safe & Verified',
  },
  {
    icon: FileText,
    title: 'Complete Health History',
    description: 'Store prescriptions, lab reports, doctor visits, and generate 1-click doctor-ready PDF reports.',
    highlight: 'Doctor-Ready PDF',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(auth)/login');
  };

  const SlideIcon = SLIDES[currentSlide].icon;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.logoText}>Meditalk</Text>
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slideContent}>
        <View style={styles.iconContainer}>
          <SlideIcon size={64} color={palette.teal600} />
        </View>

        <View style={styles.badge}>
          <ShieldCheck size={14} color={palette.teal700} />
          <Text style={styles.badgeText}>{SLIDES[currentSlide].highlight}</Text>
        </View>

        <Text style={styles.title}>{SLIDES[currentSlide].title}</Text>
        <Text style={styles.description}>{SLIDES[currentSlide].description}</Text>

        {/* Indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentSlide ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Button
          title={currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          size="lg"
          fullWidth
        />
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => {
            completeOnboarding();
            router.replace('/(auth)/login');
          }}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.white,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  logoText: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: palette.teal600,
  },
  skipText: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    fontWeight: '600',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: palette.teal100,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal800,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '800',
    color: palette.slate900,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.sizes.base,
    color: palette.slate600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 28,
    backgroundColor: palette.teal600,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: palette.slate200,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  loginLink: {
    marginTop: spacing.base,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
  },
  loginLinkBold: {
    fontWeight: '700',
    color: palette.teal600,
  },
});
