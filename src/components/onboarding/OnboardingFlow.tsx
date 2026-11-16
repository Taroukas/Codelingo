import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountAuthModal } from '@/components/auth/AccountAuthModal';
import { RoboMascot, type RoboMood } from '@/components/ide/RoboMascot';
import { LanguageLogo } from '@/components/LanguageLogo';
import { JigglePressable } from '@/components/ui/JigglePressable';
import { LANGUAGES } from '@/data/curriculum';
import { requestNotificationPermissions } from '@/services/notifications';
import {
  DailyGoalMinutes,
  ExperienceLevel,
  LangId,
  useUserStore,
} from '@/store/useUserStore';
import { MONO, UI_FONT } from '@/theme';
import {
  mediumHaptic,
  selectionHaptic,
  successHaptic,
  tapHaptic,
} from '@/utils/haptics';
import { SPRING_JIGGLE_BOUNCE } from '@/utils/springPhysics';
import { playSound } from '@/utils/sounds';

type OnboardingStep = 0 | 1 | 2 | 3;

interface LanguageChoice {
  id: LangId;
  name: string;
  subtitle: string;
  popular?: boolean;
}

interface ExperienceChoice {
  id: ExperienceLevel;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface DailyGoalChoice {
  minutes: DailyGoalMinutes;
  label: string;
  pillText: string;
  recommended?: boolean;
}

const LANGUAGE_SUBTITLES: Record<LangId, string> = {
  python: 'AI & Logic',
  cpp: 'Game Engines',
  js: 'Web Apps',
  go: 'Cloud Speed',
  java: 'Enterprise',
  rust: 'Safe Systems',
  sql: 'Databases',
  c: 'Low Level',
  ts: 'Typed Web',
  css: 'UI Styling',
  html: 'Web Markup',
  php: 'Server Web',
  asm: 'CPU & Bits',
  swift: 'iOS Apps',
  kotlin: 'Android',
  julia: 'Data Math',
  lua: 'Game Scripts',
  csharp: 'Unity & .NET',
};

const LANGUAGE_CHOICES: readonly LanguageChoice[] = LANGUAGES.map((lang) => ({
  id: lang.id,
  name: lang.name,
  subtitle: LANGUAGE_SUBTITLES[lang.id],
  popular: lang.id === 'python',
}));

const EXPERIENCE_CHOICES: readonly ExperienceChoice[] = [
  {
    id: 'beginner',
    title: "I'm brand new",
    subtitle: 'Start from scratch with easy visual blocks',
    icon: 'sparkles-outline',
  },
  {
    id: 'basics',
    title: 'I know the basics',
    subtitle: 'Jump into loops, functions & logic',
    icon: 'code-slash-outline',
  },
  {
    id: 'experienced',
    title: "I'm experienced",
    subtitle: 'Fast-track to algorithms & pointers',
    icon: 'terminal-outline',
  },
];

const DAILY_GOAL_CHOICES: readonly DailyGoalChoice[] = [
  { minutes: 5, label: 'Casual', pillText: '5 min / day' },
  {
    minutes: 15,
    label: 'Regular',
    pillText: '15 min / day • Recommended',
    recommended: true,
  },
  { minutes: 30, label: 'Serious', pillText: '30 min / day' },
];

const BG = '#12111A';
const VIOLET = '#7C5CFC';
const VIOLET_LIP = '#5B3FD9';

interface PlushPillButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

function PlushPillButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: PlushPillButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <JigglePressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      haptic={isPrimary ? 'medium' : 'light'}
      pressScaleX={1.04}
      pressScaleY={0.92}
      pressTranslateY={isPrimary ? 3 : 2}
      style={[
        isPrimary ? styles.primaryPillBtn : styles.secondaryPillBtn,
        (disabled || loading) && styles.buttonDisabledWrap,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text
          style={
            isPrimary ? styles.primaryPillBtnText : styles.secondaryPillBtnText
          }
        >
          {label}
        </Text>
      )}
    </JigglePressable>
  );
}

interface PlushSquircleCardProps {
  selected: boolean;
  onPress: () => void;
  borderRadius?: number;
  style?: object;
  children: React.ReactNode;
}

