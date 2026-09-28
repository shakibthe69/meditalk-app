import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { Card, Button } from '../../src/components';
import { useAuthStore } from '../../src/store';
import { ShieldCheck, Mail, LogOut, KeyRound } from 'lucide-react-native';

export default function AdminAccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Sign out of the Admin Panel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Account</Text>
        <Text style={styles.headerSub}>Session and access details</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <ShieldCheck size={30} color={palette.white} />
          </View>
          <Text style={styles.name}>{user?.fullName || 'Administrator'}</Text>
          <View style={styles.emailRow}>
            <Mail size={14} color={palette.slate400} />
            <Text style={styles.email}>{user?.email || '—'}</Text>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>ADMIN · full patient oversight</Text>
          </View>
        </Card>

        <Card style={styles.infoCard} variant="outlined">
          <View style={styles.infoRow}>
            <KeyRound size={16} color={palette.slate500} />
            <Text style={styles.infoText}>
              Admin credentials are managed server-side. Set ADMIN_EMAIL / ADMIN_PASSWORD before
              starting the backend to change the seeded account.
            </Text>
          </View>
        </Card>

        <Button
          title="Sign Out"
          variant="danger"
          icon={<LogOut size={18} color={palette.white} />}
          onPress={handleLogout}
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: '800', color: palette.slate900 },
  headerSub: { fontSize: typography.sizes.xs, color: palette.slate500, marginTop: 2 },
  content: { padding: spacing.base, gap: spacing.md },
  profileCard: { alignItems: 'center', padding: spacing.xl, ...shadows.sm },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.teal600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: { fontSize: typography.sizes.lg, fontWeight: '800', color: palette.slate900 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  email: { fontSize: typography.sizes.sm, color: palette.slate500 },
  rolePill: {
    marginTop: spacing.md,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  roleText: { fontSize: typography.sizes.xs, fontWeight: '700', color: palette.teal700 },
  infoCard: { padding: spacing.md },
  infoRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: typography.sizes.xs, color: palette.slate600, lineHeight: 18 },
});
