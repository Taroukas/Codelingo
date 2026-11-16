import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoboMascot, type RoboMood } from '@/components/ide/RoboMascot';
import {
  CarbonSpinnerDots,
  PulseStatusDot,
} from '@/components/ui/AmbientSurface';
import { RichCodeText } from '@/components/ui/RichCodeText';
import {
  loadStoredAiApiKey,
  saveStoredAiApiKey,
  type CopilotAction,
  type CopilotDiffProposal,
} from '@/services/roboCopilot';
import { MONO, UI_FONT } from '@/theme';

export interface RoboCopilotCardProps {
  botMood: RoboMood;
  isUserTyping?: boolean;
  botMessage: string;
  hasCompilerError: boolean;
  isBusy: boolean;
  pendingProposal: CopilotDiffProposal | null;
  promptInputRef?: React.RefObject<React.ComponentRef<typeof TextInput> | null>;
  onAction: (action: CopilotAction, customPrompt?: string) => void;
  onAcceptProposal: () => void;
  onDismissProposal: () => void;
  onWakeUp?: () => void;
}

export function RoboCopilotCard({
  botMood,
  isUserTyping = false,
  botMessage,
  hasCompilerError,
  isBusy,
  pendingProposal,
  promptInputRef,
  onAction,
  onAcceptProposal,
  onDismissProposal,
  onWakeUp,
}: RoboCopilotCardProps) {
  const [promptText, setPromptText] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadStoredAiApiKey().then((stored) => {
      if (!mounted) return;
      const envSet = Boolean(process.env.EXPO_PUBLIC_AI_API_KEY?.trim());
      setHasCustomKey(Boolean(stored) || envSet);
      if (stored) setApiKeyDraft(stored);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveKey = async () => {
    await saveStoredAiApiKey(apiKeyDraft);
    const envSet = Boolean(process.env.EXPO_PUBLIC_AI_API_KEY?.trim());
    setHasCustomKey(Boolean(apiKeyDraft.trim()) || envSet);
    setShowKeyModal(false);
  };

  const handleSubmitPrompt = () => {
    const trimmed = promptText.trim();
    if (!trimmed || isBusy) return;
    setPromptText('');
    onAction('custom', trimmed);
  };

  const statusTagText =
    botMood === 'thinking'
      ? 'SYNTHESIZING'
      : botMood === 'worried' || botMood === 'bug_alert'
      ? 'BUG DETECTED'
      : pendingProposal
      ? 'DIFF READY'
      : isUserTyping || botMood === 'watching_typing'
      ? 'WATCHING'
      : botMood === 'sleeping'
      ? 'SLEEPING'
      : 'READY';

  const statusTagColor =
    botMood === 'worried' || botMood === 'bug_alert'
      ? '#F87171'
      : pendingProposal || botMood === 'happy' || botMood === 'celebrating'
      ? '#34D399'
      : isUserTyping || botMood === 'watching_typing' || botMood === 'thinking'
      ? '#38BDF8'
      : '#A78BFA';

  return (
    <Pressable
      onPress={botMood === 'sleeping' ? onWakeUp : undefined}
      style={[
        styles.card,
        (botMood === 'worried' || botMood === 'bug_alert') &&
          styles.cardErrorBorder,
        pendingProposal && styles.cardProposalBorder,
      ]}
    >
      {/* Top Row: Expressive Duo-Style Robot Mascot + Message Bubble */}
      <View style={styles.headerRow}>
        <RoboMascot
          mood={botMood}
          isTyping={isUserTyping}
          size={52}
          onPress={botMood === 'sleeping' ? onWakeUp : undefined}
        />

        <View style={styles.messageCol}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Ionicons name="sparkles" size={12} color="#A78BFA" />
              <Text style={styles.assistantLabel}>COPILOT ASSISTANT</Text>
            </View>

            <View style={styles.headerRightControls}>
              <View style={styles.statusChip}>
                {botMood === 'thinking' ? (
                  <CarbonSpinnerDots color="#38BDF8" size="sm" />
                ) : (
                  <PulseStatusDot
                    color={statusTagColor}
                    size={5.5}
                    active={
                      Boolean(isUserTyping) ||
                      botMood === 'watching_typing' ||
                      botMood === 'bug_alert'
                    }
                  />
                )}
                <Text style={[styles.statusText, { color: statusTagColor }]}>
                  {statusTagText}
                </Text>
              </View>

              <Pressable
                onPress={() => setShowKeyModal(true)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.keyIconBtn,
                  hasCustomKey && styles.keyIconBtnActive,
                  pressed && styles.pressedFade,
                ]}
                accessibilityLabel="Configure AI API Key"
              >
                <Ionicons
                  name="key-outline"
                  size={12}
                  color={hasCustomKey ? '#34D399' : '#A1A1AA'}
                />
              </Pressable>
            </View>
          </View>

          <RichCodeText
            text={botMessage}
            style={styles.messageText}
            codeStyle={styles.inlineCodePill}
          />
        </View>
      </View>

      {/* Pending Diff Confirmation Controls OR 4 Quick Action Pills */}
      {pendingProposal ? (
        <View style={styles.proposalActionBar}>
          <Pressable
            onPress={onAcceptProposal}
            style={({ pressed }) => [
              styles.proposalAcceptBtn,
              pressed && styles.pressedFade,
            ]}
          >
            <Ionicons name="checkmark" size={14} color="#34D399" />
            <Text style={styles.proposalAcceptText}>Accept Code</Text>
          </Pressable>

          <Pressable
            onPress={onDismissProposal}
            style={({ pressed }) => [
              styles.proposalDismissBtn,
              pressed && styles.pressedFade,
            ]}
          >
            <Ionicons name="close" size={14} color="#F87171" />
            <Text style={styles.proposalDismissText}>Reject</Text>
          </Pressable>

          <Pressable
            onPress={() => onAction('complete')}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.proposalRefineBtn,
              pressed && styles.pressedFade,
            ]}
          >
            <Text style={styles.proposalRefineText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.pillsRow}
        >
          <Pressable
            onPress={() => onAction('complete')}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.actionPillPrimary,
              pressed && styles.pressedFade,
              isBusy && styles.disabledPill,
            ]}
          >
            <Ionicons name="sparkles" size={13} color="#FFFFFF" />
            <Text style={styles.actionPillPrimaryText}>Complete Code</Text>
          </Pressable>

          <Pressable
            onPress={() => onAction('fix')}
            disabled={isBusy}
            style={({ pressed }) => [
              hasCompilerError ? styles.actionPillDanger : styles.actionPill,
              pressed && styles.pressedFade,
              isBusy && styles.disabledPill,
            ]}
          >
            <Ionicons
              name="construct-outline"
              size={13}
              color={hasCompilerError ? '#FCA5A5' : '#A1A1AA'}
            />
            <Text
              style={[
                styles.actionPillText,
                hasCompilerError && styles.actionPillDangerText,
              ]}
            >
              Fix Error
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onAction('explain')}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.actionPill,
              pressed && styles.pressedFade,
              isBusy && styles.disabledPill,
            ]}
          >
            <Ionicons name="bulb-outline" size={13} color="#FBBF24" />
            <Text style={styles.actionPillText}>Explain</Text>
          </Pressable>

          <Pressable
            onPress={() => onAction('optimize')}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.actionPill,
              pressed && styles.pressedFade,
              isBusy && styles.disabledPill,
            ]}
          >
            <Ionicons name="flash-outline" size={13} color="#38BDF8" />
            <Text style={styles.actionPillText}>Optimize</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Natural Language Chat Prompt Input */}
      <View style={styles.promptBox}>
        <TextInput
          ref={promptInputRef}
          value={promptText}
          onChangeText={(txt) => {
            setPromptText(txt);
            if (botMood === 'sleeping' && onWakeUp) onWakeUp();
          }}
          placeholder="Ask Bot anything (e.g. 'bubble sort', 'fix error', 'explain line 3')..."
          placeholderTextColor="#71717A"
          style={styles.promptInput}
          returnKeyType="send"
          onSubmitEditing={handleSubmitPrompt}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isBusy}
        />
        <Pressable
          onPress={handleSubmitPrompt}
          disabled={isBusy || !promptText.trim()}
          style={({ pressed }) => [
            styles.sendBtn,
            (!promptText.trim() || isBusy) && styles.sendBtnDisabled,
            pressed && promptText.trim() ? styles.pressedFade : null,
          ]}
          accessibilityLabel="Send prompt to Copilot"
        >
          <Ionicons name="send" size={13} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Optional Custom AI API Key Modal */}
      <Modal
        visible={showKeyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.titleLeft}>
                <Ionicons name="key-outline" size={15} color="#A78BFA" />
                <Text style={styles.modalTitle}>Cloud AI Key (Optional)</Text>
              </View>
              <Pressable
                onPress={() => setShowKeyModal(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={16} color="#A1A1AA" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Robo works 100% offline out-of-the-box. Paste a free Groq
              (`gsk_...`), Gemini (`AIza...`), or OpenAI (`sk-...`) key to
              enable live cloud LLM streaming.
            </Text>

            <TextInput
              value={apiKeyDraft}
              onChangeText={setApiKeyDraft}
              placeholder="gsk_... or AIza... or sk_..."
              placeholderTextColor="#52525B"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={styles.modalKeyInput}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setApiKeyDraft('');
                }}
                style={styles.modalClearBtn}
              >
                <Text style={styles.modalClearText}>Clear</Text>
              </Pressable>
              <Pressable onPress={handleSaveKey} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>Save Key</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 14,
    gap: 11,
  },
  cardErrorBorder: {
    borderColor: 'rgba(239, 68, 68, 0.34)',
  },
  cardProposalBorder: {
    borderColor: 'rgba(124, 92, 252, 0.38)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  messageCol: {
    flex: 1,
    gap: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  assistantLabel: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#A78BFA',
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#171622',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  statusText: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  keyIconBtn: {
    width: 24,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#171622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyIconBtnActive: {
    borderColor: 'rgba(52, 211, 153, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  messageText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: '#E2E8F0',
  },
  inlineCodePill: {
    fontFamily: MONO,
    fontWeight: '700',
    fontSize: 11.5,
    color: '#DDD6FE',
    backgroundColor: 'rgba(124, 92, 252, 0.20)',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionPillPrimary: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 13,
    backgroundColor: '#7C5CFC',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPillPrimaryText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionPill: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: '#181724',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionPillDanger: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionPillText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  actionPillDangerText: {
    color: '#FCA5A5',
    fontWeight: '700',
  },
  disabledPill: {
    opacity: 0.55,
  },
  proposalActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  proposalAcceptBtn: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.52)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  proposalAcceptText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  proposalDismissBtn: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: '#181724',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.34)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  proposalDismissText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#F87171',
  },
  proposalRefineBtn: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: '#181724',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proposalRefineText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#D4D4D8',
  },
  promptBox: {
    height: 44,
    borderRadius: 999,
    backgroundColor: '#0D0D14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptInput: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 12.5,
    color: '#FAFAFA',
    paddingVertical: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#252336',
    opacity: 0.65,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.76)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#12111A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#1A1926',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#A1A1AA',
  },
  modalKeyInput: {
    height: 40,
    borderRadius: 9,
    backgroundColor: '#0A0A10',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingHorizontal: 12,
    fontFamily: MONO,
    fontSize: 12.5,
    color: '#FAFAFA',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalClearBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#181724',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClearText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  modalSaveBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressedFade: {
    opacity: 0.84,
  },
});
