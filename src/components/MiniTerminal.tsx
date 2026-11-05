import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, MONO } from '@/theme';

interface MiniTerminalProps {
  lines: string[];
  typewriter?: boolean;
  runKey?: number;
}

export function MiniTerminal({ lines, typewriter = false, runKey = 0 }: MiniTerminalProps) {
  const fullText = lines.join('\n');
  const [displayed, setDisplayed] = useState(typewriter ? '' : fullText);

  useEffect(() => {
    if (!typewriter) {
      setDisplayed(fullText);
      return;
    }
    setDisplayed('');
    let idx = 0;
    const timer = setInterval(() => {
      idx += 2;
      if (idx >= fullText.length) {
        setDisplayed(fullText);
        clearInterval(timer);
      } else {
        setDisplayed(fullText.slice(0, idx));
      }
    }, 18);
    return () => clearInterval(timer);
  }, [fullText, typewriter, runKey]);

  const renderedLines = displayed.split('\n');

  return (
    <View style={styles.terminal}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>CONSOLE OUTPUT</Text>
      </View>
      <View style={styles.body}>
        {renderedLines.map((line, idx) => {
          const isCmd = line.startsWith('>');
          const isExit = line.startsWith('Process exited');
          return (
            <Text
              key={idx}
              style={[
                styles.line,
                isCmd && { color: Colors.textSecondary },
                isExit && { color: Colors.green },
              ]}
            >
              {line}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  terminal: {
    backgroundColor: Colors.ideBg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.card,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  headerLabel: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  line: {
    fontFamily: MONO,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.white,
  },
});
