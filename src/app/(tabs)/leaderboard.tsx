import React, { useState, useRef, useCallback, ComponentRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, UI_FONT, MONO } from '@/theme';
import { LangId } from '@/data/courses';
import {
  AvatarThemeId,
  getLeagueProgress,
  LEAGUE_TIERS,
  LeaderboardEntry,
  useGame,
} from '@/store/GameStore';
import { TabHeader } from '@/components/TabHeader';
import { LanguageLogo } from '@/components/LanguageLogo';
import { SpringPressable } from '@/components/CyberButton';
import { HeroAmbientGlow, PulseStatusDot } from '@/components/ui/AmbientSurface';
import { StaggerCascadeItem } from '@/components/ui/StaggerCascadeItem';
import { tapHaptic, mediumHaptic, selectionHaptic, successHaptic } from '@/utils/haptics';
import { playSound } from '@/utils/sounds';
import { SPRING_JIGGLE_BOUNCE } from '@/utils/springPhysics';

const HEADER_BORDER = 'rgba(255, 255, 255, 0.07)';

type LeaderboardFilter = 'weekly' | 'all_time' | 'following';

const LANG_DISPLAY: Record<LangId, string> = {
  python: 'Python',
  cpp: 'C++',
  js: 'JavaScript',
  go: 'Go',
  java: 'Java',
  rust: 'Rust',
  sql: 'SQL',
  c: 'C',
  ts: 'TypeScript',
  css: 'CSS',
  html: 'HTML',
  php: 'PHP',
  asm: 'Assembly',
  swift: 'Swift',
  kotlin: 'Kotlin',
  julia: 'Julia',
  lua: 'Lua',
  csharp: 'C#',
};

const AVATAR_PALETTES: Record<
  AvatarThemeId,
  { ring: string; bg: string; bar: string }
> = {
  violet: { ring: '#7C5CFC', bg: '#161426', bar: '#A78BFA' },
  emerald: { ring: '#10B981', bg: '#0E1F1A', bar: '#34D399' },
  sky: { ring: '#38BDF8', bg: '#0F1B26', bar: '#7DD3FC' },
  amber: { ring: '#F59E0B', bg: '#211A0E', bar: '#FBBF24' },
};

function getWeeklyResetLabel(): string {
  const now = new Date();
  const dayUtc = now.getUTCDay(); // 0 = Sun
  const daysUntilSunday = (7 - dayUtc) % 7;
  const reset = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntilSunday,
      23,
      59,
      59,
    ),
  );
  let diffMs = reset.getTime() - now.getTime();
  if (diffMs <= 0) {
    diffMs += 7 * 24 * 60 * 60 * 1000;
  }
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const mins = totalMinutes % 60;
  if (days >= 1) return `${days}d ${hours}h left`;
  if (hours >= 1) return `${hours}h ${mins}m left`;
  return `${Math.max(1, mins)}m left`;
}

/* ------------------------------------------------------------------ */
/*  Sculptural Crystalline Trophy Emblem (Hero Left Graphic)          */
/* ------------------------------------------------------------------ */

