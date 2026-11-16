import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MONO } from '@/theme';

interface MiniTerminalProps {
  lines: string[];
  typewriter?: boolean;
  runKey?: number;
  elapsedLabel?: string;
  exitCode?: number;
}

const LINE_HEIGHT = 19;

/**
 * Matte dark carbon Console Output Card below the Code Playground IDE.
 */
export function MiniTerminal({
  lines,
  typewriter = false,
  runKey = 0,
  elapsedLabel = '0.02s',
  exitCode = 0,
}: MiniTerminalProps) {
  const fullText = lines.join('\n');
  const [charCount, setCharCount] = useState(typewriter ? 0 : fullText.length);

  useEffect(() => {
    if (!typewriter) return;
    let count = 0;
    const timer = setInterval(() => {
      count += 3;
      setCharCount(count);
      if (count >= fullText.length) {
        clearInterval(timer);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [fullText, typewriter, runKey]);

  const displayed = typewriter ? fullText.slice(0, charCount) : fullText;
  const renderedLines = displayed.split('\n');
  const isErrorExit = exitCode !== 0;

  return (
    <View style={styles.consoleCard}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>CONSOLE OUTPUT</Text>

        <View style={styles.exitPill}>
          <View
            style={[styles.statusDot, isErrorExit && styles.statusDotError]}
          />
          <Text style={styles.exitPillText}>
            {`${elapsedLabel} • Exit ${exitCode}`}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        {renderedLines.map((line, idx) => {
          const isCmd = line.startsWith('>');
          const isExit = line.startsWith('Process exited');
          const isErr =
            line.startsWith('Error:') ||
            line.startsWith('[error]') ||
            (isExit && isErrorExit);
          return (
            <Text
              key={idx}
              numberOfLines={1}
              style={[
                styles.line,
                isCmd && styles.cmdLine,
                isExit && !isErrorExit && styles.exitLine,
                isErr && styles.errorLine,
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
  consoleCard: {
    height: 115,
    backgroundColor: '#12111A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLabel: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#94A3B8',
  },
  exitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#181724',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3FB950',
  },
  statusDotError: {
    backgroundColor: '#EF4444',
  },
  exitPillText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
    letterSpacing: -0.2,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  line: {
    fontFamily: MONO,
    fontSize: 13,
    lineHeight: LINE_HEIGHT,
    color: '#FAFAFA',
  },
  cmdLine: {
    color: '#94A3B8',
    fontSize: 12,
  },
  exitLine: {
    color: '#3FB950',
    fontSize: 12,
    fontWeight: '600',
  },
  errorLine: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
});
