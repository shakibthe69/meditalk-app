import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { Button } from '../common/Button';
import { supportApi, HelpRequestType } from '../../services/api';
import { X, LifeBuoy } from 'lucide-react-native';

interface HelpRequestModalProps {
  visible: boolean;
  onClose: () => void;
}

const TYPES: { key: HelpRequestType; label: string; hint: string }[] = [
  { key: 'MEDICATION', label: 'Medication', hint: 'Dose, timing or adherence question' },
  { key: 'APP_SUPPORT', label: 'App support', hint: 'Problem using a feature' },
  { key: 'GENERAL', label: 'General', hint: 'Any other request' },
  { key: 'EMERGENCY', label: 'Urgent', hint: 'Needs prompt attention' },
];

/**
 * Lets a patient open a direct line to the Meditalk care team. The request is
 * stored server-side and surfaces in the Admin Panel, where an administrator can
 * call or message back. No automatic medical assessment is made here.
 */
export const HelpRequestModal: React.FC<HelpRequestModalProps> = ({ visible, onClose }) => {
  const [type, setType] = useState<HelpRequestType>('MEDICATION');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const reset = () => {
    setType('MEDICATION');
    setMessage('');
    setFeedback(null);
    setIsSending(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setFeedback({ ok: false, text: 'Please describe what you need help with.' });
      return;
    }
    setIsSending(true);
    setFeedback(null);
    try {
      await supportApi.createHelpRequest(type, message.trim());
      setFeedback({ ok: true, text: 'Sent. A member of the care team will contact you.' });
      setMessage('');
    } catch (err) {
      console.warn('Failed to send help request:', err);
      setFeedback({ ok: false, text: 'Could not send your request. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <LifeBuoy size={18} color={palette.teal700} />
              </View>
              <Text style={styles.title}>Contact Care Team</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <X size={22} color={palette.slate500} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            <Text style={styles.label}>What do you need help with?</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeChip, type === t.key && styles.typeChipActive]}
                  onPress={() => setType(t.key)}
                >
                  <Text style={[styles.typeText, type === t.key && styles.typeTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>{TYPES.find((t) => t.key === type)?.hint}</Text>

            <TextInput
              style={styles.input}
              placeholder="Describe your request..."
              placeholderTextColor={palette.slate400}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />

            {feedback ? (
              <Text style={[styles.feedback, { color: feedback.ok ? palette.success600 : palette.danger600 }]}>
                {feedback.text}
              </Text>
            ) : null}

            {isSending ? (
              <ActivityIndicator color={palette.teal600} />
            ) : (
              <Button title="Send Request" onPress={handleSubmit} fullWidth />
            )}

            <Text style={styles.disclaimer}>
              This is not for emergencies. For urgent medical help, contact your doctor or local
              emergency services.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.teal50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: typography.sizes.lg, fontWeight: '800', color: palette.slate900 },
  label: { fontSize: typography.sizes.xs, fontWeight: '700', color: palette.slate700 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.slate50,
  },
  typeChipActive: { backgroundColor: palette.teal600, borderColor: palette.teal600 },
  typeText: { fontSize: typography.sizes.xs, fontWeight: '600', color: palette.slate700 },
  typeTextActive: { color: palette.white },
  hint: { fontSize: typography.sizes.xs, color: palette.slate500, fontStyle: 'italic' },
  input: {
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  feedback: { fontSize: typography.sizes.sm, textAlign: 'center' },
  disclaimer: { fontSize: typography.sizes.xs, color: palette.slate400, textAlign: 'center', lineHeight: 16 },
});
