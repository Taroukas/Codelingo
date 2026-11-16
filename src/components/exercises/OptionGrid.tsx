import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, UI_FONT, MONO } from '@/theme';
import { SpringPressable } from '@/components/CyberButton';

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

        let borderColor: string = Colors.hairline;
        let bgColor: string = Colors.control;
        let badgeBg: string = Colors.controlActive;
        let badgeBorder: string = Colors.hairline;
        let badgeText: string = Colors.textSecondary;
        let textColor: string = Colors.textPrimary;

        if (locked) {
          if (isCorrect) {
            borderColor = Colors.greenBannerBorder;
            bgColor = Colors.greenBannerBg;
            badgeBg = Colors.success;
            badgeBorder = Colors.success;
            badgeText = '#0A0A0C';
            textColor = Colors.textPrimary;
          } else if (isSelected && !isCorrect) {
            borderColor = Colors.redBannerBorder;
            bgColor = Colors.redBannerBg;
            badgeBg = Colors.danger;
            badgeBorder = Colors.danger;
            badgeText = '#0A0A0C';
            textColor = Colors.textPrimary;
          }
        } else if (isSelected) {
          borderColor = Colors.hairlineStrong;
          bgColor = Colors.controlActive;
          badgeBg = Colors.accent;
          badgeBorder = 'rgba(255, 255, 255, 0.16)';
          badgeText = '#FFFFFF';
        }

        return (
          <SpringPressable
            key={idx}
            disabled={locked}
            haptic="selection"
            pressScale={0.98}
            onPress={() => onSelect(idx)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: locked }}
            style={[
              styles.card,
              { backgroundColor: bgColor, borderColor },
            ]}
          >
            <View
              style={[
                styles.indexBadge,
                { backgroundColor: badgeBg, borderColor: badgeBorder },
              ]}
            >
              <Text style={[styles.indexText, { color: badgeText }]}>
                {idx + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.optionText,
                { color: textColor },
                monospace && styles.monoText,
              ]}
            >
              {opt}
            </Text>
          </SpringPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 9,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderBottomColor: '#0C0B14',
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  optionText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  monoText: {
    fontFamily: MONO,
    fontSize: 12.5,
    letterSpacing: -0.1,
  },
});