function PlushSquircleCard({
  selected,
  onPress,
  borderRadius = 28,
  style,
  children,
}: PlushSquircleCardProps) {
  const handlePress = useCallback(() => {
    selectionHaptic();
    playSound('select');
    onPress();
  }, [onPress]);

  return (
    <JigglePressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      haptic="none"
      pressScaleX={1.035}
      pressScaleY={0.93}
      pressTranslateY={3}
      style={[
        styles.squircleBase,
        { borderRadius },
        selected ? styles.squircleSelected : styles.squircleUnselected,
        style,
      ]}
    >
      {children}
    </JigglePressable>
  );
}

interface OnboardingTopBarProps {
  step: 1 | 2 | 3;
  onBack: () => void;
}

function OnboardingTopBar({ step, onBack }: OnboardingTopBarProps) {
  const [trackWidth, setTrackWidth] = useState(260);
  const progressAnim = useRef(new Animated.Value(step / 3)).current;
  const trackPulseY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: step / 3,
      tension: 190,
      friction: 22,
      useNativeDriver: true,
    }).start();

    trackPulseY.stopAnimation();
    trackPulseY.setValue(1);
    Animated.sequence([
      Animated.timing(trackPulseY, {
        toValue: 1.24,
        duration: 85,
        useNativeDriver: true,
      }),
      Animated.spring(trackPulseY, {
        toValue: 1,
        ...SPRING_JIGGLE_BOUNCE,
      }),
    ]).start();
  }, [step, progressAnim, trackPulseY]);

  const translateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-trackWidth, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.topBar}>
      <JigglePressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        haptic="light"
        pressScaleX={1.08}
        pressScaleY={0.88}
        pressTranslateY={2}
        style={styles.backCircleBtn}
      >
        <Ionicons name="chevron-back" size={20} color="#E2E8F0" />
      </JigglePressable>

      <Animated.View
        style={[
          styles.progressTrack,
          { transform: [{ scaleY: trackPulseY }] },
        ]}
        onLayout={(e) => {
          const measured = e.nativeEvent.layout.width;
          if (measured > 0 && Math.abs(measured - trackWidth) > 1) {
            setTrackWidth(measured);
          }
        }}
      >
        <Animated.View
          style={[
            styles.progressFill,
            { transform: [{ translateX }] },
          ]}
        >
          <View style={styles.progressShineStrip} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

interface MascotPromptHeaderProps {
  prompt: string;
  mood?: RoboMood;
}

function MascotPromptHeader({
  prompt,
  mood = 'idle',
}: MascotPromptHeaderProps) {
  return (
    <View style={styles.mascotHeaderRow}>
      <View style={styles.mascotAvatarWrap}>
        <RoboMascot mood={mood} size={56} />
      </View>

      <View style={styles.speechBubble}>
        <View style={styles.speechNotch} />
        <Text style={styles.speechBubbleText}>{prompt}</Text>
      </View>
    </View>
  );
}

