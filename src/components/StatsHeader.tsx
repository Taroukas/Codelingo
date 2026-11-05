import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, UI_FONT, MONO } from '@/theme';
import { LANGUAGES, getLanguage } from '@/data/courses';
import { useGame } from '@/store/GameStore';
import { Tactile3DBox } from './Tactile3D';
import { tapHaptic } from '@/utils/haptics';

export function StatsHeader() {
  const {
    activeLang,
    setActiveLang,
    streak,
    gems,
    hearts,
    maxHearts,
    completedNodes,
    refillHearts,
  } = useGame();
  const [sheetOpen, setSheetOpen] = useState(false);
  const currentLang = getLanguage(activeLang);
  const completedInActive = (completedNodes[activeLang] ?? []).length;
  const courseScore = 10 + completedInActive;

  return (
    <>
      <View style={styles.bar}>
        {/* Left Item: Compact Rounded Rectangle Flag + Bold White Course Score */}
        <Pressable
          onPress={() => {
            tapHaptic();
            setSheetOpen(true);
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.langButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View
            style={[
              styles.flagRect,
              { backgroundColor: currentLang.badgeBg },
            ]}
          >
            <Text style={styles.flagRectText}>{currentLang.short}</Text>
          </View>
          <Text style={styles.courseScoreText}>{courseScore}</Text>
        </Pressable>

        {/* Middle Item 1: Streak */}
        <View style={styles.statItem}>
          <Ionicons name="flame" size={22} color={Colors.flame} />
          <Text style={[styles.statValue, { color: Colors.flame }]}>{streak}</Text>
        </View>

        {/* Middle Item 2: Gems */}
        <View style={styles.statItem}>
          <Ionicons name="diamond" size={20} color={Colors.gems} />
          <Text style={[styles.statValue, { color: Colors.gems }]}>{gems}</Text>
        </View>

        {/* Right Item: Hearts (Red #FF4B4B) */}
        <Pressable
          onPress={() => {
            if (hearts < maxHearts) {
              tapHaptic();
              refillHearts();
            }
          }}
          hitSlop={8}
          style={styles.statItem}
        >
          <Ionicons name="heart" size={22} color={Colors.hearts} />
          <Text style={[styles.statValue, { color: Colors.hearts }]}>{hearts}</Text>
        </Pressable>
      </View>

      {/* Course Switcher Bottom Sheet */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>COURSES</Text>
              <Pressable
                onPress={() => {
                  tapHaptic();
                  setSheetOpen(false);
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.courseList}>
              {LANGUAGES.map((lang) => {
                const isSelected = lang.id === activeLang;
                const doneCount = (completedNodes[lang.id] ?? []).length;
                const totalNodes = lang.units.reduce((acc, u) => acc + u.nodes.length, 0);

                return (
                  <Tactile3DBox
                    key={lang.id}
                    depth={4}
                    borderRadius={16}
                    faceColor={isSelected ? Colors.violetTint : Colors.card}
                    lipColor={isSelected ? Colors.violetLip : Colors.cardLip}
                    borderColor={isSelected ? Colors.violet : Colors.border}
                    onPress={() => {
                      setActiveLang(lang.id);
                      setSheetOpen(false);
                    }}
                    faceStyle={styles.courseCardFace}
                  >
                    <View style={[styles.courseFlagBase, { backgroundColor: lang.badgeLip }]}>
                      <View
                        style={[
                          styles.courseFlagFace,
                          {
                            backgroundColor: lang.badgeBg,
                            borderColor: lang.badgeLip,
                          },
                        ]}
                      >
                        <Text style={styles.courseFlagText}>{lang.short}</Text>
                      </View>
                    </View>

                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{lang.name}</Text>
                      <Text style={styles.courseMeta}>
                        {doneCount}/{totalNodes} lessons • {lang.learners}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={styles.activeCheck}>
                        <Ionicons name="checkmark" size={18} color={Colors.white} />
                      </View>
                    ) : null}
                  </Tactile3DBox>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 50,
    backgroundColor: Colors.bg,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  flagRect: {
    width: 38,
    height: 28,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagRectText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  courseScoreText: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  statValue: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '800',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  courseList: {
    gap: 12,
  },
  courseCardFace: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  courseFlagBase: {
    borderRadius: 11,
    paddingBottom: 4,
  },
  courseFlagFace: {
    width: 46,
    height: 34,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseFlagText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  courseInfo: {
    flex: 1,
    gap: 3,
  },
  courseTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
  },
  courseMeta: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
