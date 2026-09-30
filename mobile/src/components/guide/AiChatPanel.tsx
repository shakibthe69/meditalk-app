import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { useSettingsStore } from '../../store/useSettingsStore';
import { aiChatService, AiChatMessage } from '../../services/ai/aiChatService';
import { voiceService } from '../../services/voice';
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  Stethoscope,
} from 'lucide-react-native';

interface AiChatPanelProps {
  /** Opens a suggested condition in the disease detail modal. */
  onOpenDisease: (id: number) => void;
}

let messageSeq = 0;
const nextId = () => `ai-${Date.now()}-${messageSeq++}`;

/**
 * AI chat assistant for medical questions — bilingual (English/Bangla),
 * speaks replies when voice narration is on, and links related conditions
 * straight into the Health Chat directory.
 */
export const AiChatPanel: React.FC<AiChatPanelProps> = ({ onOpenDisease }) => {
  const { t, language, voiceEnabled } = useSettingsStore();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // Greeting on open.
  useEffect(() => {
    setMessages([{ id: nextId(), role: 'ai', text: t.aiGreeting, isGreeting: true }]);
    voiceService.speak(t.aiGreeting, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages, isThinking]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || isThinking) return;

    setDraft('');
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);
    setIsThinking(true);

    try {
      // Send the visible conversation (minus the greeting) so the AI keeps context
      // and can refer back to earlier messages — a real continuous conversation.
      const history = messages.filter((m) => !m.isGreeting);
      const reply = await aiChatService.reply(text, language, history);
      const replyMessage: AiChatMessage = {
        id: nextId(),
        role: 'ai',
        text: reply.text,
        related: reply.related,
        isEmergency: reply.isEmergency,
      };
      setMessages((prev) => [...prev, replyMessage]);

      if (voiceEnabled) {
        // Speak only the first paragraph so long answers stay listenable.
        const spoken = reply.text.split('\n\n')[0].slice(0, 420);
        voiceService.speak(spoken, reply.language);
      }
    } catch (e) {
      console.warn('AI chat failed:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'ai',
          text:
            language === 'bn'
              ? 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন অথবা ডাক্তারের পরামর্শ নিন।'
              : 'Sorry, I could not answer right now. Please try again or consult a doctor.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const suggestions = [
    t.aiSuggestFever,
    t.aiSuggestHeadache,
    t.aiSuggestStomach,
    t.aiSuggestBreathing,
    t.aiSuggestMedicine,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <View
              key={message.id}
              style={[
                styles.bubbleRow,
                isUser ? styles.bubbleRowUser : styles.bubbleRowAi,
                message.isEmergency && styles.bubbleRowEmergency,
              ]}
            >
              <View style={[styles.avatar, isUser ? styles.avatarUser : styles.avatarAi]}>
                {isUser ? (
                  <User size={14} color={palette.white} />
                ) : message.isEmergency ? (
                  <AlertTriangle size={14} color={palette.white} />
                ) : (
                  <Bot size={14} color={palette.teal700} />
                )}
              </View>

              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleAi,
                  message.isEmergency && styles.bubbleEmergency,
                ]}
              >
                {message.isEmergency ? (
                  <Text style={[styles.bubbleText, styles.emergencyTitle]}>
                    {t.aiEmergencyTitle}
                  </Text>
                ) : null}
                <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                  {message.text}
                </Text>

                {message.related && message.related.length > 0 ? (
                  <View style={styles.relatedBlock}>
                    <Text style={styles.relatedLabel}>{t.aiRelatedConditions}</Text>
                    <View style={styles.relatedChips}>
                      {message.related.map((disease) => (
                        <TouchableOpacity
                          key={disease.id}
                          style={styles.relatedChip}
                          activeOpacity={0.8}
                          onPress={() => onOpenDisease(disease.id)}
                        >
                          <Stethoscope size={12} color={palette.teal700} />
                          <Text style={styles.relatedChipText} numberOfLines={1}>
                            {language === 'bn'
                              ? disease.nameBn || disease.nameEn
                              : disease.nameEn || disease.nameBn}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}

        {isThinking ? (
          <View style={[styles.bubbleRow, styles.bubbleRowAi]}>
            <View style={[styles.avatar, styles.avatarAi]}>
              <Bot size={14} color={palette.teal700} />
            </View>
            <View style={[styles.bubble, styles.bubbleAi, styles.thinking]}>
              <ActivityIndicator size="small" color={palette.teal600} />
              <Text style={styles.thinkingText}>{t.aiThinking}</Text>
            </View>
          </View>
        ) : null}

        {messages.length <= 1 && !isThinking ? (
          <View style={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                activeOpacity={0.8}
                onPress={() => send(suggestion)}
              >
                <Sparkles size={12} color={palette.teal700} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.disclaimer}>{t.aiDisclaimer}</Text>
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t.aiInputPlaceholder}
          placeholderTextColor={palette.slate400}
          value={draft}
          onChangeText={setDraft}
          multiline
          onSubmitEditing={() => send(draft)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!draft.trim() || isThinking) && styles.sendBtnDisabled]}
          onPress={() => send(draft)}
          disabled={!draft.trim() || isThinking}
        >
          <Send size={18} color={palette.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messages: {
    padding: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  bubbleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAi: {
    justifyContent: 'flex-start',
  },
  bubbleRowEmergency: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAi: {
    backgroundColor: palette.teal100,
  },
  avatarUser: {
    backgroundColor: palette.teal600,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bubbleAi: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: palette.teal600,
    borderBottomRightRadius: 4,
  },
  bubbleEmergency: {
    backgroundColor: palette.danger50,
    borderColor: palette.danger200,
  },
  bubbleText: {
    fontSize: typography.sizes.sm,
    color: palette.slate800,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: palette.white,
  },
  emergencyTitle: {
    fontWeight: '800',
    color: palette.danger700,
    marginBottom: spacing.xs,
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thinkingText: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    fontStyle: 'italic',
  },
  relatedBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  relatedLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.slate500,
    marginBottom: spacing.xs,
  },
  relatedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  relatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    maxWidth: 170,
  },
  relatedChipText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: '700',
    color: palette.teal800,
    flexShrink: 1,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.teal200,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
  },
  suggestionText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.teal800,
  },
  disclaimer: {
    fontSize: typography.sizes.xs - 1,
    color: palette.slate400,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.slate200,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.teal600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: palette.slate300,
  },
});