export function OnboardingFlow() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { completeOnboarding } = useUserStore();

  const [step, setStep] = useState<OnboardingStep>(0);
  const [selectedLang, setSelectedLang] = useState<LangId>('python');
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>('beginner');
  const [dailyGoal, setDailyGoal] = useState<DailyGoalMinutes>(15);
  const [handleInput, setHandleInput] = useState('');
  const [handleFocused, setHandleFocused] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Subtle ambient animation for Welcome Screen halo & mascot hover
  const floatAnim = useRef(new Animated.Value(0)).current;
  const haloAnim = useRef(new Animated.Value(0)).current;
  const stepEnterAnim = useRef(new Animated.Value(1)).current;
  const stepScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 0) {
        tapHaptic();
        playSound('drawer_open');
        setStep((prev) => (prev > 0 ? ((prev - 1) as OnboardingStep) : 0));
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();
    haloLoop.start();
    return () => {
      floatLoop.stop();
      haloLoop.stop();
    };
  }, [floatAnim, haloAnim]);

  useEffect(() => {
    stepEnterAnim.stopAnimation();
    stepEnterAnim.setValue(0);
    Animated.spring(stepEnterAnim, {
      toValue: 1,
      tension: 210,
      friction: 22,
      useNativeDriver: true,
    }).start();
  }, [step, stepEnterAnim]);

  const goToStep = useCallback((next: OnboardingStep) => {
    tapHaptic();
    playSound('drawer_open');
    setStep(next);
  }, []);

  const cleanSlug = handleInput
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  const handleFinish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    mediumHaptic();

    let grantedReminder = false;
    if (remindersEnabled) {
      grantedReminder = await requestNotificationPermissions();
    }

    successHaptic();
    playSound('correct');

    completeOnboarding({
      activeLang: selectedLang,
      dailyGoalMinutes: dailyGoal,
      experienceLevel,
      username: handleInput.trim().replace(/^@+/, '') || 'Coder',
      dailyReminderEnabled: remindersEnabled ? grantedReminder : false,
      launchFirstLesson: true,
    });
    setSubmitting(false);
  }, [
    submitting,
    remindersEnabled,
    completeOnboarding,
    selectedLang,
    dailyGoal,
    experienceLevel,
    handleInput,
  ]);

  const mascotHoverY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });
  const pillFloatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });
  const haloScale = haloAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.045],
  });
  const stepSlideX = stepEnterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const showWelcomePreviewDock = screenHeight >= 760;

  return (
    <View style={styles.root}>
      {/* Screen 0 — Welcome Hero */}
      {step === 0 ? (
        <ScrollView
          style={styles.flexOne}
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.welcomeContainer,
            {
              paddingTop: Math.max(insets.top + 18, 36),
              paddingBottom: Math.max(insets.bottom + 18, 28),
            },
          ]}
        >
          <View style={styles.welcomeHeroSection}>
            <View style={styles.haloStage}>
              <Animated.View
                style={[
                  styles.outerHalo,
                  { transform: [{ scale: haloScale }] },
                ]}
              >
                <View style={styles.innerHalo}>
                  <Animated.View
                    style={{ transform: [{ translateY: mascotHoverY }] }}
                  >
                    <RoboMascot mood="happy" size={92} />
                  </Animated.View>
                </View>
              </Animated.View>

              {/* Floating Pill Speech Bubble */}
              <Animated.View
                style={[
                  styles.welcomeBubble,
                  { transform: [{ translateY: mascotHoverY }] },
                ]}
              >
                <Text style={styles.welcomeBubbleText}>Hi! Ready to code? 👋</Text>
                <View style={styles.welcomeBubbleDot} />
              </Animated.View>

              {/* 3 Floating Language Pills */}
              <Animated.View
                style={[
                  styles.floatingLangPill,
                  styles.floatingLangLeft,
                  { transform: [{ translateY: pillFloatY }] },
                ]}
              >
                <LanguageLogo language="python" size={16} />
                <Text style={styles.floatingLangText}>Python</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.floatingLangPill,
                  styles.floatingLangTopRight,
                  { transform: [{ translateY: mascotHoverY }] },
                ]}
              >
                <LanguageLogo language="cpp" size={16} />
                <Text style={styles.floatingLangText}>C++</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.floatingLangPill,
                  styles.floatingLangBottomRight,
                  { transform: [{ translateY: pillFloatY }] },
                ]}
              >
                <LanguageLogo language="rust" size={16} />
                <Text style={styles.floatingLangText}>Rust</Text>
              </Animated.View>
            </View>

            <Text style={styles.heroTitle}>
              {'Learn to code,\none bite at a time.'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Interactive programming and coding challenges.
            </Text>

            {showWelcomePreviewDock && (
              <View style={styles.welcomePreviewDock}>
                <View style={styles.welcomeFeatureChips}>
                  <View style={styles.welcomeMiniPill}>
                    <Ionicons
                      name="code-slash-outline"
                      size={13}
                      color="#A78BFA"
                    />
                    <Text style={styles.welcomeMiniPillText}>
                      Interactive IDE
                    </Text>
                  </View>
                  <View style={styles.welcomeMiniPill}>
                    <Ionicons name="flash-outline" size={13} color="#3FB950" />
                    <Text style={styles.welcomeMiniPillText}>Bug Blitz</Text>
                  </View>
                </View>

                <View style={styles.welcomeCodePill}>
                  <View style={styles.macDotsRow}>
                    <View style={[styles.macDot, styles.macDotRed]} />
                    <View style={[styles.macDot, styles.macDotYellow]} />
                    <View style={[styles.macDot, styles.macDotGreen]} />
                  </View>
                  <Text style={styles.welcomeCodeText}>
                    <Text style={styles.codeFn}>print</Text>
                    <Text style={styles.codePunct}>{'('}</Text>
                    <Text style={styles.codeStr}>{"'Hello!'"}</Text>
                    <Text style={styles.codePunct}>{')'}</Text>
                  </Text>
                  <View style={styles.welcomeStarBadge}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.welcomeActionStack}>
            <PlushPillButton
              label="Get Started"
              onPress={() => goToStep(1)}
            />
            <PlushPillButton
              variant="secondary"
              label="I Already Have an Account"
              onPress={() => {
                tapHaptic();
                setAuthModalVisible(true);
              }}
            />
          </View>
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={styles.flexOne}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={[
              styles.stepShell,
              {
                paddingTop: Math.max(insets.top + 10, 20),
                paddingBottom: Math.max(insets.bottom + 14, 22),
              },
            ]}
          >
            <OnboardingTopBar
              step={step}
              onBack={() => goToStep((step - 1) as OnboardingStep)}
            />

            <Animated.View
              style={[
                styles.flexOne,
                {
                  opacity: stepEnterAnim,
                  transform: [{ translateX: stepSlideX }],
                },
              ]}
            >
              <ScrollView
                ref={stepScrollRef}
                style={styles.flexOne}
                showsVerticalScrollIndicator={step === 1}
                indicatorStyle="white"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.stepScrollContent}
              >
                {/* Step 1 — Language Selection */}
                {step === 1 && (
                  <>
                    <MascotPromptHeader
                      mood="idle"
                      prompt="Which language do you want to learn first?"
                    />

                    <View style={styles.langGrid}>
                      {LANGUAGE_CHOICES.map((lang) => {
                        const selected = selectedLang === lang.id;
                        return (
                          <PlushSquircleCard
                            key={lang.id}
                            selected={selected}
                            borderRadius={28}
                            style={styles.langCardWrapper}
                            onPress={() => setSelectedLang(lang.id)}
                          >
                            <View style={styles.langCardInner}>
                              <View style={styles.langCardTopRow}>
                                <View
                                  style={[
                                    styles.circleBadge,
                                    selected && styles.circleBadgeSelected,
                                  ]}
                                >
                                  <LanguageLogo language={lang.id} size={26} />
                                </View>

                                {lang.popular ? (
                                  <View
                                    style={[
                                      styles.popularPill,
                                      selected && styles.popularPillSelected,
                                    ]}
                                  >
                                    <Text style={styles.popularPillText}>
                                      Popular
                                    </Text>
                                  </View>
                                ) : selected ? (
                                  <View style={styles.checkCircleActive}>
                                    <Ionicons
                                      name="checkmark"
                                      size={14}
                                      color="#FFFFFF"
                                    />
                                  </View>
                                ) : null}
                              </View>

                              <View style={styles.langCardTextBlock}>
                                <Text
                                  style={styles.langTitle}
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.85}
                                >
                                  {lang.name}
                                </Text>
                                <Text
                                  style={styles.langSubtitle}
                                  numberOfLines={1}
                                >
                                  {lang.subtitle}
                                </Text>
                              </View>
                            </View>
                          </PlushSquircleCard>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Step 2 — Experience Level */}
                {step === 2 && (
                  <>
                    <MascotPromptHeader
                      mood="idle"
                      prompt="How much coding do you already know?"
                    />

                    <View style={styles.experienceList}>
                      {EXPERIENCE_CHOICES.map((option) => {
                        const selected = experienceLevel === option.id;
                        return (
                          <PlushSquircleCard
                            key={option.id}
                            selected={selected}
                            borderRadius={26}
                            style={styles.experienceCardSpacer}
                            onPress={() => setExperienceLevel(option.id)}
                          >
                            <View style={styles.experienceCardRow}>
                              <View
                                style={[
                                  styles.circleBadge,
                                  selected && styles.circleBadgeSelected,
                                ]}
                              >
                                <Ionicons
                                  name={option.icon}
                                  size={22}
                                  color={selected ? '#DDD6FE' : '#94A3B8'}
                                />
                              </View>

                              <View style={styles.experienceTextCol}>
                                <Text style={styles.experienceTitle}>
                                  {option.title}
                                </Text>
                                <Text style={styles.experienceSub}>
                                  {option.subtitle}
                                </Text>
                              </View>

                              <View
                                style={
                                  selected
                                    ? styles.radioCheckActive
                                    : styles.radioCheckIdle
                                }
                              >
                                {selected && (
                                  <Ionicons
                                    name="checkmark"
                                    size={14}
                                    color="#FFFFFF"
                                  />
                                )}
                              </View>
                            </View>
                          </PlushSquircleCard>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Step 3 — Daily Goal & Capsule Username Input */}
                {step === 3 && (
                  <>
                    <MascotPromptHeader
                      mood={handleFocused ? 'watching_typing' : 'happy'}
                      prompt="Pick a daily pace and your coder name!"
                    />

                    <View style={styles.goalList}>
                      {DAILY_GOAL_CHOICES.map((item) => {
                        const selected = dailyGoal === item.minutes;
                        return (
                          <PlushSquircleCard
                            key={item.minutes}
                            selected={selected}
                            borderRadius={24}
                            style={styles.goalCardSpacer}
                            onPress={() => setDailyGoal(item.minutes)}
                          >
                            <View style={styles.goalCardRow}>
                              <View style={styles.goalLeftCluster}>
                                <Text style={styles.goalLabel}>
                                  {item.label}
                                </Text>
                                <View
                                  style={[
                                    styles.goalSubPill,
                                    item.recommended &&
                                      styles.goalSubPillRecommended,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.goalSubPillText,
                                      item.recommended &&
                                        styles.goalSubPillTextRecommended,
                                    ]}
                                  >
                                    {item.pillText}
                                  </Text>
                                </View>
                              </View>

                              <View
                                style={
                                  selected
                                    ? styles.radioCheckActive
                                    : styles.radioCheckIdle
                                }
                              >
                                {selected && (
                                  <Ionicons
                                    name="checkmark"
                                    size={14}
                                    color="#FFFFFF"
                                  />
                                )}
                              </View>
                            </View>
                          </PlushSquircleCard>
                        );
                      })}
                    </View>

                    <Text style={styles.handleEyebrow}>YOUR CODER HANDLE</Text>

                    <View
                      style={[
                        styles.handleCapsuleInput,
                        handleFocused && styles.handleCapsuleInputFocused,
                      ]}
                    >
                      <View style={styles.handleAtCircle}>
                        <Text style={styles.handleAtGlyph}>@</Text>
                      </View>

                      <TextInput
                        value={handleInput}
                        onChangeText={(text) =>
                          setHandleInput(text.replace(/^@+/, ''))
                        }
                        onFocus={() => {
                          setHandleFocused(true);
                          setTimeout(() => {
                            stepScrollRef.current?.scrollToEnd({
                              animated: true,
                            });
                          }, 120);
                        }}
                        onBlur={() => setHandleFocused(false)}
                        placeholder="tarek_dev"
                        placeholderTextColor="#64748B"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={24}
                        returnKeyType="done"
                        style={styles.handleTextInput}
                      />

                      {cleanSlug.length >= 2 ? (
                        <View style={styles.handleReadyPill}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#3FB950"
                          />
                          <Text style={styles.handleReadyText}>READY</Text>
                        </View>
                      ) : (
                        <Text style={styles.handleOptionalHint}>Optional</Text>
                      )}
                    </View>

                    <JigglePressable
                      onPress={() => {
                        setRemindersEnabled((prev) => !prev);
                      }}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: remindersEnabled }}
                      haptic="selection"
                      pressScaleX={1.03}
                      pressScaleY={0.94}
                      pressTranslateY={2}
                      style={styles.reminderPillRow}
                    >
                      <View style={styles.reminderLeft}>
                        <View style={styles.reminderIconCircle}>
                          <Ionicons
                            name="notifications-outline"
                            size={16}
                            color={remindersEnabled ? '#C4B5FD' : '#94A3B8'}
                          />
                        </View>
                        <Text style={styles.reminderText}>
                          Daily streak reminders
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.reminderSwitchPill,
                          remindersEnabled && styles.reminderSwitchPillOn,
                        ]}
                      >
                        <Text
                          style={[
                            styles.reminderSwitchText,
                            remindersEnabled && styles.reminderSwitchTextOn,
                          ]}
                        >
                          {remindersEnabled ? 'ON' : 'OFF'}
                        </Text>
                      </View>
                    </JigglePressable>
                  </>
                )}
              </ScrollView>
            </Animated.View>

            {/* Bottom Sticky 3D Pill Action Bar */}
            <View style={styles.stepFooter}>
              {step === 1 && (
                <PlushPillButton
                  label="Continue"
                  onPress={() => goToStep(2)}
                />
              )}
              {step === 2 && (
                <PlushPillButton
                  label="Continue"
                  onPress={() => goToStep(3)}
                />
              )}
              {step === 3 && (
                <PlushPillButton
                  label={submitting ? 'Setting Up...' : 'Start Learning!'}
                  disabled={submitting}
                  loading={submitting}
                  onPress={() => void handleFinish()}
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <AccountAuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        initialMode="signin"
        titleOverride="Welcome Back"
        subtitleOverride="Sign in with Apple or email to restore your XP, streaks, and progress."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  flexOne: {
    flex: 1,
  },

  // Welcome Hero (Screen 0)
  welcomeContainer: {
    flexGrow: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    gap: 20,
  },
  welcomeHeroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloStage: {
    width: 308,
    height: 226,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  outerHalo: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(124, 92, 252, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerHalo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(124, 92, 252, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeBubble: {
    position: 'absolute',
    top: 4,
    right: 6,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: '#1E1C2E',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  welcomeBubbleDot: {
    position: 'absolute',
    bottom: -6,
    left: 24,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E1C2E',
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    transform: [{ rotate: '45deg' }],
  },
  welcomeBubbleText: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingLangPill: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#181726',
    borderWidth: 1.5,
    borderColor: '#2A283E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatingLangLeft: {
    left: 2,
    top: 106,
  },
  floatingLangTopRight: {
    right: 4,
    top: 66,
  },
  floatingLangBottomRight: {
    right: 14,
    bottom: 8,
  },
  floatingLangText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  heroTitle: {
    fontFamily: UI_FONT,
    fontSize: 29,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 35,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  welcomePreviewDock: {
    marginTop: 22,
    width: '100%',
    borderRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: '#171622',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#262438',
    borderBottomColor: '#0E0D16',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  welcomeFeatureChips: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  welcomeMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222032',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  welcomeMiniPillText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  welcomeCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#100F18',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#252336',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  macDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  macDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  macDotRed: {
    backgroundColor: '#F87171',
  },
  macDotYellow: {
    backgroundColor: '#FBBF24',
  },
  macDotGreen: {
    backgroundColor: '#34D399',
  },
  welcomeCodeText: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 13.5,
    fontWeight: '600',
  },
  codeFn: {
    color: '#60A5FA',
  },
  codePunct: {
    color: '#94A3B8',
  },
  codeStr: {
    color: '#34D399',
  },
  welcomeStarBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeActionStack: {
    gap: 12,
  },

  // Primary & Secondary Full Pill Buttons
  buttonDisabledWrap: {
    opacity: 0.65,
  },
  primaryPillBtn: {
    height: 58,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: VIOLET,
    borderBottomWidth: 5,
    borderBottomColor: VIOLET_LIP,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryPillBtnText: {
    fontFamily: UI_FONT,
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  secondaryPillBtn: {
    height: 54,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: '#181724',
    borderWidth: 2,
    borderColor: '#28263B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  secondaryPillBtnText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
  },

  // Step Shell (Steps 1-3)
  stepShell: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#181724',
    borderWidth: 1.5,
    borderColor: '#28263D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#1D1B2B',
    marginLeft: 14,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: VIOLET,
  },
  progressShineStrip: {
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    marginTop: 3,
    marginHorizontal: 8,
  },

  stepScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
  },
  stepFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // Mascot Speech Header
  mascotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  mascotAvatarWrap: {
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechBubble: {
    flex: 1,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: '#1A1829',
    borderWidth: 2,
    borderColor: '#2B2840',
    padding: 14,
  },
  speechNotch: {
    position: 'absolute',
    left: -7,
    top: '50%',
    marginTop: -6,
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#1A1829',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#2B2840',
    transform: [{ rotate: '45deg' }],
  },
  speechBubbleText: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },

  // Plush 3D Squircle Card Base
  squircleBase: {
    borderCurve: 'continuous',
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  squircleUnselected: {
    backgroundColor: '#171622',
    borderColor: '#262438',
    borderBottomColor: '#0E0D16',
  },
  squircleSelected: {
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderColor: VIOLET,
    borderBottomColor: VIOLET_LIP,
  },

  // Shared Circular Icon Badge
  circleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#222032',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBadgeSelected: {
    backgroundColor: 'rgba(124, 92, 252, 0.28)',
  },

  // Step 1 — 2x3 Language Grid
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  langCardWrapper: {
    width: '48.2%',
  },
  langCardInner: {
    padding: 14,
    minHeight: 122,
    justifyContent: 'space-between',
  },
  langCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  popularPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  popularPillSelected: {
    backgroundColor: VIOLET,
    borderColor: '#A78BFA',
  },
  popularPillText: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  checkCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCardTextBlock: {
    marginTop: 12,
  },
  langTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  langSubtitle: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },

  // Step 2 — Experience Level
  experienceList: {
    marginTop: 2,
  },
  experienceCardSpacer: {
    marginBottom: 12,
  },
  experienceCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  experienceTextCol: {
    flex: 1,
  },
  experienceTitle: {
    fontFamily: UI_FONT,
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  experienceSub: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 19,
    marginTop: 3,
  },

  // Circular Radio Indicators
  radioCheckIdle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#36334D',
  },
  radioCheckActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Step 3 — Daily Goal & Handle Capsule
  goalList: {
    marginTop: 2,
  },
  goalCardSpacer: {
    marginBottom: 12,
  },
  goalCardRow: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  goalLeftCluster: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalLabel: {
    fontFamily: UI_FONT,
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  goalSubPill: {
    borderRadius: 999,
    backgroundColor: '#222032',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goalSubPillRecommended: {
    backgroundColor: 'rgba(124, 92, 252, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.45)',
  },
  goalSubPillText: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  goalSubPillTextRecommended: {
    color: '#EDE9FE',
  },
  handleEyebrow: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.7,
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 8,
  },
  handleCapsuleInput: {
    borderRadius: 999,
    borderCurve: 'continuous',
    height: 58,
    backgroundColor: '#171622',
    borderWidth: 2,
    borderColor: VIOLET,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  handleCapsuleInputFocused: {
    borderColor: '#9F85FF',
    backgroundColor: '#1C1A29',
  },
  handleAtCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleAtGlyph: {
    fontFamily: UI_FONT,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  handleTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: MONO,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 6,
  },
  handleReadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(63, 185, 80, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 4,
  },
  handleReadyText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#3FB950',
  },
  handleOptionalHint: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  reminderPillRow: {
    marginTop: 12,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: '#171622',
    borderWidth: 1.5,
    borderColor: '#262438',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#222032',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderText: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  reminderSwitchPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#222032',
    borderWidth: 1,
    borderColor: '#36334D',
  },
  reminderSwitchPillOn: {
    backgroundColor: 'rgba(124, 92, 252, 0.24)',
    borderColor: VIOLET,
  },
  reminderSwitchText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  reminderSwitchTextOn: {
    color: '#DDD6FE',
  },
});
