import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { Button, Input } from '../common';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { authApi } from '../../services/api';
import { appStorage } from '../../services/storage/appStorage';
import { voiceService } from '../../services/voice';
import {
  X,
  Camera,
  ImagePlus,
  User,
  Phone,
  Calendar,
  Droplet,
  Siren,
} from 'lucide-react-native';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

/**
 * Patient-editable identity: photo (camera or gallery, stored on device) plus
 * the personal details the backend accepts in PUT /api/users/profile.
 */
export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { user } = useAuthStore();
  const { language, t, avatarUri, setAvatarUri } = useSettingsStore();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible || !user) return;
    setFullName(user.fullName || user.name || '');
    setPhoneNumber(user.phoneNumber || '');
    setDateOfBirth(user.dateOfBirth || '');
    setBloodGroup(user.bloodGroup || 'O+');
    setEmergencyContact(user.emergencyContactPhone || '');
  }, [visible, user]);

  const pickImage = async (fromCamera: boolean) => {
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          language === 'bn' ? 'অনুমতি প্রয়োজন' : 'Permission needed',
          language === 'bn'
            ? 'প্রোফাইল ছবি যোগ করতে ক্যামেরা/গ্যালারির অনুমতি দিন।'
            : 'Allow camera/gallery access to add a profile photo.'
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] });

      if (result.canceled || !result.assets?.length) return;

      const saved = await appStorage.saveImageFile(result.assets[0].uri, 'profile-avatar.jpg');
      setAvatarUri(saved);
    } catch (e) {
      console.warn('Failed to pick profile image:', e);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert(
        language === 'bn' ? 'তথ্য প্রয়োজন' : 'Validation Error',
        language === 'bn' ? 'নাম আবশ্যক।' : 'Full name is required.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: dateOfBirth.trim(),
        bloodGroup,
        emergencyContactPhone: emergencyContact.trim(),
      });
      useAuthStore.setState({ user: updated });

      voiceService.speak(
        language === 'bn' ? 'প্রোফাইল সফলভাবে সংরক্ষণ করা হয়েছে।' : 'Profile saved successfully.',
        language
      );
      Alert.alert(
        language === 'bn' ? 'সফল' : 'Saved',
        t.profileSaved,
        [{ text: language === 'bn' ? 'ঠিক আছে' : 'OK', onPress: onClose }]
      );
    } catch (e: any) {
      console.warn('Profile update failed:', e);
      Alert.alert(
        language === 'bn' ? 'ব্যর্থ' : 'Error',
        e?.response?.data?.message || t.profileSaveFailed
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t.editProfile}</Text>
            <Text style={styles.headerSubtitle}>{t.editProfileSubtitle}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={palette.slate600} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Photo */}
          <View style={styles.photoSection}>
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <User size={44} color={palette.teal700} />
              )}
            </View>

            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.photoBtn}
                activeOpacity={0.8}
                onPress={() => pickImage(true)}
              >
                <Camera size={15} color={palette.teal700} />
                <Text style={styles.photoBtnText}>
                  {language === 'bn' ? 'ক্যামেরা' : 'Camera'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoBtn}
                activeOpacity={0.8}
                onPress={() => pickImage(false)}
              >
                <ImagePlus size={15} color={palette.teal700} />
                <Text style={styles.photoBtnText}>{t.changePhoto}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label={t.fullName}
            placeholder={language === 'bn' ? 'আপনার পুরো নাম' : 'Your full name'}
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<User size={18} color={palette.teal700} />}
          />

          <Input
            label={t.emailLabel}
            placeholder="name@example.com"
            value={user?.email || ''}
            editable={false}
            hint={
              language === 'bn'
                ? 'ইমেইল পরিবর্তন করা যায় না'
                : 'Email cannot be changed here'
            }
          />

          <Input
            label={t.phoneLabel}
            placeholder="01XXXXXXXXX"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            leftIcon={<Phone size={18} color={palette.teal700} />}
          />

          <Input
            label={t.dateOfBirthLabel}
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            leftIcon={<Calendar size={18} color={palette.teal700} />}
          />

          {/* Blood group */}
          <Text style={styles.fieldLabel}>{t.bloodGroupLabel}</Text>
          <View style={styles.chipsRow}>
            {BLOOD_GROUPS.map((group) => (
              <TouchableOpacity
                key={group}
                style={[styles.chip, bloodGroup === group && styles.chipActive]}
                onPress={() => setBloodGroup(group)}
                activeOpacity={0.75}
              >
                <Droplet
                  size={12}
                  color={bloodGroup === group ? palette.white : palette.danger500}
                />
                <Text style={[styles.chipText, bloodGroup === group && styles.chipTextActive]}>
                  {group}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label={t.emergencyContactLabel}
            placeholder="01XXXXXXXXX"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            keyboardType="phone-pad"
            leftIcon={<Siren size={18} color={palette.danger500} />}
          />

          <Button
            title={t.saveChanges}
            onPress={handleSave}
            loading={isSaving}
            size="lg"
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
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
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: palette.teal50,
    borderWidth: 2,
    borderColor: palette.teal200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  photoBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal700,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.slate700,
    marginBottom: spacing.xs + 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
  },
  chipActive: {
    backgroundColor: palette.danger500,
    borderColor: palette.danger500,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.slate700,
  },
  chipTextActive: {
    color: palette.white,
  },
});
