import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import { palette, typography, spacing, borderRadius, shadows } from '../../theme';
import { doctorPortalApi } from '../../services/api';
import { DoctorPortalAccount, DoctorPost } from '../../types';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRealtimeStore } from '../../store/useRealtimeStore';
import { PatientChatModal } from './PatientChatModal';
import {
  ChevronLeft,
  MapPin,
  Stethoscope,
  Clock,
  MessageCircle,
  Search,
  PhoneCall,
  Video,
  X,
  Megaphone,
  User,
  Sparkles,
} from 'lucide-react-native';

interface DoctorDirectoryProps {
  /** Leaves the directory (router.back() when shown as the /doctors route). */
  onClose: () => void;
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({ onClose }) => {
  const { t, language } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'NEWSFEED'>('DIRECTORY');
  const [doctors, setDoctors] = useState<DoctorPortalAccount[]>([]);
  const [posts, setPosts] = useState<DoctorPost[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [activeDoctor, setActiveDoctor] = useState<DoctorPortalAccount | null>(null);
  const [showChat, setShowChat] = useState(false);

  const onlineUserIds = useRealtimeStore((s) => s.onlineUserIds);
  const startCall = useRealtimeStore((s) => s.startCall);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docData, postData] = await Promise.all([
        doctorPortalApi.getDoctorDirectory(),
        doctorPortalApi.getAllPosts(),
      ]);
      setDoctors(docData || []);
      setPosts(postData || []);
    } catch (err) {
      console.log('Error loading doctor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /** Live socket presence, falling back to the doctor's own availability flag. */
  const isLive = (doctor: DoctorPortalAccount) =>
    onlineUserIds.includes(String(doctor.userId)) || !!doctor.isAvailable;

  /** Online doctors first, then most recently active, then name. */
  const sortedDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...doctors]
      .filter((d) =>
        query.length === 0
          ? true
          : (d.fullName || '').toLowerCase().includes(query) ||
            (d.specialization || '').toLowerCase().includes(query) ||
            (d.hospitalOrClinic || '').toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const aOnline = isLive(a);
        const bOnline = isLive(b);
        if (aOnline !== bOnline) return aOnline ? -1 : 1;
        const ta = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const tb = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        if (ta !== tb) return tb - ta;
        return (a.fullName || '').localeCompare(b.fullName || '');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, search, onlineUserIds]);

  const onlineCount = useMemo(
    () => doctors.filter((d) => isLive(d)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doctors, onlineUserIds]
  );

  const openChat = (doctor: DoctorPortalAccount) => {
    setActiveDoctor(doctor);
    setShowChat(true);
  };

  const handleStartCall = (doctor: DoctorPortalAccount, callType: 'AUDIO' | 'VIDEO') => {
    startCall(String(doctor.userId), doctor.fullName, callType);
  };

