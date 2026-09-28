import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { palette, typography, spacing, borderRadius, shadows } from '../../theme';
import { emergencyApi } from '../../services/api';
import { NearbyHospital, EmergencyNumbers } from '../../types';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  Siren,
  Navigation,
  RefreshCw,
} from 'lucide-react-native';
import * as Location from 'expo-location';

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ visible, onClose }) => {
  const { t, language } = useSettingsStore();
  const [nearbyHospitals, setNearbyHospitals] = useState<NearbyHospital[]>([]);
  const [fallbackHospitals, setFallbackHospitals] = useState<NearbyHospital[]>([]);
  const [numbers, setNumbers] = useState<EmergencyNumbers | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setNearbyHospitals([]);
    setFallbackHospitals([]);
    setNumbers(null);
    setLocationError('');
    setUsingFallback(false);

    // Load predefined emergency numbers immediately
    emergencyApi
      .getEmergencyNumbers()
      .then(setNumbers)
      .catch((err) => {
        console.log('Error loading emergency numbers:', err);
        // Offline safety net: primary number is universal
        setNumbers({ numbers: ['999'], primaryNumber: '999' });
      });

    // Load curated fallback list in parallel
    emergencyApi
      .getHospitals()
      .then((list) => setFallbackHospitals(list))
      .catch(() => setFallbackHospitals([]));

    findNearbyHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const findNearbyHospitals = async () => {
    setIsLoadingLocation(true);
    setIsSearching(true);
    setLocationError('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(
          'Location permission is needed to find hospitals near you. Showing the standard hospital directory instead.'
        );
        setUsingFallback(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      const hospitals = await emergencyApi.findNearbyHospitals(latitude, longitude, 5000);
      if (hospitals.length === 0) {
        setLocationError('No hospitals found within 5 km. Showing the standard directory.');
        setUsingFallback(true);
      } else {
        setNearbyHospitals(hospitals);
      }
    } catch (err: any) {
      console.log('Error finding nearby hospitals:', err);
      setLocationError('Could not search nearby hospitals. Showing the standard directory.');
      setUsingFallback(true);
    } finally {
      setIsLoadingLocation(false);
      setIsSearching(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleSms = (phone?: string) => {
    if (!phone) return;
    const separator = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:${phone}${separator}body=`);
  };

  const handleOpenMap = (hospital: NearbyHospital) => {
    if (hospital.latitude == null || hospital.longitude == null) return;
    const label = encodeURIComponent(hospital.name);
    const lat = hospital.latitude;
    const lng = hospital.longitude;
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${lat},${lng}&q=${label}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const dialEmergency = () => {
    if (numbers?.primaryNumber) {
      handleCall(numbers.primaryNumber);
    }
  };

  const renderHospital = ({ item }: { item: NearbyHospital }) => (
    <View style={styles.hospitalCard}>
      <View style={styles.hospitalMain}>
        <View style={styles.hospitalIcon}>
          <MapPin size={16} color={palette.danger600} />
        </View>
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.address ? (
            <Text style={styles.hospitalAddress} numberOfLines={2}>
              {item.address}
            </Text>
          ) : null}
          {item.distanceKm != null ? (
            <Text style={styles.hospitalDistance}>
              {item.distanceKm} km away
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.hospitalActions}>
        {item.latitude != null && item.longitude != null ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.mapBtn]}
            onPress={() => handleOpenMap(item)}
          >
            <Navigation size={16} color={palette.blue600} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.actionBtn, styles.smsBtn]}
          onPress={() => handleSms(item.emergencyPhone || item.phone)}
          disabled={!(item.emergencyPhone || item.phone)}
        >
          <MessageSquare
            size={16}
            color={item.emergencyPhone || item.phone ? palette.blue600 : palette.slate300}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.callBtn]}
          onPress={() => handleCall(item.emergencyPhone || item.phone)}
          disabled={!(item.emergencyPhone || item.phone)}
        >
          <Phone
            size={16}
            color={item.emergencyPhone || item.phone ? palette.white : palette.slate300}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const displayHospitals = usingFallback || nearbyHospitals.length === 0 ? fallbackHospitals : nearbyHospitals;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.sirenBadge}>
                <Siren size={20} color={palette.white} />
              </View>
              <View>
                <Text style={styles.title}>{t.emergencyAssistance}</Text>
                <Text style={styles.subtitle}>{t.emergencySubtitle}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={palette.slate500} />
            </TouchableOpacity>
          </View>

          {/* Primary emergency call */}
          {numbers ? (
            <TouchableOpacity style={styles.emergencyCallBtn} onPress={dialEmergency} activeOpacity={0.8}>
              <Phone size={20} color={palette.white} />
              <Text style={styles.emergencyCallText}>
                Call Emergency {numbers.primaryNumber}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Other emergency numbers */}
          {numbers && numbers.numbers.length > 1 ? (
            <View style={styles.numbersRow}>
              {numbers.numbers.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={styles.numberChip}
                  onPress={() => handleCall(n)}
                >
                  <Phone size={13} color={palette.danger700} />
                  <Text style={styles.numberChipText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {/* Nearby header */}
          <View style={styles.nearbyHeader}>
            <Text style={styles.nearbyTitle}>
              {language === 'bn' ? 'নিকটস্থ হাসপাতাল' : 'Nearby Hospitals'}
            </Text>
            {!isLoadingLocation && (
              <TouchableOpacity
                onPress={findNearbyHospitals}
                style={styles.retryBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <RefreshCw size={14} color={palette.teal700} />
                <Text style={styles.retryText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>

          {locationError ? (
            <Text style={styles.locationError}>{locationError}</Text>
          ) : null}

          {/* Hospital list */}
          {isSearching ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={palette.danger600} />
              <Text style={styles.loadingText}>Finding hospitals near you...</Text>
            </View>
          ) : (
            <FlatList
              data={displayHospitals}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.hospitalList}
              renderItem={renderHospital}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hospitals available.</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sirenBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.danger600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: '800',
    color: palette.slate900,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: palette.danger600,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  emergencyCallText: {
    fontSize: typography.sizes.base,
    fontWeight: '800',
    color: palette.white,
  },
  numbersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
  },
  numberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.danger50,
    borderWidth: 1,
    borderColor: palette.danger200,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  numberChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.danger700,
  },
  nearbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  nearbyTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.teal700,
  },
  locationError: {
    fontSize: typography.sizes.xs,
    color: palette.warning700,
    backgroundColor: palette.warning50,
    borderWidth: 1,
    borderColor: palette.warning200,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
  },
  hospitalList: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.slate50,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  hospitalMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.danger50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate900,
  },
  hospitalAddress: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
  },
  hospitalDistance: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.danger600,
    marginTop: 2,
  },
  hospitalActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBtn: {
    backgroundColor: palette.blue50,
    borderWidth: 1,
    borderColor: palette.blue100,
  },
  smsBtn: {
    backgroundColor: palette.blue50,
    borderWidth: 1,
    borderColor: palette.blue100,
  },
  callBtn: {
    backgroundColor: palette.danger600,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
