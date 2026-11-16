import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, UI_FONT } from '@/theme';

interface TabHeaderProps {
  title: string;
  /** Optional title size override (default 20). */
  titleSize?: number;
  /** Optional bottom hairline override. */
  borderColor?: string;
  /** Optional right-aligned action element (e.g. settings button). */
  rightElement?: React.ReactNode;
}

/**
 * Minimal centred page header shared by the non-Learn tabs.
 * Same 69px rhythm so switching tabs never shifts the content grid.
 */
export function TabHeader({
  title,
  titleSize = 20,
  borderColor = Colors.hairlineSoft,
  rightElement,
}: TabHeaderProps) {
  return (
    <View style={[styles.bar, { borderBottomColor: borderColor }]}>
      <Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={1}>
        {title}
      </Text>
      {rightElement ? (
        <View style={styles.rightSlot}>{rightElement}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 69,
    backgroundColor: Colors.canvas,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    position: 'relative',
  },
  title: {
    fontFamily: UI_FONT,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  rightSlot: {
    position: 'absolute',
    right: 18,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
