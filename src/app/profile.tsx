import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, UI_FONT, MONO } from '@/theme';
import { LANGUAGES } from '@/data/courses';
import { useGame } from '@/store/GameStore';
import { Tactile3DBox } from '@/components/Tactile3D';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    xp,
    streak,
    activeLang,
    setActiveLang,
    completedNodes,
    bugsCrushed,
    correctAnswers,
    totalAnswers,
  } = useGame();

  const totalCompletedNodes = Object.values(completedNodes).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  const startedLanguages = Object.values(completedNodes).filter((arr) => arr.length > 0).length;
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100;

  const achievements = [
    {
      id: 'bug-crusher',
      title: 'Bug Crusher',
      subtitle: 'Find and fix syntax or logic bugs in Spot the Bug & Blitz mode.',
      level: 'LEVEL 2',
      current: Math.min(bugsCrushed, 15),
      target: 15,
      color: Colors.red,
      lipColor: Colors.redLip,
      icon: 'bug' as const,
    },
    {
      id: 'syntax-master',
      title: 'Syntax Master',
      subtitle: 'Complete interactive programming lessons with high accuracy.',
      level: 'LEVEL 3',
      current: Math.min(totalCompletedNodes, 12),
      target: 12,
      color: Colors.violet,
      lipColor: Colors.violetLip,
      icon: 'code-slash' as const,
    },
    {
      id: 'polyglot-hacker',
      title: 'Polyglot Hacker',
      subtitle: 'Complete lessons across Python, C++, JavaScript, and Go.',
      level: 'LEVEL 4',
      current: Math.min(startedLanguages, 4),
      target: 4,
      color: Colors.emerald,
      lipColor: Colors.emeraldLip,
      icon: 'globe' as const,
    },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Duolingo 2-Layer 3D Profile Header */}
        <Tactile3DBox
          depth={5}
          borderRadius={20}
          faceColor={Colors.card}
          lipColor={Colors.cardLip}
          borderColor={Colors.border}
          faceStyle={styles.profileHeaderFace}
        >
          <View style={styles.headerTopRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.displayName}>Alex Dev</Text>
              <Text style={styles.handleText}>@alex_codes • Joined March 2026</Text>
              <Text style={styles.accuracyMeta}>{accuracy}% Lifetime Accuracy</Text>
            </View>

            <View style={styles.avatarPuckBase}>
              <View style={styles.avatarPuckFace}>
                <View style={styles.avatarHighlight} />
                <Text style={styles.avatarInitials}>AD</Text>
              </View>
            </View>
          </View>

          {/* Active Courses Pills with 2-Layer 3D Extrusion */}
          <View style={styles.flagsSection}>
            <Text style={styles.flagsLabel}>ACTIVE COURSES</Text>
            <View style={styles.flagsRow}>
              {LANGUAGES.map((lang) => {
                const isSelected = lang.id === activeLang;
                const count = (completedNodes[lang.id] ?? []).length;
                return (
                  <Tactile3DBox
                    key={lang.id}
                    depth={4}
                    borderRadius={12}
                    faceColor={isSelected ? Colors.violetTint : Colors.bg}
                    lipColor={isSelected ? Colors.violetLip : Colors.cardLip}
                    borderColor={isSelected ? Colors.violet : Colors.border}
                    onPress={() => setActiveLang(lang.id)}
                    faceStyle={styles.flagChipFace}
                  >
                    <View
                      style={[
                        styles.flagBadgeBase,
                        { backgroundColor: lang.badgeLip },
                      ]}
                    >
                      <View
                        style={[
                          styles.flagBadgeFace,
                          {
                            backgroundColor: lang.badgeBg,
                            borderColor: lang.badgeLip,
                          },
                        ]}
                      >
                        <Text style={styles.flagBadgeText}>{lang.short}</Text>
                      </View>
                    </View>
                    <Text style={styles.flagName}>{lang.name}</Text>
                    <Text style={styles.flagCount}>{count}/12</Text>
                  </Tactile3DBox>
                );
              })}
            </View>
          </View>
        </Tactile3DBox>

        {/* 2x2 Overview Grid with 2-Layer 3D Stat Cards */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.overviewGrid}>
            <Tactile3DBox
              depth={4}
              borderRadius={16}
              faceColor={Colors.card}
              lipColor={Colors.cardLip}
              borderColor={Colors.border}
              style={styles.overviewBox}
              faceStyle={styles.overviewCardFace}
            >
              <Ionicons name="flame" size={26} color={Colors.flame} />
              <View style={styles.overviewTextCol}>
                <Text style={styles.overviewValue}>{streak}</Text>
                <Text style={styles.overviewLabel}>Day Streak</Text>
              </View>
            </Tactile3DBox>

            <Tactile3DBox
              depth={4}
              borderRadius={16}
              faceColor={Colors.card}
              lipColor={Colors.cardLip}
              borderColor={Colors.border}
              style={styles.overviewBox}
              faceStyle={styles.overviewCardFace}
            >
              <Ionicons name="flash" size={26} color={Colors.gold} />
              <View style={styles.overviewTextCol}>
                <Text style={styles.overviewValue}>{xp}</Text>
                <Text style={styles.overviewLabel}>Total XP</Text>
              </View>
            </Tactile3DBox>

            <Tactile3DBox
              depth={4}
              borderRadius={16}
              faceColor={Colors.card}
              lipColor={Colors.cardLip}
              borderColor={Colors.border}
              style={styles.overviewBox}
              faceStyle={styles.overviewCardFace}
            >
              <Ionicons name="shield" size={26} color={Colors.violet} />
              <View style={styles.overviewTextCol}>
                <Text style={styles.overviewValue}>Amethyst</Text>
                <Text style={styles.overviewLabel}>Current League</Text>
              </View>
            </Tactile3DBox>

            <Tactile3DBox
              depth={4}
              borderRadius={16}
              faceColor={Colors.card}
              lipColor={Colors.cardLip}
              borderColor={Colors.border}
              style={styles.overviewBox}
              faceStyle={styles.overviewCardFace}
            >
              <Ionicons name="trophy" size={26} color={Colors.sky} />
              <View style={styles.overviewTextCol}>
                <Text style={styles.overviewValue}>3</Text>
                <Text style={styles.overviewLabel}>Top 3 Finishes</Text>
              </View>
            </Tactile3DBox>
          </View>
        </View>

        {/* Achievements List */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Achievements</Text>

          <Tactile3DBox
            depth={5}
            borderRadius={18}
            faceColor={Colors.card}
            lipColor={Colors.cardLip}
            borderColor={Colors.border}
            faceStyle={styles.achievementsCardFace}
          >
            {achievements.map((ach, idx) => {
              const pct = Math.min(100, Math.round((ach.current / ach.target) * 100));
              const isLast = idx === achievements.length - 1;

              return (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementRow,
                    !isLast && styles.achievementDivider,
                  ]}
                >
                  <View
                    style={[
                      styles.achievementBadgeBase,
                      { backgroundColor: ach.lipColor },
                    ]}
                  >
                    <View
                      style={[
                        styles.achievementBadgeFace,
                        {
                          backgroundColor: ach.color,
                          borderColor: ach.lipColor,
                        },
                      ]}
                    >
                      <View style={styles.achievementGloss} />
                      <Ionicons name={ach.icon} size={27} color={Colors.white} />
                      <Text style={styles.achievementBadgeLevel}>{ach.level}</Text>
                    </View>
                  </View>

                  <View style={styles.achievementBody}>
                    <View style={styles.achievementHeaderRow}>
                      <Text style={styles.achievementTitle}>{ach.title}</Text>
                      <Text style={styles.achievementFraction}>
                        {ach.current}/{ach.target}
                      </Text>
                    </View>
                    <Text style={styles.achievementSubtitle}>{ach.subtitle}</Text>

                    <View style={styles.achProgressTrack}>
                      <View
                        style={[
                          styles.achProgressFill,
                          { width: `${pct}%`, backgroundColor: Colors.gold },
                        ]}
                      >
                        <View style={styles.achProgressHighlight} />
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </Tactile3DBox>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 44,
    gap: 24,
  },
  profileHeaderFace: {
    padding: 18,
    gap: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  displayName: {
    fontFamily: UI_FONT,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
  },
  handleText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  accuracyMeta: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.green,
    marginTop: 2,
  },
  avatarPuckBase: {
    backgroundColor: Colors.violetLip,
    borderRadius: 36,
    paddingBottom: 6,
  },
  avatarPuckFace: {
    width: 72,
    height: 68,
    borderRadius: 36,
    backgroundColor: Colors.violet,
    borderWidth: 2,
    borderColor: Colors.violetLip,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarHighlight: {
    position: 'absolute',
    top: 9,
    left: 13,
    width: 18,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    transform: [{ rotate: '-25deg' }],
  },
  avatarInitials: {
    fontFamily: UI_FONT,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
  },
  flagsSection: {
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    paddingTop: 14,
    gap: 10,
  },
  flagsLabel: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.9,
  },
  flagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  flagChipFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  flagBadgeBase: {
    borderRadius: 6,
    paddingBottom: 2,
  },
  flagBadgeFace: {
    minWidth: 28,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagBadgeText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
  },
  flagName: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  flagCount: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: UI_FONT,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewBox: {
    width: '47%',
    flexGrow: 1,
  },
  overviewCardFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  overviewTextCol: {
    flex: 1,
    gap: 2,
  },
  overviewValue: {
    fontFamily: UI_FONT,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  overviewLabel: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  achievementsCardFace: {
    overflow: 'hidden',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  achievementDivider: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  achievementBadgeBase: {
    borderRadius: 16,
    paddingBottom: 5,
  },
  achievementBadgeFace: {
    width: 68,
    height: 70,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  achievementGloss: {
    position: 'absolute',
    top: 7,
    left: 10,
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '-22deg' }],
  },
  achievementBadgeLevel: {
    fontFamily: UI_FONT,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  achievementBody: {
    flex: 1,
    gap: 6,
  },
  achievementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  achievementTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
  },
  achievementFraction: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  achievementSubtitle: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  achProgressTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.bg,
    overflow: 'hidden',
    marginTop: 4,
  },
  achProgressFill: {
    height: '100%',
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  achProgressHighlight: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
