import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { Button, Input } from '../common';
import { doctorPortalApi } from '../../services/api';
import { DoctorPortalAccount } from '../../types';
import { voiceService } from '../../services/voice';
import { useSettingsStore } from '../../store/useSettingsStore';
import { X, User, Stethoscope, BadgeCheck, Hospital, MapPin, Clock, Phone } from 'lucide-react-native';

interface EditDoctorProfileModalProps {
  visible: boolean;
  doctor: DoctorPortalAccount | null;
  onClose: () => void;
  onSaved: (updated: DoctorPortalAccount) => void;
}

/**
 * Doctor self-service profile editor: name, specialization, licence, chamber
 * details and visiting hours. Email and role are read-only.
 */
export const EditDoctorProfileModal: React.FC<EditDoctorProfileModalProps> = ({
  visible,
  doctor,
  onClose,
  onSaved,
}) => {
  const { language } = useSettingsStore();
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospitalOrClinic, setHospitalOrClinic] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [chamberAddress, setChamberAddress] = useState('');
  const [visitingHours, setVisitingHours] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible || !doctor) return;
    setFullName(doctor.fullName || '');
    setSpecialization(doctor.specialization || '');
    setLicenseNumber(doctor.licenseNumber || '');
    setHospitalOrClinic(doctor.hospitalOrClinic || '');
    setPhoneNumber(doctor.phoneNumber || '');
    setChamberAddress(doctor.chamberAddress || '');
    setVisitingHours(doctor.visitingHours || '');
  }, [visible, doctor]);

  const handleSave = async () => {
    if (!fullName.trim() || !specialization.trim()) {
      Alert.alert(
        language === 'bn' ? 'তথ্য প্রয়োজন' : 'Validation Error',
        language === 'bn' ? 'নাম ও বিশেষত্ব আবশ্যক।' : 'Name and specialization are required.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const updated = await doctorPortalApi.updateProfile({
        fullName: fullName.trim(),
        specialization: specialization.trim(),
        licenseNumber: licenseNumber.trim(),
        hospitalOrClinic: hospitalOrClinic.trim(),
        phoneNumber: phoneNumber.trim(),
        chamberAddress: chamberAddress.trim(),
        visitingHours: visitingHours.trim(),
      });
      voiceService.speak(
        language === 'bn' ? 'প্রোফাইল সংরক্ষণ করা হয়েছে' : 'Profile saved',
        language
      );
      onSaved(updated);
      onClose();
    } catch (e: any) {
      console.warn('Doctor profile update failed:', e);
      Alert.alert(
        language === 'bn' ? 'ব্যর্থ' : 'Error',
        e?.response?.data?.message ||
          (language === 'bn' ? 'প্রোফাইল হালনাগাদ করা যায়নি।' : 'Could not update the profile.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {language === 'bn' ? 'প্রোফাইল সম্পাদনা' : 'Edit Profile'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {language === 'bn'
                ? 'আপনার পেশাদার তথ্য হালনাগাদ করুন'
                : 'Update your professional details'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={palette.slate600} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Input
            label={language === 'bn' ? 'পুরো নাম' : 'Full Name'}
            placeholder="Dr. Jane Doe"
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<User size={18} color={palette.teal700} />}
          />

          <Input
            label={language === 'bn' ? 'বিশেষত্ব' : 'Specialization'}
            placeholder="Cardiology, Pediatrics…"
            value={specialization}
            onChangeText={setSpecialization}
            leftIcon={<Stethoscope size={18} color={palette.teal700} />}
          />

          <Input
            label={language === 'bn' ? 'লাইসেন্স নম্বর' : 'License Number'}
            placeholder="BD-MED-2019-0000"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            leftIcon={<BadgeCheck size={18} color={palette.teal700} />}
          />

          <Input
            label={language === 'bn' ? 'হাসপাতাল / ক্লিনিক' : 'Hospital / Clinic'}
            placeholder={language === 'bn' ? 'হাসপাতালের নাম' : 'Hospital name'}
            value={hospitalOrClinic}
            onChangeText={setHospitalOrClinic}
            leftIcon={<Hospital size={18} color={palette.teal700} />}
          />

          <Input
            label={language === 'bn' ? 'চেম্বার ঠিকানা' : 'Chamber Address'}
            placeholder={language === 'bn' ? 'বাসা, রোড, এলাকা' : 'House, road, area'}
            value={chamberAddress}
            onChangeText={setChamberAddress}
            leftIcon={<MapPin size={18} color={palette.teal700} />}
          />

          <Input
            label={language === 'bn' ? 'সাক্ষাৎকারের সময়' : 'Visiting Hours'}
            placeholder="Mon - Fri (04:00 PM - 08:00 PM)"
            value={visitingHours}
            onChangeText={setVisitingHours}
            leftIcon={<Clock size={18} color={palette.teal700} />}
          />

          <Input
            label={language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
            placeholder="+8801XXXXXXXXX"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            leftIcon={<Phone size={18} color={palette.teal700} />}
          />

          <Input
            label={language === 'bn' ? 'ইমেইল' : 'Email'}
            placeholder="—"
            value={doctor?.email || ''}
            editable={false}
            hint={language === 'bn' ? 'ইমেইল পরিবর্তন করা যায় না' : 'Email cannot be changed'}
          />

          <Button
            title={language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
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
});
