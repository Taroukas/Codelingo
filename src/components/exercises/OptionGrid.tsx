import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, UI_FONT, MONO } from '@/theme';
import { Tactile3DBox } from '@/components/Tactile3D';

interface OptionGridProps {
  options: readonly string[];
  selectedIndex: number | null;
  correctIndex: number;
  locked: boolean;
  monospace?: boolean;
  onSelect: (index: number) => void;
}

export function OptionGrid({
  options,
  selectedIndex,
  correctIndex,
  locked,
  monospace = false,
  onSelect,
}: OptionGridProps) {
  return (
    <View style={styles.list}>
      {options.map((opt, idx) => {
        const isSelected = selectedIndex === idx;
        const isCorrect = idx === correctIndex;

        let borderColor: string = Colors.border;
        let lipColor: string = Colors.cardLip;
        let bgColor: string = Colors.card;
        let badgeBg: string = Colors.bg;
        let badgeText: string = Colors.textSecondary;

        if (locked) {
          if (isCorrect) {
            borderColor = Colors.green;
            lipColor = Colors.greenLip;
            bgColor = Colors.greenBannerBg;
            badgeBg = Colors.green;
            badgeText = Colors.white;
          } else if (isSelected && !isCorrect) {
            borderColor = Colors.red;
            lipColor = Colors.redLip;
            bgColor = Colors.redBannerBg;
            badgeBg = Colors.red;
            badgeText = Colors.white;
          }
        } else if (isSelected) {
          borderColor = Colors.violet;
          lipColor = Colors.violetLip;
          bgColor = Colors.violetTint;
          badgeBg = Colors.violet;
          badgeText = Colors.white;
        }

        return (
          <Tactile3DBox
            key={idx}
            depth={5}
            borderRadius={16}
            faceColor={bgColor}
            lipColor={lipColor}
            borderColor={borderColor}
            disabled={locked}
            onPress={() => onSelect(idx)}
            faceStyle={styles.cardFace}
          >
            <View style={[styles.indexBadge, { backgroundColor: badgeBg, borderColor }]}>
              <Text style={[styles.indexText, { color: badgeText }]}>{idx + 1}</Text>
            </View>
            <Text style={[styles.optionText, monospace && styles.monoText]}>{opt}</Text>
          </Tactile3DBox>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  cardFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
  },
  indexBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 22,
  },
  monoText: {
    fontFamily: MONO,
    fontSize: 15,
  },
});