function ObsidianTrophyEmblem() {
  return (
    <View style={styles.trophyEmblemWrap} pointerEvents="none">
      <View style={styles.trophyBackHalo}>
        <View style={styles.trophyCupStack}>
          <Ionicons
            name="trophy"
            size={30}
            color="#5B21B6"
            style={styles.trophyShadowLayer}
          />
          <Ionicons name="trophy" size={30} color="#A78BFA" />
          <View style={styles.trophyCenterFacet}>
            <MaterialCommunityIcons
              name="rhombus"
              size={9}
              color="#DDD6FE"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Right Abstract Syntax Graphic (6 Staggered Rows)             */
/* ------------------------------------------------------------------ */

interface TokenSegment {
  w: number;
  bg: string;
}

const HERO_SYNTAX_ROWS: TokenSegment[][] = [
  [
    { w: 18, bg: '#1F1F30' },
    { w: 34, bg: '#3B3854' },
  ],
  [
    { w: 22, bg: '#2A2740' },
    { w: 48, bg: '#A78BFA' },
  ],
  [
    { w: 36, bg: '#6D28D9' },
    { w: 30, bg: '#C4B5FD' },
  ],
  [
    { w: 26, bg: '#3B3854' },
    { w: 56, bg: '#7C5CFC' },
  ],
  [
    { w: 18, bg: '#2A2740' },
    { w: 36, bg: '#8B5CF6' },
    { w: 24, bg: '#C4B5FD' },
  ],
  [
    { w: 28, bg: '#475569' },
    { w: 42, bg: '#C4B5FD' },
  ],
];

function LeagueHeroSyntaxGraphic() {
  return (
    <View style={styles.heroGraphicWrap} pointerEvents="none">
      {HERO_SYNTAX_ROWS.map((row, rIdx) => (
        <View key={rIdx} style={styles.heroGraphicRow}>
          {row.map((seg, sIdx) => (
            <View
              key={sIdx}
              style={[
                styles.heroTokenBar,
                { width: seg.w, backgroundColor: seg.bg },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Violet Crown for #1 Podium Pillar                        */
/* ------------------------------------------------------------------ */

function PodiumCrown({ triggerKey }: { triggerKey: number }) {
  const crownScale = useRef(new Animated.Value(1)).current;
  const crownY = useRef(new Animated.Value(0)).current;
  const crownRotate = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    crownScale.stopAnimation();
    crownY.stopAnimation();
    crownRotate.stopAnimation();
    crownScale.setValue(0.8);
    crownY.setValue(4);
    crownRotate.setValue(-1);

    const anim = Animated.sequence([
      Animated.delay(145),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(crownY, {
            toValue: -6,
            duration: 95,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(crownY, {
            toValue: 0,
            ...SPRING_JIGGLE_BOUNCE,
          }),
        ]),
        Animated.sequence([
          Animated.timing(crownScale, {
            toValue: 1.24,
            duration: 95,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(crownScale, {
            toValue: 1,
            ...SPRING_JIGGLE_BOUNCE,
          }),
        ]),
        Animated.sequence([
          Animated.timing(crownRotate, {
            toValue: 1,
            duration: 95,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(crownRotate, {
            toValue: 0,
            ...SPRING_JIGGLE_BOUNCE,
          }),
        ]),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [triggerKey, crownScale, crownY, crownRotate]);

  const rotate = crownRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  return (
    <Animated.View
      style={[
        styles.crownContainer,
        {
          transform: [
            { translateY: crownY },
            { scale: crownScale },
            { rotate },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.crownBackDisc} />
      <MaterialCommunityIcons
        name="crown"
        size={30}
        color="#A78BFA"
        style={styles.crownMainIcon}
      />
      <View style={styles.crownBaseRim} />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini Terminal Avatar (For Current User Row)                       */
/* ------------------------------------------------------------------ */

function MiniTerminalBadge({
  theme = 'violet',
}: {
  theme?: AvatarThemeId;
}) {
  const palette = AVATAR_PALETTES[theme];
  return (
    <View
      style={[
        styles.userAvatarCircle,
        { backgroundColor: palette.bg, borderColor: palette.ring },
      ]}
    >
      <View
        style={[
          styles.miniTerminalWindow,
          { borderColor: `${palette.bar}55` },
        ]}
      >
        <View style={styles.miniTerminalDotsRow}>
          <View style={[styles.miniDot, { backgroundColor: '#EF4444' }]} />
          <View style={[styles.miniDot, { backgroundColor: '#F59E0B' }]} />
          <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
        </View>
        <View style={styles.miniTerminalLines}>
          <View
            style={[
              styles.miniCodeLine,
              { width: 10, backgroundColor: palette.bar },
            ]}
          />
          <View
            style={[
              styles.miniCodeLine,
              { width: 14, backgroundColor: '#64748B' },
            ]}
          />
          <View
            style={[
              styles.miniCodeLine,
              { width: 8, backgroundColor: '#94A3B8' },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Stylized Developer Avatar for Standings Rows                      */
/* ------------------------------------------------------------------ */

interface CoderAvatarProps {
  bg: string;
  hairColor: string;
  shirtColor: string;
}

function StylizedCoderAvatar({ bg, hairColor, shirtColor }: CoderAvatarProps) {
  return (
    <View style={[styles.coderAvatarCircle, { backgroundColor: bg }]}>
      {/* Hair + Head */}
      <View style={[styles.coderHair, { backgroundColor: hairColor }]} />
      <View style={styles.coderFace} />
      {/* Shoulders */}
      <View style={[styles.coderShoulders, { backgroundColor: shirtColor }]} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Leaderboard Helpers                                               */
/* ------------------------------------------------------------------ */

function formatHandle(handle: string): string {
  return handle.startsWith('@') ? handle.slice(1) : handle;
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    xp,
    weeklyXp,
    avatarTheme,
    liveLeaderboard,
    leaderboardSource,
    followedRivalIds,
    nudgedRivalIds,
    toggleFollowRival,
    nudgeRival,
    refreshLeaderboard,
  } = useGame();

  const leagueInfo = getLeagueProgress(xp);

  const [filter, setFilter] = useState<LeaderboardFilter>('weekly');
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [leagueModalOpen, setLeagueModalOpen] = useState(false);
  const [userRowY, setUserRowY] = useState<number | null>(null);

  const scrollRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const lastFocusRefreshRef = useRef(0);

  const [cascadeKey, setCascadeKey] = useState(0);
  const [focusCycle, setFocusCycle] = useState(0);

  // Tab switch fade + glide
  const tabFadeAnim = useRef(new Animated.Value(1)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;
  const segmentAnim = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.92)).current;

  useFocusEffect(
    useCallback(() => {
      const raf = requestAnimationFrame(() => {
        setFocusCycle((c) => c + 1);
        setCascadeKey((k) => k + 1);
      });
      const now = Date.now();
      if (now - lastFocusRefreshRef.current < 15000) {
        return () => cancelAnimationFrame(raf);
      }
      lastFocusRefreshRef.current = now;
      const timer = setTimeout(() => {
        void refreshLeaderboard();
      }, 60);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }, [refreshLeaderboard]),
  );

  const handleFilterChange = (next: LeaderboardFilter) => {
    if (next === filter) return;
    selectionHaptic();
    playSound('select');
    setFilter(next);
    setCascadeKey((k) => k + 1);
    const index = next === 'weekly' ? 0 : next === 'all_time' ? 1 : 2;
    Animated.timing(segmentAnim, {
      toValue: index,
      duration: 130,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleSegmentLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - segmentWidth) > 1) {
      setSegmentWidth(w);
    }
  };

  const animateModalIn = () => {
    modalOpacity.stopAnimation();
    modalScale.stopAnimation();
    modalOpacity.setValue(0);
    modalScale.setValue(0.92);
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeActiveModal = (afterClose?: () => void, silent = false) => {
    if (!silent) playSound('drawer_close');
    modalOpacity.stopAnimation();
    modalScale.stopAnimation();
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.92,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedEntryId(null);
      setLeagueModalOpen(false);
      afterClose?.();
    });
  };

  const handlePullRefresh = async () => {
    tapHaptic();
    playSound('tap', { volumeMultiplier: 0.65 });
    setIsRefreshing(true);
    await refreshLeaderboard();
    setIsRefreshing(false);
    playSound('reveal', { volumeMultiplier: 0.55 });
  };

  const handleHeroPress = () => {
    tapHaptic();
    playSound('drawer_open');
    setSelectedEntryId(null);
    setLeagueModalOpen(true);
    animateModalIn();
  };

  const handleEntryPress = (entry: LeaderboardEntry) => {
    selectionHaptic();
    playSound('drawer_open');
    setLeagueModalOpen(false);
    setSelectedEntryId(entry.id);
    animateModalIn();
  };

  const baseFiltered =
    filter === 'following'
      ? liveLeaderboard.filter(
          (entry) => entry.isUser || followedRivalIds.includes(entry.id),
        )
      : liveLeaderboard;

  const sortedLeaderboard: LeaderboardEntry[] = [...baseFiltered]
    .sort((a, b) => {
      const aWeekly = a.weeklyXp ?? a.xp;
      const bWeekly = b.weeklyXp ?? b.xp;
      if (filter === 'weekly') {
        if (bWeekly !== aWeekly) return bWeekly - aWeekly;
      }
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (bWeekly !== aWeekly) return bWeekly - aWeekly;
      return a.isUser ? -1 : b.isUser ? 1 : 0;
    })
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

  const showPodium = sortedLeaderboard.length >= 3;
  const firstPlace = showPodium ? sortedLeaderboard[0] : undefined;
  const secondPlace = showPodium ? sortedLeaderboard[1] : undefined;
  const thirdPlace = showPodium ? sortedLeaderboard[2] : undefined;
  const standingsRows = showPodium
    ? sortedLeaderboard.slice(3)
    : sortedLeaderboard;

  const userStanding = sortedLeaderboard.find((entry) => entry.isUser);
  const overallUserEntry = liveLeaderboard.find((entry) => entry.isUser);
  const inspectedEntry =
    selectedEntryId !== null
      ? sortedLeaderboard.find((e) => e.id === selectedEntryId) ??
        liveLeaderboard.find((e) => e.id === selectedEntryId) ??
        null
      : null;

  const metricForEntry = (entry: LeaderboardEntry): number =>
    filter === 'weekly' ? (entry.weeklyXp ?? entry.xp) : entry.xp;

  const metricLabel = filter === 'weekly' ? 'WK XP' : 'XP';
  const resetLabel = getWeeklyResetLabel();
  const bottomPadding = Math.max(115, insets.bottom + 84);

  const tabItemWidth = segmentWidth > 0 ? segmentWidth / 3 : 0;
  const indicatorTranslateX = segmentAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabItemWidth, tabItemWidth * 2],
  });

  const jumpToMyRow = () => {
    if (userRowY === null) return;
    tapHaptic();
    playSound('select');
    scrollRef.current?.scrollTo({
      y: Math.max(0, userRowY - 12),
      animated: true,
    });
  };

  const renderSidePodiumCard = (
    entry: LeaderboardEntry | undefined,
    rankPos: 2 | 3,
  ) => {
    if (!entry) return null;
    const label = entry.isUser
      ? `${entry.username} (You)`
      : formatHandle(entry.handle);
    const activeXp = metricForEntry(entry);
    return (
      <StaggerCascadeItem
        key={entry.id}
        index={rankPos === 2 ? 0 : 1}
        delayMs={60}
        initialTranslateY={36}
        initialScale={0.92}
        triggerKey={cascadeKey}
        style={styles.podiumSideFlex}
      >
        <SpringPressable
          onPress={() => handleEntryPress(entry)}
          haptic="selection"
          sound="none"
          pressScale={0.98}
          style={rankPos === 2 ? styles.pillarSecond : styles.pillarThird}
        >
          <View
            style={rankPos === 2 ? styles.medallionSecond : styles.medallionThird}
          >
            <Text
              style={
                rankPos === 2
                  ? styles.medallionTextSecond
                  : styles.medallionTextThird
              }
            >
              {entry.rank}
            </Text>
          </View>
          <Text
            style={[
              styles.pillarNameSide,
              entry.isUser && { color: '#C4B5FD' },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <View style={styles.podiumLangRow}>
            <LanguageLogo language={entry.lang} size={11} />
            <Text style={styles.podiumLangTextSide}>
              {LANG_DISPLAY[entry.lang]}
            </Text>
          </View>
          <View style={styles.pillarXpPillSide}>
            <Text style={styles.pillarXpSide} numberOfLines={1}>
              {`${activeXp.toLocaleString()} XP`}
            </Text>
          </View>
        </SpringPressable>
      </StaggerCascadeItem>
    );
  };

  const leaderGapToTop =
    overallUserEntry && liveLeaderboard[0]
      ? Math.max(0, liveLeaderboard[0].xp - overallUserEntry.xp)
      : 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* 1. TOP HEADER BAR */}
      <TabHeader
        title="Leaderboard"
        titleSize={18}
        borderColor={HEADER_BORDER}
      />

      {/* 2. SCROLLABLE BENTO CONTENT */}
      <Animated.View
        style={[
          styles.animatedBody,
          {
            opacity: tabFadeAnim,
            transform: [{ translateY: tabSlideAnim }],
          },
        ]}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.bentoContainer,
            { paddingBottom: bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handlePullRefresh}
              tintColor="#C4B5FD"
            />
          }
        >
          {/* ZONE 1: Obsidian League Hero Card */}
          <StaggerCascadeItem index={0} delayMs={35} triggerKey={focusCycle}>
            <SpringPressable
              onPress={handleHeroPress}
              haptic="selection"
              sound="none"
              pressScale={0.985}
              style={styles.heroCard}
            >
              <HeroAmbientGlow
                accentColor={leagueInfo.currentTier.accent}
                intensity={1.05}
              />
              <ObsidianTrophyEmblem />

              <View style={styles.leagueDetails}>
                <Text style={styles.leagueTitle} numberOfLines={1}>
                  {`${leagueInfo.currentTier.name} League`}
                </Text>

                <View style={styles.timerPill}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={leagueInfo.currentTier.accent}
                  />
                  <Text style={styles.timerPillText} numberOfLines={1}>
                    {resetLabel}
                  </Text>
                </View>
              </View>

              <LeagueHeroSyntaxGraphic />
            </SpringPressable>
          </StaggerCascadeItem>

          {/* Segmented Control: Weekly | All-Time | Following */}
          <View style={styles.segmentTrack}>
            <View style={styles.segmentInner} onLayout={handleSegmentLayout}>
              {tabItemWidth > 0 ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.segmentIndicator,
                    {
                      width: tabItemWidth,
                      transform: [{ translateX: indicatorTranslateX }],
                    },
                  ]}
                />
              ) : null}

              {(
                [
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'all_time', label: 'All-Time' },
                  {
                    id: 'following',
                    label:
                      followedRivalIds.length > 0
                        ? `Following (${followedRivalIds.length})`
                        : 'Following',
                  },
                ] as const
              ).map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => handleFilterChange(tab.id)}
                    style={styles.segmentBtn}
                  >
                    <Text
                      style={[
                        styles.segmentLabel,
                        isActive && styles.segmentLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ZONE 2: Plush 3D Podium Cards (#2, #1, #3) */}
          {showPodium ? (
            <View style={styles.podiumMonument}>
              <View style={styles.podiumPillarsRow}>
                {/* Left Pillar (#2) */}
                {renderSidePodiumCard(secondPlace, 2)}

                {/* Center Pillar (#1) */}
                {firstPlace ? (
                  <StaggerCascadeItem
                    index={2}
                    delayMs={60}
                    initialTranslateY={42}
                    initialScale={0.9}
                    triggerKey={cascadeKey}
                    style={styles.podiumCenterFlex}
                  >
                    <SpringPressable
                      onPress={() => handleEntryPress(firstPlace)}
                      haptic="selection"
                      sound="none"
                      pressScale={0.98}
                      style={styles.pillarFirst}
                    >
                      <PodiumCrown triggerKey={cascadeKey} />

                      <View style={styles.medallionFirst}>
                        <Text style={styles.medallionTextFirst}>
                          {firstPlace.rank}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.pillarNameFirst,
                          firstPlace.isUser && { color: '#C4B5FD' },
                        ]}
                        numberOfLines={1}
                      >
                        {firstPlace.isUser
                          ? `${firstPlace.username} (You)`
                          : formatHandle(firstPlace.handle)}
                      </Text>
                      <View style={styles.podiumLangRow}>
                        <LanguageLogo language={firstPlace.lang} size={12} />
                        <Text style={styles.podiumLangTextFirst}>
                          {LANG_DISPLAY[firstPlace.lang]}
                        </Text>
                      </View>
                      <View style={styles.pillarXpPillFirst}>
                        <Text style={styles.pillarXpFirst} numberOfLines={1}>
                          {`${metricForEntry(firstPlace).toLocaleString()} XP`}
                        </Text>
                      </View>
                    </SpringPressable>
                  </StaggerCascadeItem>
                ) : null}

                {/* Right Pillar (#3) */}
                {renderSidePodiumCard(thirdPlace, 3)}
              </View>

              {/* Subtle Pill Stage Base */}
              <View style={styles.plinthPillBar} />
            </View>
          ) : null}

          {/* ZONE 3: Standings with Live Rankings & Language Badges */}
          <View style={styles.standingsSection}>
            <View style={styles.standingsHeaderRow}>
              <View style={styles.standingsTitleGroup}>
                <Text style={styles.standingsHeader}>Standings</Text>
                {userStanding && userRowY !== null && userStanding.rank > 3 ? (
                  <SpringPressable
                    onPress={jumpToMyRow}
                    haptic="light"
                    sound="none"
                    pressScale={0.96}
                    style={styles.myRankJumpPill}
                  >
                    <Text style={styles.myRankJumpText}>
                      {`You #${userStanding.rank}`}
                    </Text>
                  </SpringPressable>
                ) : null}
              </View>

              <SpringPressable
                onPress={handlePullRefresh}
                haptic="light"
                sound="none"
                pressScale={0.96}
                style={styles.sourceRefreshPill}
              >
                {leaderboardSource === 'supabase' ? (
                  <PulseStatusDot color="#34D399" size={5.5} active />
                ) : (
                  <Feather name="refresh-cw" size={10} color="#94A3B8" />
                )}
                <Text
                  style={[
                    styles.sourceBadgeText,
                    leaderboardSource === 'supabase' && { color: '#34D399' },
                  ]}
                >
                  {leaderboardSource === 'supabase' ? 'LIVE CLOUD' : 'LOCAL'}
                </Text>
              </SpringPressable>
            </View>

            <View style={styles.standingsList}>
              {standingsRows.map((row, rowIdx) => {
                const activeXp = metricForEntry(row);
                const xpText = `${activeXp.toLocaleString()} ${metricLabel}`;
                const langLabel = LANG_DISPLAY[row.lang];
                const isFollowed = followedRivalIds.includes(row.id);

                if (row.isUser) {
                  return (
                    <StaggerCascadeItem
                      key={row.id}
                      index={Math.min(rowIdx + 1, 10)}
                      delayMs={35}
                      triggerKey={cascadeKey}
                    >
                      <View onLayout={(e) => setUserRowY(e.nativeEvent.layout.y)}>
                        <SpringPressable
                          onPress={() => handleEntryPress(row)}
                          haptic="selection"
                          sound="none"
                          pressScale={0.985}
                          style={styles.userStandingCard}
                        >
                          <View style={styles.standingLeft}>
                            <View style={styles.userRankCircle}>
                              <Text style={styles.userRankCircleText}>
                                {row.rank}
                              </Text>
                            </View>

                            <MiniTerminalBadge theme={avatarTheme} />

                            <View style={styles.userTextCol}>
                              <View style={styles.userNameRow}>
                                <Text
                                  style={styles.userStandingName}
                                  numberOfLines={1}
                                >
                                  {`${row.username} (You)`}
                                </Text>
                                <View style={styles.onlineOrangeDot} />
                              </View>
                              <View style={styles.langMetaRow}>
                                <LanguageLogo language={row.lang} size={11} />
                                <Text
                                  style={[
                                    styles.langMetaText,
                                    styles.userLangMetaText,
                                  ]}
                                >
                                  {langLabel}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.userXpPill}>
                            <Text style={styles.userStandingXp}>{xpText}</Text>
                          </View>
                        </SpringPressable>
                      </View>
                    </StaggerCascadeItem>
                  );
                }

                return (
                  <StaggerCascadeItem
                    key={row.id}
                    index={Math.min(rowIdx + 1, 10)}
                    delayMs={35}
                    triggerKey={cascadeKey}
                  >
                    <SpringPressable
                      onPress={() => handleEntryPress(row)}
                      haptic="selection"
                      sound="none"
                      pressScale={0.985}
                      style={styles.rivalStandingRow}
                    >
                      <View style={styles.standingLeft}>
                        <Text style={styles.rivalRankText}>{row.rank}</Text>

                        <StylizedCoderAvatar
                          bg={row.avatarBg ?? '#CBD5E1'}
                          hairColor={row.hairColor ?? '#1E293B'}
                          shirtColor={row.shirtColor ?? '#3B82F6'}
                        />

                        <View style={styles.rivalTextCol}>
                          <View style={styles.rivalNameRow}>
                            <Text
                              style={styles.rivalStandingName}
                              numberOfLines={1}
                            >
                              {formatHandle(row.handle)}
                            </Text>
                            {isFollowed ? (
                              <View style={styles.followingTag}>
                                <Text style={styles.followingTagText}>
                                  Following
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <View style={styles.langMetaRow}>
                            <LanguageLogo language={row.lang} size={11} />
                            <Text style={styles.langMetaText}>{langLabel}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.rivalXpPill}>
                        <Text style={styles.rivalStandingXp}>{xpText}</Text>
                      </View>
                    </SpringPressable>
                  </StaggerCascadeItem>
                );
              })}

              {filter === 'following' && followedRivalIds.length === 0 ? (
                <View style={styles.followingHintCard}>
                  <View style={styles.followingHintIconBox}>
                    <Ionicons name="people-outline" size={17} color="#C4B5FD" />
                  </View>
                  <View style={styles.followingHintCopy}>
                    <Text style={styles.followingHintTitle}>
                      No followed rivals yet
                    </Text>
                    <Text style={styles.followingHintSub}>
                      Tap any coder on Weekly or All-Time to follow and track
                      them head-to-head.
                    </Text>
                  </View>
                  <SpringPressable
                    onPress={() => handleFilterChange('weekly')}
                    haptic="light"
                    sound="none"
                    pressScale={0.96}
                    style={styles.followingBrowseBtn}
                  >
                    <Text style={styles.followingBrowseText}>Browse</Text>
                  </SpringPressable>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* ─── Modal A: Obsidian League Overview ────────────────────────────── */}
      <Modal
        visible={leagueModalOpen}
        transparent
        animationType="none"
        onRequestClose={() => closeActiveModal()}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[styles.modalOverlay, { opacity: modalOpacity }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeActiveModal()}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <View style={styles.modalBadgeViolet}>
                  <Ionicons
                    name="trophy"
                    size={18}
                    color={leagueInfo.currentTier.accent}
                  />
                </View>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.modalTitle}>
                    {`${leagueInfo.currentTier.name} League`}
                  </Text>
                  <Text style={styles.modalSub}>
                    {`${xp.toLocaleString()} Total XP · Resets in ${resetLabel}`}
                  </Text>
                </View>
              </View>

              <SpringPressable
                onPress={() => closeActiveModal()}
                hitSlop={8}
                haptic="light"
                sound="none"
                pressScale={0.94}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={16} color="#94A3B8" />
              </SpringPressable>
            </View>

            <View style={styles.modalMetricsRow}>
              <View style={styles.modalMetricBox}>
                <Text style={styles.modalMetricLabel}>YOUR RANK</Text>
                <Text style={styles.modalMetricVal}>
                  #{overallUserEntry?.rank ?? '--'}
                </Text>
              </View>
              <View style={styles.modalMetricBox}>
                <Text style={styles.modalMetricLabel}>WEEKLY XP</Text>
                <Text style={[styles.modalMetricVal, { color: '#C4B5FD' }]}>
                  {weeklyXp.toLocaleString()}
                </Text>
              </View>
              <View style={styles.modalMetricBox}>
                <Text style={styles.modalMetricLabel}>
                  {leagueInfo.nextTier
                    ? `TO ${leagueInfo.nextTier.name.toUpperCase()}`
                    : 'TO #1'}
                </Text>
                <Text style={styles.modalMetricVal}>
                  {leagueInfo.nextTier
                    ? `${leagueInfo.xpToNext.toLocaleString()} XP`
                    : leaderGapToTop === 0
                      ? 'LEADER'
                      : `${leaderGapToTop}`}
                </Text>
              </View>
            </View>

            <View style={styles.tierProgressBox}>
              <View style={styles.tierProgressTop}>
                <Text style={styles.tierProgressTitle}>
                  {leagueInfo.nextTier
                    ? `${leagueInfo.currentTier.name} → ${leagueInfo.nextTier.name}`
                    : `${leagueInfo.currentTier.name} · Max Tier`}
                </Text>
                <Text style={styles.tierProgressMeta}>
                  {`${leagueInfo.progressPct}%`}
                </Text>
              </View>
              <View style={styles.tierProgressTrack}>
                <View
                  style={[
                    styles.tierProgressFill,
                    {
                      width: `${leagueInfo.progressPct}%`,
                      backgroundColor: leagueInfo.currentTier.accent,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.tierListBox}>
              {LEAGUE_TIERS.map((tier) => {
                const isCurrent = tier.name === leagueInfo.currentTier.name;
                const isUnlocked = xp >= tier.minXp;
                return (
                  <View
                    key={tier.name}
                    style={[
                      styles.tierRow,
                      isCurrent && styles.tierRowCurrent,
                    ]}
                  >
                    <View style={styles.tierRowLeft}>
                      <View
                        style={[
                          styles.tierDot,
                          {
                            backgroundColor: isUnlocked
                              ? tier.accent
                              : '#3F3F46',
                          },
                          isCurrent && styles.tierDotCurrent,
                        ]}
                      />
                      <Text
                        style={[
                          styles.tierName,
                          isCurrent && styles.tierNameCurrent,
                        ]}
                      >
                        {tier.name}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.tierNote,
                        isCurrent
                          ? { color: '#C4B5FD' }
                          : isUnlocked
                            ? { color: '#34D399' }
                            : null,
                      ]}
                    >
                      {isCurrent
                        ? 'CURRENT TIER'
                        : isUnlocked
                          ? `UNLOCKED · ${tier.minXp.toLocaleString()}+ XP`
                          : `${tier.minXp.toLocaleString()}+ XP`}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <SpringPressable
                onPress={() => {
                  void handlePullRefresh();
                }}
                haptic="light"
                sound="none"
                pressScale={0.97}
                style={styles.modalSecondaryBtn}
              >
                <Feather name="refresh-cw" size={13} color="#E2E8F0" />
                <Text style={styles.modalSecondaryBtnText}>Refresh</Text>
              </SpringPressable>

              <SpringPressable
                onPress={() => closeActiveModal()}
                haptic="light"
                sound="none"
                pressScale={0.97}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </SpringPressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ─── Modal B: Developer Inspector Modal ─────────────────────────────── */}
      <Modal
        visible={inspectedEntry !== null}
        transparent
        animationType="none"
        onRequestClose={() => closeActiveModal()}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[styles.modalOverlay, { opacity: modalOpacity }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeActiveModal()}
            />
          </Animated.View>

          {inspectedEntry ? (
            <Animated.View
              style={[
                styles.modalCard,
                {
                  opacity: modalOpacity,
                  transform: [{ scale: modalScale }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleGroup}>
                  {inspectedEntry.isUser ? (
                    <MiniTerminalBadge theme={avatarTheme} />
                  ) : (
                    <StylizedCoderAvatar
                      bg={inspectedEntry.avatarBg ?? '#CBD5E1'}
                      hairColor={inspectedEntry.hairColor ?? '#1E293B'}
                      shirtColor={inspectedEntry.shirtColor ?? '#3B82F6'}
                    />
                  )}

                  <View style={styles.modalHeaderCopy}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {inspectedEntry.isUser
                        ? `${inspectedEntry.username} (You)`
                        : inspectedEntry.username}
                    </Text>
                    <View style={styles.inspectorSubRow}>
                      <Text style={styles.inspectorHandle}>
                        @{formatHandle(inspectedEntry.handle)}
                      </Text>
                      <View style={styles.inspectorLangBadge}>
                        <LanguageLogo language={inspectedEntry.lang} size={11} />
                        <Text style={styles.inspectorLangText}>
                          {LANG_DISPLAY[inspectedEntry.lang]}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <SpringPressable
                  onPress={() => closeActiveModal()}
                  hitSlop={8}
                  haptic="light"
                  sound="none"
                  pressScale={0.94}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={16} color="#94A3B8" />
                </SpringPressable>
              </View>

              <View style={styles.modalMetricsRow}>
                <View style={styles.modalMetricBox}>
                  <Text style={styles.modalMetricLabel}>RANK</Text>
                  <Text style={styles.modalMetricVal}>
                    #{inspectedEntry.rank}
                  </Text>
                </View>
                <View style={styles.modalMetricBox}>
                  <Text style={styles.modalMetricLabel}>TOTAL XP</Text>
                  <Text style={styles.modalMetricVal}>
                    {inspectedEntry.xp.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.modalMetricBox}>
                  <Text style={styles.modalMetricLabel}>WEEKLY</Text>
                  <Text style={[styles.modalMetricVal, { color: '#C4B5FD' }]}>
                    {(
                      inspectedEntry.weeklyXp ?? inspectedEntry.xp
                    ).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.modalMetricsRow}>
                <View style={styles.modalMetricBox}>
                  <Text style={styles.modalMetricLabel}>STREAK</Text>
                  <Text style={styles.modalMetricVal}>
                    {inspectedEntry.streak ?? 0}d
                  </Text>
                </View>
                <View style={styles.modalMetricBox}>
                  <Text style={styles.modalMetricLabel}>BUGS FIXED</Text>
                  <Text style={styles.modalMetricVal}>
                    {inspectedEntry.bugsCrushed ?? 0}
                  </Text>
                </View>
              </View>

              {!inspectedEntry.isUser ? (
                <View style={styles.gapBanner}>
                  <Ionicons
                    name={
                      inspectedEntry.xp > xp
                        ? 'trending-up'
                        : 'checkmark-circle'
                    }
                    size={15}
                    color={inspectedEntry.xp > xp ? '#C4B5FD' : '#34D399'}
                  />
                  <Text style={styles.gapBannerText}>
                    {inspectedEntry.xp > xp
                      ? `${(inspectedEntry.xp - xp).toLocaleString()} XP ahead of your score`
                      : inspectedEntry.xp === xp
                        ? 'Tied on Total XP right now'
                        : `You lead by ${(xp - inspectedEntry.xp).toLocaleString()} XP`}
                  </Text>
                </View>
              ) : null}

              {!inspectedEntry.isUser ? (
                <View style={styles.modalFooter}>
                  <SpringPressable
                    onPress={() => {
                      const nowFollowing = toggleFollowRival(inspectedEntry.id);
                      if (nowFollowing) {
                        successHaptic();
                        playSound('select');
                      } else {
                        tapHaptic();
                        playSound('tap');
                      }
                    }}
                    haptic="selection"
                    sound="none"
                    pressScale={0.97}
                    style={[
                      styles.modalSecondaryBtn,
                      followedRivalIds.includes(inspectedEntry.id) &&
                        styles.modalActiveFollowBtn,
                    ]}
                  >
                    <Ionicons
                      name={
                        followedRivalIds.includes(inspectedEntry.id)
                          ? 'checkmark'
                          : 'person-add-outline'
                      }
                      size={14}
                      color={
                        followedRivalIds.includes(inspectedEntry.id)
                          ? '#C4B5FD'
                          : '#E2E8F0'
                      }
                    />
                    <Text
                      style={[
                        styles.modalSecondaryBtnText,
                        followedRivalIds.includes(inspectedEntry.id) && {
                          color: '#C4B5FD',
                        },
                      ]}
                    >
                      {followedRivalIds.includes(inspectedEntry.id)
                        ? 'Following'
                        : 'Follow'}
                    </Text>
                  </SpringPressable>

                  <SpringPressable
                    onPress={() => {
                      if (nudgedRivalIds.includes(inspectedEntry.id)) return;
                      mediumHaptic();
                      playSound('coin');
                      nudgeRival(inspectedEntry.id);
                    }}
                    haptic="medium"
                    sound="none"
                    pressScale={0.97}
                    style={[
                      styles.modalPrimaryBtn,
                      { flex: 1, flexDirection: 'row', gap: 6 },
                      nudgedRivalIds.includes(inspectedEntry.id) &&
                        styles.modalNudgedBtn,
                    ]}
                  >
                    <Ionicons
                      name={
                        nudgedRivalIds.includes(inspectedEntry.id)
                          ? 'checkmark-done'
                          : 'hand-left-outline'
                      }
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.modalPrimaryBtnText}>
                      {nudgedRivalIds.includes(inspectedEntry.id)
                        ? 'Cheers Sent'
                        : 'Send Cheers'}
                    </Text>
                  </SpringPressable>
                </View>
              ) : (
                <View style={styles.modalFooter}>
                  <SpringPressable
                    onPress={() =>
                      closeActiveModal(() => router.navigate('/profile'), true)
                    }
                    haptic="selection"
                    pressScale={0.97}
                    style={styles.modalSecondaryBtn}
                  >
                    <Text style={styles.modalSecondaryBtnText}>
                      Open Profile
                    </Text>
                  </SpringPressable>

                  <SpringPressable
                    onPress={() => closeActiveModal()}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={styles.modalPrimaryBtn}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Done</Text>
                  </SpringPressable>
                </View>
              )}
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scrollView: {
    flex: 1,
  },
  bentoContainer: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 20,
  },

  /* ZONE 1: Obsidian League Hero Card ---------------------------------- */
  heroCard: {
    backgroundColor: '#151421',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    borderBottomWidth: 4,
    borderBottomColor: '#4C35B5',
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  trophyEmblemWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trophyBackHalo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1F1D30',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyCupStack: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyShadowLayer: {
    position: 'absolute',
    top: 2,
    left: 2,
    opacity: 0.65,
  },
  trophyCenterFacet: {
    position: 'absolute',
    top: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueDetails: {
    marginLeft: 14,
    maxWidth: '64%',
    zIndex: 2,
  },
  leagueTitle: {
    fontFamily: UI_FONT,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  timerPill: {
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.26)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerPillText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  heroGraphicWrap: {
    position: 'absolute',
    right: 12,
    top: 14,
    bottom: 14,
    width: 92,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    opacity: 0.26,
  },
  heroGraphicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  heroTokenBar: {
    height: 6,
    borderRadius: 3,
  },

  /* ZONE 2: Plush 3D Podium Monument ----------------------------------- */
  podiumMonument: {
    width: '100%',
    paddingTop: 14,
    alignItems: 'center',
  },
  podiumPillarsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  podiumSideFlex: {
    flex: 1,
  },
  podiumCenterFlex: {
    flex: 1.08,
  },
  pillarSecond: {
    width: '100%',
    height: 150,
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 5,
    borderBottomColor: '#0C0B14',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  pillarFirst: {
    width: '100%',
    height: 180,
    backgroundColor: '#191729',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#7C5CFC',
    borderBottomWidth: 5,
    borderBottomColor: '#4C35B5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 10,
    position: 'relative',
  },
  pillarThird: {
    width: '100%',
    height: 144,
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 5,
    borderBottomColor: '#0C0B14',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  crownContainer: {
    position: 'absolute',
    top: -19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownBackDisc: {
    position: 'absolute',
    width: 36,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
  },
  crownMainIcon: {
    zIndex: 2,
  },
  crownBaseRim: {
    width: 20,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#C4B5FD',
    marginTop: -4,
  },
  medallionSecond: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  medallionTextSecond: {
    fontFamily: UI_FONT,
    fontSize: 19,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  medallionFirst: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    borderWidth: 2,
    borderColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  medallionTextFirst: {
    fontFamily: UI_FONT,
    fontSize: 20,
    fontWeight: '800',
    color: '#FACC15',
  },
  medallionThird: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(180, 120, 70, 0.16)',
    borderWidth: 2,
    borderColor: '#A16207',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  medallionTextThird: {
    fontFamily: UI_FONT,
    fontSize: 19,
    fontWeight: '800',
    color: '#D97706',
  },
  pillarNameSide: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  pillarNameFirst: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  podiumLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  podiumLangTextSide: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: -0.2,
  },
  podiumLangTextFirst: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: -0.2,
  },
  pillarXpPillSide: {
    marginTop: 4,
    backgroundColor: '#1E1C2E',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillarXpSide: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  pillarXpPillFirst: {
    marginTop: 4,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.28)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  pillarXpFirst: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: '#EDE9FE',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  plinthPillBar: {
    width: '56%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 10,
  },

  /* ZONE 3: Standings Section ------------------------------------------ */
  standingsSection: {
    width: '100%',
  },
  standingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  standingsHeader: {
    fontFamily: UI_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  sourceBadgeText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  standingsList: {
    width: '100%',
  },
  userStandingCard: {
    minHeight: 58,
    paddingVertical: 11,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#7C5CFC',
    borderBottomWidth: 4,
    borderBottomColor: '#4C35B5',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  standingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userRankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRankCircleText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  userAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161426',
    borderWidth: 1.5,
    borderColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTerminalWindow: {
    width: 22,
    height: 18,
    borderRadius: 3.5,
    backgroundColor: '#0E0D18',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    paddingHorizontal: 3,
    paddingTop: 2.5,
    gap: 2,
  },
  miniTerminalDotsRow: {
    flexDirection: 'row',
    gap: 1.5,
  },
  miniDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },
  miniTerminalLines: {
    gap: 1.5,
    marginTop: 1,
  },
  miniCodeLine: {
    height: 1.8,
    borderRadius: 1,
  },
  userTextCol: {
    flexShrink: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  userStandingName: {
    fontFamily: UI_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  onlineOrangeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F97316',
  },
  langMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    marginTop: 2,
  },
  langMetaText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: -0.2,
  },
  userLangMetaText: {
    color: '#C4B5FD',
    fontWeight: '600',
  },
  userXpPill: {
    backgroundColor: 'rgba(124, 92, 252, 0.25)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.30)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  userStandingXp: {
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },

  /* Rival Rows (#5, #6, #7) -------------------------------------------- */
  rivalStandingRow: {
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#151421',
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#232135',
    borderBottomWidth: 3,
    borderBottomColor: '#0C0B14',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rivalRankText: {
    width: 26,
    textAlign: 'center',
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '700',
    color: '#7C5CFC',
    fontVariant: ['tabular-nums'],
  },
  coderAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  coderHair: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 13,
    borderRadius: 8,
  },
  coderFace: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FDBA74',
    marginBottom: 1,
    zIndex: 2,
  },
  coderShoulders: {
    width: 24,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  rivalTextCol: {
    flexShrink: 1,
  },
  rivalStandingName: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '600',
    color: '#FAFAFA',
    flexShrink: 1,
  },
  rivalXpPill: {
    backgroundColor: '#1E1C2E',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  rivalStandingXp: {
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  animatedBody: {
    flex: 1,
  },
  segmentTrack: {
    height: 44,
    padding: 5,
    borderRadius: 999,
    backgroundColor: '#151421',
    borderWidth: 1.5,
    borderColor: '#252338',
  },
  segmentInner: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 2,
    borderBottomColor: '#5639D6',
  },
  segmentBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentLabel: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  standingsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  myRankJumpPill: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myRankJumpText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  sourceRefreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#151421',
    borderWidth: 1,
    borderColor: '#252338',
  },
  rivalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followingTag: {
    height: 18,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingTagText: {
    fontFamily: UI_FONT,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  followingHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 14,
    marginTop: 10,
  },
  followingHintIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F1D30',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingHintCopy: {
    flex: 1,
  },
  followingHintTitle: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  followingHintSub: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  followingBrowseBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#1E1C2E',
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 3,
    borderBottomColor: '#100F1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingBrowseText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(4, 4, 8, 0.78)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#12111A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  modalBadgeViolet: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderCopy: {
    flex: 1,
  },
  modalTitle: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontFamily: MONO,
    fontSize: 11.5,
    color: '#C4B5FD',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalMetricBox: {
    flex: 1,
    backgroundColor: '#0E0E15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  modalMetricLabel: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  modalMetricVal: {
    fontFamily: MONO,
    fontSize: 15,
    fontWeight: '700',
    color: '#FAFAFA',
    marginTop: 3,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  tierListBox: {
    backgroundColor: '#0E0E15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6.5,
  },
  tierRowCurrent: {
    backgroundColor: 'rgba(124, 92, 252, 0.12)',
    borderRadius: 7,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  tierRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3F3F46',
  },
  tierDotCurrent: {
    backgroundColor: '#A78BFA',
  },
  tierName: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tierNameCurrent: {
    color: '#FAFAFA',
    fontWeight: '700',
  },
  tierNote: {
    fontFamily: MONO,
    fontSize: 10.5,
    color: '#71717A',
    letterSpacing: -0.2,
  },
  inspectorSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  inspectorHandle: {
    fontFamily: MONO,
    fontSize: 11.5,
    color: '#94A3B8',
    letterSpacing: -0.2,
  },
  inspectorLangBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  inspectorLangText: {
    fontFamily: MONO,
    fontSize: 10.5,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  gapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161522',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  gapBannerText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  modalSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  modalActiveFollowBtn: {
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
    borderColor: 'rgba(124, 92, 252, 0.35)',
  },
  modalSecondaryBtnText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  modalPrimaryBtn: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNudgedBtn: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  modalPrimaryBtnText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tierProgressBox: {
    backgroundColor: '#11101A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 7,
  },
  tierProgressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tierProgressTitle: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  tierProgressMeta: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  tierProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1C1C28',
    overflow: 'hidden',
  },
  tierProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
