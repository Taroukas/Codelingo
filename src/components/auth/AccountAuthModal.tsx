import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  signInWithAppleIdToken,
  signInWithEmail,
  signUpWithEmail,
} from '@/services/supabase';
import { useUserStore } from '@/store/useUserStore';
import { SpringPressable } from '@/components/CyberButton';
import { CarbonSpinnerDots } from '@/components/ui/AmbientSurface';
import { MONO, UI_FONT } from '@/theme';
import { errorHaptic, selectionHaptic, successHaptic, tapHaptic } from '@/utils/haptics';
import { playSound } from '@/utils/sounds';

export interface AccountAuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  titleOverride?: string;
  subtitleOverride?: string;
  onAuthenticated?: (result: { provider: 'email' | 'apple'; merged: boolean }) => void;
}

export function AccountAuthModal({
  visible,
  onClose,
  initialMode = 'signup',
  titleOverride,
  subtitleOverride,
  onAuthenticated,
}: AccountAuthModalProps) {
  const insets = useSafeAreaInsets();
  const { username, xp, completedNodes, linkCloudAccount, cloudConfigured } = useUserStore();

  const [modeOverride, setModeOverride] = useState<'signin' | 'signup' | null>(null);
  const mode = modeOverride ?? initialMode;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'email' | 'apple' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.stopAnimation();
    scale.stopAnimation();
    opacity.setValue(0);
    scale.setValue(0.94);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, scale]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    let mounted = true;
    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (mounted) setAppleAvailable(available);
      })
      .catch(() => {
        if (mounted) setAppleAvailable(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const totalCompleted = Object.values(completedNodes).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );

  const handleDismiss = () => {
    if (busy) return;
    tapHaptic();
    playSound('drawer_close');
    setErrorMsg(null);
    setInfoMsg(null);
    setModeOverride(null);
    onClose();
  };

  const handleEmailSubmit = async () => {
    if (busy) return;
    setErrorMsg(null);
    setInfoMsg(null);
    tapHaptic();
    setBusy('email');

    const res =
      mode === 'signup'
        ? await signUpWithEmail(email, password, username !== 'Coder' ? username : undefined)
        : await signInWithEmail(email, password);

    if (!res.ok) {
      setBusy(null);
      errorHaptic();
      playSound('wrong');
      setErrorMsg(res.error ?? 'Authentication failed. Please try again.');
      return;
    }

    if (res.needsEmailVerification) {
      setBusy(null);
      successHaptic();
      playSound('select');
      setInfoMsg(
        'Confirmation email sent. Open the verification link in your inbox, then sign in here to link your progress.',
      );
      return;
    }

    if (res.session) {
      const mergedRes = await linkCloudAccount(res.session);
      setBusy(null);
      successHaptic();
      playSound('correct');
      onAuthenticated?.({ provider: 'email', merged: mergedRes.merged });
      onClose();
      return;
    }

    setBusy(null);
  };

  const handleApplePress = async () => {
    if (busy || Platform.OS !== 'ios') return;
    setErrorMsg(null);
    setInfoMsg(null);
    tapHaptic();
    setBusy('apple');

    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('Apple Sign-In did not return an identity token.');
      }

      const fullName = [
        credential.fullName?.givenName,
        credential.fullName?.familyName,
      ]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(' ');

      const res = await signInWithAppleIdToken(
        credential.identityToken,
        rawNonce,
        fullName || null,
      );

      if (!res.ok || !res.session) {
        setBusy(null);
        errorHaptic();
        playSound('wrong');
        setErrorMsg(res.error ?? 'Unable to link your Apple ID.');
        return;
      }

      const mergedRes = await linkCloudAccount(res.session);
      setBusy(null);
      successHaptic();
      playSound('correct');
      onAuthenticated?.({ provider: 'apple', merged: mergedRes.merged });
      onClose();
    } catch (err: unknown) {
      setBusy(null);
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      errorHaptic();
      playSound('wrong');
      setErrorMsg(
        err instanceof Error ? err.message : 'Apple Sign-In failed. Please try again.',
      );
    }
  };

  const hasLocalProgress = xp > 0 || totalCompleted > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Animated.View style={[styles.overlay, { opacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              marginBottom: Math.max(12, insets.bottom),
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerBadge}>
                <Ionicons name="cloud-upload-outline" size={17} color="#C4B5FD" />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>
                  {titleOverride ??
                    (mode === 'signup' ? 'Save Your Progress' : 'Welcome Back')}
                </Text>
                <Text style={styles.subtitle}>
                  {subtitleOverride ??
                    (hasLocalProgress
                      ? `Merge your ${xp} XP & ${totalCompleted} lessons into a cloud profile`
                      : 'Sync streaks, XP & unlocked skins across devices')}
                </Text>
              </View>
            </View>

            <SpringPressable
              onPress={handleDismiss}
              hitSlop={8}
              haptic="light"
              sound="none"
              pressScale={0.94}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={16} color="#94A3B8" />
            </SpringPressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollBody}
          >
            {/* Segmented switch: Create Account | Sign In */}
            <View style={styles.segmentWrap}>
              <Pressable
                onPress={() => {
                  selectionHaptic();
                  setModeOverride('signup');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    mode === 'signup' && styles.segmentLabelActive,
                  ]}
                >
                  Create Account
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  selectionHaptic();
                  setModeOverride('signin');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                style={[styles.segmentBtn, mode === 'signin' && styles.segmentBtnActive]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    mode === 'signin' && styles.segmentLabelActive,
                  ]}
                >
                  Sign In
                </Text>
              </Pressable>
            </View>

            {appleAvailable ? (
              <View style={styles.appleSection}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    mode === 'signup'
                      ? AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                      : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                  }
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={10}
                  style={styles.appleBtn}
                  onPress={handleApplePress}
                />
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR WITH EMAIL</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={(txt) => {
                  setEmail(txt);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="developer@domain.com"
                placeholderTextColor="#52525B"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={(txt) => {
                    setPassword(txt);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  placeholderTextColor="#52525B"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                  style={styles.passwordInput}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={15}
                    color="#71717A"
                  />
                </Pressable>
              </View>
            </View>

            {!cloudConfigured ? (
              <View style={styles.noticeBanner}>
                <Ionicons name="information-circle-outline" size={15} color="#A78BFA" />
                <Text style={styles.noticeText}>
                  Offline preview build: your progress is already saved locally on this device.
                </Text>
              </View>
            ) : null}

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={15} color="#F87171" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {infoMsg ? (
              <View style={styles.infoBanner}>
                <Ionicons name="checkmark-circle" size={15} color="#34D399" />
                <Text style={styles.infoText}>{infoMsg}</Text>
              </View>
            ) : null}

            <SpringPressable
              onPress={handleEmailSubmit}
              disabled={busy !== null}
              haptic="medium"
              sound="none"
              pressScale={0.97}
              style={[styles.primaryBtn, busy !== null && { opacity: 0.7 }]}
            >
              {busy === 'email' ? (
                <CarbonSpinnerDots color="#FFFFFF" size="sm" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'signup' ? 'Link & Save Account' : 'Sign In & Sync'}
                </Text>
              )}
            </SpringPressable>

            <Pressable onPress={handleDismiss} style={styles.guestSkipBtn}>
              <Text style={styles.guestSkipText}>Continue in Guest Mode</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(4, 4, 8, 0.82)',
  },
  card: {
    width: '100%',
    maxWidth: 408,
    maxHeight: '86%',
    backgroundColor: '#12111A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  subtitle: {
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
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
  scrollBody: {
    gap: 12,
    paddingBottom: 2,
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
    height: 34,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#1E1C2A',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.36)',
  },
  segmentLabel: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#71717A',
  },
  segmentLabelActive: {
    color: '#FAFAFA',
  },
  appleSection: {
    gap: 12,
  },
  appleBtn: {
    width: '100%',
    height: 44,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.7,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#A1A1AA',
    letterSpacing: 0.6,
  },
  input: {
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0B0A12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    fontFamily: UI_FONT,
    fontSize: 14,
    color: '#FAFAFA',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0B0A12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingLeft: 12,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 14,
    color: '#FAFAFA',
  },
  eyeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(124, 92, 252, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.25)',
  },
  noticeText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 11.5,
    color: '#C4B5FD',
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  errorText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#FCA5A5',
    lineHeight: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  infoText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#6EE7B7',
    lineHeight: 16,
  },
  primaryBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  primaryBtnText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  guestSkipBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  guestSkipText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
