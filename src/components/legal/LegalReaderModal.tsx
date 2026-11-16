import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SpringPressable } from '@/components/CyberButton';
import { MONO, UI_FONT } from '@/theme';
import { selectionHaptic, tapHaptic } from '@/utils/haptics';
import { playSound } from '@/utils/sounds';

export type LegalDocKind = 'privacy' | 'terms';

interface LegalSection {
  heading: string;
  body: string;
}

const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    heading: '1. Data We Store',
    body: 'Codelingo stores your learning progress (active track, completed nodes, streaks, gems, hearts, and preferences) locally on your device using secure AsyncStorage so you can learn immediately in Guest Mode without creating an account.',
  },
  {
    heading: '2. Optional Cloud Sync & Authentication',
    body: 'If you choose to link an account via Email or Sign in with Apple, your authentication session and synced progress are stored in our managed Supabase database to back up your XP, streaks, and unlocked cosmetics across devices.',
  },
  {
    heading: '3. Interactive Compiler & Copilot',
    body: 'When you tap Run in the Interactive IDE, only the source snippet and standard input you enter are transmitted to our sandbox execution runner to compile and return program output. We do not attach personal identifiers to playground execution payloads.',
  },
  {
    heading: '4. Local Notifications',
    body: 'Daily coding streak reminders and 5/5 heart recharge alerts are scheduled strictly on-device via local OS notifications. Enabling reminders never shares device notification tokens with external marketing services.',
  },
  {
    heading: '5. Tracking & Deletion Rights',
    body: 'Codelingo contains zero third-party ad networks or behavioral ad trackers. You can permanently delete your account, cloud profile, and all local app data at any time from Settings -> Delete Account & Reset All Data.',
  },
];

const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    heading: '1. Acceptance of Terms',
    body: 'By downloading or using Codelingo, you agree to these Terms of Service. Codelingo provides interactive programming lessons, bug hunts, syntax drills, and a code execution sandbox for educational purposes.',
  },
  {
    heading: '2. Virtual Rewards & Currency',
    body: 'XP, Streaks, Hearts, Gems, Leaderboard Leagues, and Robo Skins are in-app educational game mechanics only. They carry no monetary value and cannot be exchanged, sold, or redeemed outside the application.',
  },
  {
    heading: '3. Acceptable Compiler Usage',
    body: 'The Live Compiler IDE is intended strictly for learning and testing code snippets. You agree not to submit denial-of-service loops, abusive network requests, or malicious workloads designed to disrupt execution sandboxes.',
  },
  {
    heading: '4. User Accounts & Termination',
    body: 'You are responsible for maintaining the security of your linked account credentials. You may disconnect or permanently delete your account and progress at any time via in-app Settings.',
  },
  {
    heading: '5. Disclaimer of Warranty',
    body: 'Codelingo and all curriculum materials are provided on an "as is" basis without warranties of any kind. Compiler availability depends on network connectivity and sandbox runtime capacity.',
  },
];

export interface LegalReaderModalProps {
  visible: boolean;
  initialDoc?: LegalDocKind;
  onClose: () => void;
}

export function LegalReaderModal({
  visible,
  initialDoc = 'privacy',
  onClose,
}: LegalReaderModalProps) {
  const insets = useSafeAreaInsets();
  const [docOverride, setDocOverride] = useState<LegalDocKind | null>(null);
  const doc = docOverride ?? initialDoc;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.stopAnimation();
    translateY.stopAnimation();
    opacity.setValue(0);
    translateY.setValue(24);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, translateY]);

  const handleClose = () => {
    tapHaptic();
    playSound('drawer_close');
    setDocOverride(null);
    onClose();
  };

  const sections = doc === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.overlay, { opacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(16, insets.bottom + 8),
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.badge}>
                <Ionicons
                  name={doc === 'privacy' ? 'shield-checkmark-outline' : 'document-text-outline'}
                  size={16}
                  color="#C4B5FD"
                />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>
                  {doc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </Text>
                <Text style={styles.updatedAt}>Last updated · v1.0 Public Launch</Text>
              </View>
            </View>

            <SpringPressable
              onPress={handleClose}
              hitSlop={8}
              haptic="light"
              sound="none"
              pressScale={0.94}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={16} color="#94A3B8" />
            </SpringPressable>
          </View>

          <View style={styles.segmentWrap}>
            <Pressable
              onPress={() => {
                selectionHaptic();
                setDocOverride('privacy');
              }}
              style={[styles.segmentBtn, doc === 'privacy' && styles.segmentBtnActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  doc === 'privacy' && styles.segmentTextActive,
                ]}
              >
                Privacy Policy
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                selectionHaptic();
                setDocOverride('terms');
              }}
              style={[styles.segmentBtn, doc === 'terms' && styles.segmentBtnActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  doc === 'terms' && styles.segmentTextActive,
                ]}
              >
                Terms of Service
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section) => (
              <View key={section.heading} style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
          </ScrollView>

          <SpringPressable
            onPress={handleClose}
            haptic="light"
            sound="none"
            pressScale={0.98}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>Close</Text>
          </SpringPressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(4, 4, 8, 0.82)',
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '82%',
    alignSelf: 'center',
    backgroundColor: '#12111A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#181824',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  updatedAt: {
    fontFamily: MONO,
    fontSize: 10.5,
    color: '#71717A',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#181824',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#0B0A12',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#1E1C2A',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.34)',
  },
  segmentText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
  },
  segmentTextActive: {
    color: '#FAFAFA',
  },
  scroll: {
    maxHeight: 410,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 6,
  },
  sectionCard: {
    backgroundColor: '#0B0A12',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 12,
    gap: 5,
  },
  sectionHeading: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  sectionBody: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    color: '#A1A1AA',
    lineHeight: 18,
  },
  doneBtn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
