import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, UI_FONT, MONO } from '@/theme';
import { RIVAL_CODERS, RivalCoder } from '@/data/leaderboard';
import { getLanguage } from '@/data/courses';
import { useGame } from '@/store/GameStore';
import { StatsHeader } from '@/components/StatsHeader';
import { Tactile3DBox } from '@/components/Tactile3D';

const PROMOTION_CUTOFF = 7;

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { xp, activeLang } = useGame();
  const currentLang = getLanguage(activeLang);

  const standings = useMemo<RivalCoder[]>(() => {
    const userRow: RivalCoder = {
      id: 'you',
      name: 'You (Alex Dev)',
      initials: 'AD',
      xp,
      avatarBg: Colors.green,
      avatarLip: Colors.greenLip,
      langBadge: currentLang.short,
      isUser: true,
    };
    return [...RIVAL_CODERS, userRow].sort((a, b) => b.xp - a.xp);
  }, [xp, currentLang.short]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatsHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Duolingo 2-Layer 3D League Header */}
        <Tactile3DBox
          depth={5}
          borderRadius={20}
          faceColor={Colors.card}
          lipColor={Colors.cardLip}
          borderColor={Colors.border}
          faceStyle={styles.leagueHeaderFace}
        >
          <View style={styles.shieldBadgeBase}>
            <View style={styles.shieldBadgeFace}>
              <View style={styles.shieldHighlight} />
              <Ionicons name="shield" size={44} color={Colors.white} />
            </View>
          </View>

          <Text style={styles.leagueTitle}>Amethyst League</Text>
          <Text style={styles.leagueSubtitle}>
            Top {PROMOTION_CUTOFF} advance to the Pearl League
          </Text>

          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={16} color={Colors.gold} />
            <Text style={styles.timerBadgeText}>4 days left</Text>
          </View>
        </Tactile3DBox>

        {/* Standings List (12 Coders) */}
        <View style={styles.listContainer}>
          {standings.map((coder, index) => {
            const rank = index + 1;
            const isTop1 = rank === 1;
            const isTop2 = rank === 2;
            const isTop3 = rank === 3;

            const medalBg = isTop1
              ? Colors.gold
              : isTop2
              ? Colors.silver
              : isTop3
              ? Colors.bronze
              : undefined;
            const medalLip = isTop1
              ? Colors.goldLip
              : isTop2
              ? Colors.silverLip
              : isTop3
              ? Colors.bronzeLip
              : undefined;

            return (
              <React.Fragment key={coder.id}>
                <Tactile3DBox
                  depth={4}
                  borderRadius={16}
                  faceColor={coder.isUser ? Colors.violetTint : Colors.card}
                  lipColor={coder.isUser ? Colors.violetLip : Colors.cardLip}
                  borderColor={coder.isUser ? Colors.violet : Colors.border}
                  faceStyle={styles.coderRowFace}
                >
                  {/* Rank / 2-Layer 3D Metallic Podium Badge */}
                  <View style={styles.rankCol}>
                    {medalBg && medalLip ? (
                      <View style={[styles.podiumBadgeBase, { backgroundColor: medalLip }]}>
                        <View
                          style={[
                            styles.podiumBadgeFace,
                            { backgroundColor: medalBg, borderColor: medalLip },
                          ]}
                        >
                          <View style={styles.podiumShine} />
                          <Text
                            style={[
                              styles.podiumRankText,
                              (isTop1 || isTop2) && { color: Colors.bg },
                            ]}
                          >
                            {rank}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.rankText,
                          rank <= PROMOTION_CUTOFF && { color: Colors.green },
                        ]}
                      >
                        {rank}
                      </Text>
                    )}
                  </View>

                  {/* 2-Layer 3D Avatar */}
                  <View style={[styles.avatarBase, { backgroundColor: coder.avatarLip }]}>
                    <View
                      style={[
                        styles.avatarFace,
                        {
                          backgroundColor: coder.avatarBg,
                          borderColor: coder.avatarLip,
                        },
                      ]}
                    >
                      <Text style={styles.avatarInitials}>{coder.initials}</Text>
                    </View>
                  </View>

                  {/* Name & Course Tag */}
                  <View style={styles.nameCol}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          styles.coderName,
                          coder.isUser && { color: Colors.violet },
                        ]}
                        numberOfLines={1}
                      >
                        {coder.name}
                      </Text>
                      <View style={styles.langMiniPill}>
                        <Text style={styles.langMiniPillText}>{coder.langBadge}</Text>
                      </View>
                    </View>
                  </View>

                  {/* XP Score */}
                  <Text
                    style={[
                      styles.xpValue,
                      coder.isUser && { color: Colors.white },
                    ]}
                  >
                    {coder.xp} XP
                  </Text>
                </Tactile3DBox>

                {/* Iconic Duolingo Green Promotion Zone Divider Row right below rank #7 */}
                {rank === PROMOTION_CUTOFF ? (
                  <View style={styles.promotionZoneBanner}>
                    <View style={styles.promotionLine} />
                    <View style={styles.promotionPill}>
                      <Text style={styles.promotionLabel}>▲ PROMOTION ZONE ▲</Text>
                    </View>
                    <View style={styles.promotionLine} />
                  </View>
                ) : null}
              </React.Fragment>
            );
          })}
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
    gap: 20,
  },
  leagueHeaderFace: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    gap: 8,
  },
  shieldBadgeBase: {
    backgroundColor: Colors.violetLip,
    borderRadius: 24,
    paddingBottom: 6,
    marginBottom: 4,
  },
  shieldBadgeFace: {
    width: 82,
    height: 76,
    borderRadius: 24,
    backgroundColor: Colors.violet,
    borderWidth: 2,
    borderColor: Colors.violetLip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldHighlight: {
    position: 'absolute',
    top: 8,
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  leagueTitle: {
    fontFamily: UI_FONT,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
  },
  leagueSubtitle: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  timerBadgeText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listContainer: {
    gap: 10,
  },
  coderRowFace: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rankCol: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumBadgeBase: {
    borderRadius: 10,
    paddingBottom: 4,
  },
  podiumBadgeFace: {
    width: 32,
    height: 28,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  podiumShine: {
    position: 'absolute',
    top: 3,
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  podiumRankText: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  rankText: {
    fontFamily: MONO,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  avatarBase: {
    borderRadius: 21,
    paddingBottom: 4,
  },
  avatarFace: {
    width: 42,
    height: 39,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  nameCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coderName: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    flexShrink: 1,
  },
  langMiniPill: {
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  langMiniPillText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  xpValue: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  promotionZoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  promotionLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.green,
    opacity: 0.65,
  },
  promotionPill: {
    backgroundColor: Colors.greenBannerBg,
    borderWidth: 2,
    borderColor: Colors.greenBannerBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  promotionLabel: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.green,
    letterSpacing: 1.1,
  },
});
