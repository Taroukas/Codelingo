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
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
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
                  <CodeLine code={line} fontSize={12.5} lineHeight={20} />
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
    backgroundColor: Colors.terminal,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    width: 30,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3F3F46',
  },
  filename: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textMuted,
  },
  spacer: {
    width: 30,
  },
  body: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  lineNo: {
    width: 16,
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: 11,
    color: '#3F3F46',
    lineHeight: 20,
  },
  lineCode: {
    flex: 1,
  },
});
