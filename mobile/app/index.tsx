import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store';
import { palette, typography, spacing } from '../src/theme';
import { HeartPulse } from 'lucide-react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useAuthStore();

  useEffect(() => {
    // Splash timeout to simulate startup & route
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding) {
        router.replace('/(auth)/onboarding');
      } else if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, hasCompletedOnboarding]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <HeartPulse size={48} color={palette.white} />
        </View>
        <Text style={styles.appName}>Meditalk</Text>
        <Text style={styles.tagline}>Smart Healthcare Records & Medicine Reminders</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={palette.teal600} />
        <Text style={styles.loadingText}>Securing your health records...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.white,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: palette.teal600,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: palette.teal600,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: typography.sizes['3xl'],
    fontWeight: '800',
    color: palette.slate900,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 260,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
    fontWeight: '500',
  },
});