  const renderDoctor = ({ item }: { item: DoctorPortalAccount }) => {
    const live = isLive(item);
    return (
      <View style={styles.doctorCard}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => openChat(item)}>
          <View style={styles.doctorMain}>
            <View style={styles.avatar}>
              <Stethoscope size={22} color={palette.teal700} />
              {live ? <View style={styles.avatarOnlineDot} /> : null}
            </View>
            <View style={styles.doctorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  {item.fullName}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    live ? styles.statusPillOnline : styles.statusPillOffline,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: live ? palette.success500 : palette.slate400 },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: live ? palette.success700 : palette.slate500 },
                    ]}
                  >
                    {live ? t.onlineNow : t.offlineNow}
                  </Text>
                </View>
              </View>
              <Text style={styles.specialization} numberOfLines={1}>
                {item.specialization}
              </Text>
              {item.hospitalOrClinic ? (
                <View style={styles.metaRow}>
                  <MapPin size={11} color={palette.slate400} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.hospitalOrClinic}
                  </Text>
                </View>
              ) : null}
              {item.visitingHours ? (
                <View style={styles.metaRow}>
                  <Clock size={11} color={palette.slate400} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.visitingHours}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.chatBtn}
            activeOpacity={0.8}
            onPress={() => openChat(item)}
          >
            <MessageCircle size={15} color={palette.white} />
            <Text style={styles.chatBtnText}>{t.message}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleStartCall(item, 'VIDEO')}
            accessibilityLabel={t.videoCall}
          >
            <Video size={16} color={palette.teal700} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleStartCall(item, 'AUDIO')}
            accessibilityLabel={t.audioCall}
          >
            <PhoneCall size={16} color={palette.teal700} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPost = ({ item }: { item: DoctorPost }) => {
    const authorDoc = doctors.find((d) => String(d.id) === String(item.doctorAccountId));
    return (
      <View style={styles.newsCard}>
        <View style={styles.newsHeader}>
          <View style={styles.newsAuthorAvatar}>
            <Stethoscope size={18} color={palette.teal700} />
          </View>
          <View style={styles.newsAuthorInfo}>
            <Text style={styles.newsAuthorName}>
              {item.doctorName ? (item.doctorName.startsWith('Dr') ? item.doctorName : `Dr. ${item.doctorName}`) : 'Doctor'}
            </Text>
            <Text style={styles.newsAuthorSpec}>
              {item.doctorSpecialization || (language === 'bn' ? 'চিকিৎসক' : 'Physician')}
            </Text>
          </View>
          <View style={styles.newsBadgeWrap}>
            <Text style={styles.newsBadgeText}>{(item.category || 'HEALTH_TIP').replace('_', ' ')}</Text>
          </View>
        </View>

        <Text style={styles.newsTitle}>{item.title}</Text>

        {item.imageUrl ? (
          <View style={styles.newsImageWrap}>
            <Image source={{ uri: item.imageUrl }} style={styles.newsImage} resizeMode="cover" />
          </View>
        ) : null}

        <Text style={styles.newsBody}>{item.body}</Text>

        <View style={styles.newsFooter}>
          <Text style={styles.newsDate}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : ''}
          </Text>

          {authorDoc ? (
            <TouchableOpacity
              style={styles.newsConsultBtn}
              onPress={() => openChat(authorDoc)}
            >
              <MessageCircle size={13} color={palette.teal700} />
              <Text style={styles.newsConsultText}>{language === 'bn' ? 'পরামর্শ নিন' : 'Consult'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={palette.slate700} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={styles.title}>{activeTab === 'DIRECTORY' ? t.findDoctors : (language === 'bn' ? 'ডাক্তারদের স্বাস্থ্য নিউজফিড' : 'Doctor Health Newsfeed')}</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'DIRECTORY'
              ? t.findDoctorsSubtitle
              : (language === 'bn' ? 'অভিজ্ঞ চিকিৎসকদের নিয়মিত পরামর্শ ও সচেতনতা' : 'Health advisories, tips & campaigns')}
          </Text>
        </View>
        {activeTab === 'DIRECTORY' && !isLoading && doctors.length > 0 ? (
          <View style={styles.onlineBadge}>
            <View style={styles.onlineBadgeDot} />
            <Text style={styles.onlineBadgeText}>
              {onlineCount} {t.doctorsOnline}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'DIRECTORY' && styles.tabItemActive]}
          onPress={() => setActiveTab('DIRECTORY')}
          activeOpacity={0.8}
        >
          <Stethoscope size={15} color={activeTab === 'DIRECTORY' ? palette.teal700 : palette.slate500} />
          <Text style={[styles.tabItemText, activeTab === 'DIRECTORY' && styles.tabItemTextActive]}>
            {language === 'bn' ? 'ডাক্তার তালিকা' : 'Doctors Directory'} ({doctors.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'NEWSFEED' && styles.tabItemActive]}
          onPress={() => setActiveTab('NEWSFEED')}
          activeOpacity={0.8}
        >
          <Megaphone size={15} color={activeTab === 'NEWSFEED' ? palette.teal700 : palette.slate500} />
          <Text style={[styles.tabItemText, activeTab === 'NEWSFEED' && styles.tabItemTextActive]}>
            {language === 'bn' ? 'স্বাস্থ্য নিউজফিড' : 'Health Updates'} ({posts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Directory Search */}
      {activeTab === 'DIRECTORY' && !isLoading && doctors.length > 0 ? (
        <View style={styles.searchWrap}>
          <Search size={16} color={palette.slate400} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchDoctors}
            placeholderTextColor={palette.slate400}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <X size={16} color={palette.slate400} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={palette.teal600} />
        </View>
      ) : activeTab === 'DIRECTORY' ? (
        doctors.length === 0 ? (
          <View style={styles.centerWrap}>
            <Stethoscope size={44} color={palette.slate300} />
            <Text style={styles.emptyText}>
              No doctors available yet. Check back soon.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedDoctors}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={renderDoctor}
            refreshing={false}
            onRefresh={loadData}
            ListEmptyComponent={
              <View style={styles.centerWrap}>
                <Search size={40} color={palette.slate300} />
                <Text style={styles.emptyText}>{t.noDoctorsFound}</Text>
                <Text style={styles.emptySubText}>{t.noDoctorsFoundSub}</Text>
              </View>
            }
          />
        )
      ) : (
        /* Newsfeed View */
        posts.length === 0 ? (
          <View style={styles.centerWrap}>
            <Megaphone size={44} color={palette.slate300} />
            <Text style={styles.emptyText}>
              {language === 'bn' ? 'কোনো ডাক্তার এখনও স্বাস্থ্য পোস্ট করেননি।' : 'No doctor health updates yet.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={renderPost}
            refreshing={false}
            onRefresh={loadData}
          />
        )
      )}

      {/* Realtime chat + call entry point for the selected doctor */}
      {activeDoctor ? (
        <PatientChatModal
          visible={showChat}
          onClose={() => setShowChat(false)}
          doctor={activeDoctor}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? spacing.base : spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerMain: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: '800',
    color: palette.slate900,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.success50,
    borderWidth: 1,
    borderColor: palette.success100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  onlineBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.success500,
  },
  onlineBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.success700,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
    gap: spacing.sm,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: palette.slate100,
  },
  tabItemActive: {
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
  },
  tabItemText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate600,
  },
  tabItemTextActive: {
    color: palette.teal800,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
  },
  centerWrap: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptySubText: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  list: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  doctorCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  doctorMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: palette.success500,
    borderWidth: 2,
    borderColor: palette.white,
  },
  doctorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusPillOnline: {
    backgroundColor: palette.success50,
    borderColor: palette.success100,
  },
  statusPillOffline: {
    backgroundColor: palette.slate100,
    borderColor: palette.slate200,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  doctorName: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    flexShrink: 1,
  },
  specialization: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.teal600,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    flex: 1,
  },
  chatBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.white,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  newsAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsAuthorInfo: {
    flex: 1,
  },
  newsAuthorName: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate900,
  },
  newsAuthorSpec: {
    fontSize: typography.sizes.xs - 1,
    color: palette.slate500,
  },
  newsBadgeWrap: {
    backgroundColor: palette.teal50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.teal200,
  },
  newsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.teal800,
    textTransform: 'uppercase',
  },
  newsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: spacing.xs,
  },
  newsImageWrap: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginVertical: spacing.sm,
    backgroundColor: palette.slate100,
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  newsBody: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
    lineHeight: 21,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  newsDate: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
  },
  newsConsultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.teal50,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.teal200,
  },
  newsConsultText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal800,
  },
});
