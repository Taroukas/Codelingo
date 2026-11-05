import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, MONO } from '@/theme';
import { CodeLine } from './CodeLine';

interface IDEWindowProps {
  title?: string;
  lines?: string[];
  children?: React.ReactNode;
}

export function IDEWindow({ title = 'script.py', lines, children }: IDEWindowProps) {
  return (
    <View style={styles.window}>
      <View style={styles.titleBar}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: Colors.red }]} />
          <View style={[styles.dot, { backgroundColor: Colors.gold }]} />
          <View style={[styles.dot, { backgroundColor: Colors.green }]} />
        </View>
        <Text style={styles.filename}>{title}</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.body}>
        {lines
          ? lines.map((line, i) => (
              <View key={i} style={styles.lineRow}>
                <Text style={styles.lineNo}>{i + 1}</Text>
                <View style={styles.lineCode}>
                  <CodeLine code={line} />
                </View>
              </View>
            ))
          : children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  window: {
    backgroundColor: Colors.ideBg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    width: 48,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  filename: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  spacer: {
    width: 48,
  },
  body: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 2,
  },
  lineNo: {
    width: 20,
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: 13,
    color: Colors.textDisabled,
    lineHeight: 20,
  },
  lineCode: {
    flex: 1,
  },
});
