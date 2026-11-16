import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
} from 'react-native';

export interface RichCodeTextProps extends Omit<TextProps, 'children'> {
  text: string;
  style?: StyleProp<TextStyle>;
  codeStyle?: StyleProp<TextStyle>;
}

const CODE_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/**
 * Parses inline backtick-wrapped segments (e.g. `` `print()` ``) and renders
 * each token inside an electric lavender monospace inline pill with zero raw backticks.
 */
export function RichCodeText({
  text,
  style,
  codeStyle,
  ...rest
}: RichCodeTextProps) {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <Text style={style} {...rest}>
      {parts.map((part, idx) => {
        if (part.length >= 2 && part.startsWith('`') && part.endsWith('`')) {
          const token = part.slice(1, -1);
          return (
            <Text key={idx} style={[styles.codePill, codeStyle]}>
              {`\u00A0${token}\u00A0`}
            </Text>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  codePill: {
    fontFamily: CODE_FONT,
    fontWeight: '800',
    color: '#DDD6FE',
    backgroundColor: 'rgba(124, 92, 252, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
