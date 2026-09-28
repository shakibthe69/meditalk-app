import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { Card, Badge, EditDoctorProfileModal } from '../../src/components';
import { useAuthStore } from '../../src/store';
import { doctorPortalApi } from '../../src/services/api';
import { DoctorPortalAccount } from '../../src/types';
import {
  Stethoscope,
  Hospital,
  MapPin,
  Clock,
  Activity,
  MessageCircle,
  Megaphone,
  LogOut,
  Pencil,
  BadgeCheck,
  Phone,
} from 'lucide-react-native';

export default function DoctorPortalScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [account, setAccount] = useState<DoctorPortalAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const loadAccount = async () => {
    try {
      const acc = await doctorPortalApi.getMyAccount();
      setAccount(acc);
    } catch (err) {
      console.log('Error loading doctor account:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAccount();
    }, [])
  );

  const handleToggleAvailability = async (value: boolean) => {
    setIsToggling(true);
    try {
      const updated = await doctorPortalApi.setAvailability(value);
      setAccount(updated);
    } catch (err) {
      console.log('Error toggling availability:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccount();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={palette.teal600} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.teal600} />
        }
      >        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {(account?.fullName || 'Dr')
                  .replace(/^Dr\.?\s*/i, '')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part.charAt(0).toUpperCase())
                  .join('') || 'DR'}
              </Text>
              <View
                style={[
                  styles.avatarStatusDot,
                  { backgroundColor: account?.isAvailable ? palette.success500 : palette.slate300 },
                ]}
              />
            </View>
            <View style={styles.profileMain}>
              <Text style={styles.doctorName}>{account?.fullName || 'Doctor'}</Text>
              <View style={styles.specializationRow}>
                <Stethoscope size={13} color={palette.teal600} />
                <Text style={styles.specialization} numberOfLines={1}>
                  {account?.specialization || '—'}
                </Text>
              </View>
              <View style={styles.badgeRow}>
                <Badge
                  label={account?.isAvailable ? 'Online' : 'Offline'}
                  status={account?.isAvailable ? 'SUCCESS' : 'DEFAULT'}
                  size="sm"
                />
                {account?.licenseNumber ? (
                  <Badge label={`Lic: ${account.licenseNumber}`} status="INFO" size="sm" />
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              activeOpacity={0.8}
              onPress={() => setShowEditProfile(true)}
              accessibilityLabel="Edit profile"
            >
              <Pencil size={15} color={palette.teal700} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsGrid}>
            {account?.hospitalOrClinic ? (
              <View style={styles.detailItem}>
                <Hospital size={14} color={palette.slate400} />
                <Text style={styles.detailValue} numberOfLines={2}>
                  {account.hospitalOrClinic}
                </Text>
              </View>
            ) : null}
            {account?.chamberAddress ? (
              <View style={styles.detailItem}>
                <MapPin size={14} color={palette.slate400} />
                <Text style={styles.detailValue} numberOfLines={2}>
                  {account.chamberAddress}
                </Text>
              </View>
            ) : null}
            {account?.visitingHours ? (
              <View style={styles.detailItem}>
                <Clock size={14} color={palette.slate400} />
                <Text style={styles.detailValue}>{account.visitingHours}</Text>
              </View>
            ) : null}
            {account?.phoneNumber ? (
              <View style={styles.detailItem}>
                <Phone size={14} color={palette.slate400} />
                <Text style={styles.detailValue}>{account.phoneNumber}</Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Availability Toggle */}
        <Card style={styles.availabilityCard}>
          <View style={styles.availabilityRow}>
            <View style={[styles.statusDot, { backgroundColor: account?.isAvailable ? palette.success500 : palette.slate300 }]} />
            <View style={styles.availabilityText}>
              <Text style={styles.availabilityTitle}>
                {account?.isAvailable ? 'You are Online' : 'You are Offline'}
              </Text>
              <Text style={styles.availabilitySubtitle}>
                {account?.isAvailable
                  ? 'Patients can see you and message you now.'
                  : 'Go online to receive patient messages.'}
              </Text>
            </View>
            <Switch
              value={account?.isAvailable ?? false}
              onValueChange={handleToggleAvailability}
              disabled={isToggling}
              trackColor={{ false: palette.slate300, true: palette.success500 }}
              thumbColor={palette.white}
            />
          </View>
        </Card>

        {/* Quick Links */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor-tabs)/messages')}
          >
            <View style={[styles.quickIcon, { backgroundColor: palette.blue50 }]}>
              <MessageCircle size={20} color={palette.blue600} />
            </View>
            <Text style={styles.quickLabel}>Patient Chats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor-tabs)/posts')}
          >
            <View style={[styles.quickIcon, { backgroundColor: palette.teal50 }]}>
              <Megaphone size={20} color={palette.teal700} />
            </View>
            <Text style={styles.quickLabel}>Post Update</Text>
          </TouchableOpacity>

          <View style={styles.quickBtn}>
            <View style={[styles.quickIcon, { backgroundColor: palette.success50 }]}>
              <Activity size={20} color={palette.success600} />
            </View>
            <Text style={styles.quickLabel}>
              {account?.isAvailable ? 'Accepting' : 'Paused'}
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout();
            router.replace('/(auth)/login');
          }}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={palette.danger600} />
          <Text style={styles.logoutBtnText}>Sign Out of Doctor Portal</Text>
        </TouchableOpacity>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            Doctor portal is for non-emergency follow-ups. Always advise patients to call
            emergency services for urgent situations.
          </Text>
        </View>
      </ScrollView>

      {/* Self-service profile editor */}
      <EditDoctorProfileModal
        visible={showEditProfile}
        doctor={account}
        onClose={() => setShowEditProfile(false)}
        onSaved={(updated) => setAccount(updated)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  profileCard: {
    marginBottom: spacing.base,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.teal200,
    marginRight: spacing.base,
  },
  avatarInitials: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: palette.teal700,
    letterSpacing: 0.5,
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: palette.white,
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specializationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  profileMain: {
    flex: 1,
  },
  doctorName: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: palette.slate900,
  },
  specialization: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detailsGrid: {
    flexDirection: 'column',
    gap: spacing.sm,
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailValue: {
    flex: 1,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate800,
  },
  availabilityCard: {
    marginBottom: spacing.base,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  availabilityText: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  availabilitySubtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.slate200,
    ...shadows.sm,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.slate700,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: palette.danger50,
    borderWidth: 1,
    borderColor: palette.danger100,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.base,
  },
  logoutBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.danger600,
  },
  disclaimerContainer: {
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  disclaimerText: {
    fontSize: typography.sizes.xs,
    color: palette.slate600,
    lineHeight: 18,
  },
});
