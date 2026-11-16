import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LangId } from '@/data/courses';
import { MONO, UI_FONT } from '@/theme';

export interface LanguageLogoProps {
  language?: LangId | string;
  lang?: LangId | string;
  size?: number;
  color?: string;
}

/**
 * Reusable official colored brand logos for Python, C++, JavaScript, and Go.
 * Uses pure vector layers and crisp typography so it works 100% natively in Expo Go.
 */
export function LanguageLogo({
  language,
  lang,
  size = 18,
}: LanguageLogoProps) {
  const resolved = (language ?? lang ?? 'python') as LangId | string;
  const s = size;

  switch (resolved) {
    case 'python': {
      // Official two-tone Python logo: top-left snake in #3776AB blue,
      // bottom-right snake in #FFD43B yellow via exact staircase region clipping.
      const topClipW = Math.round(s * 0.74);
      const topClipH = Math.round(s * 0.51);
      const leftClipW = Math.round(s * 0.28);
      const leftClipH = Math.round(s * 0.74);

      return (
        <View style={[styles.box, { width: s, height: s }]}>
          {/* Base layer: Bottom-right snake in official Python yellow */}
          <View style={[styles.layerCenter, { width: s, height: s }]}>
            <FontAwesome5 name="python" size={s} color="#FFD43B" />
          </View>

          {/* Top-left snake head & body in official Python blue (#3776AB) */}
          <View
            style={[
              styles.clipBox,
              { width: topClipW, height: topClipH },
            ]}
          >
            <View style={[styles.layerCenter, { width: s, height: s }]}>
              <FontAwesome5 name="python" size={s} color="#3776AB" />
            </View>
          </View>

          {/* Left-hanging tail of the blue snake (#3776AB) */}
          <View
            style={[
              styles.clipBox,
              { width: leftClipW, height: leftClipH },
            ]}
          >
            <View style={[styles.layerCenter, { width: s, height: s }]}>
              <FontAwesome5 name="python" size={s} color="#3776AB" />
            </View>
          </View>
        </View>
      );
    }

    case 'cpp': {
      // Official #00599C / #659AD2 two-tone blue hexagon C++ emblem
      const hexSize = s + 2;
      const halfH = Math.round(hexSize * 0.5);
      const fontSize = Math.max(6.5, Math.round(s * 0.39));

      return (
        <View style={[styles.box, { width: hexSize, height: hexSize }]}>
          <View style={[styles.layerCenter, { width: hexSize, height: hexSize }]}>
            <MaterialCommunityIcons
              name="hexagon"
              size={hexSize}
              color="#00599C"
            />
          </View>

          <View
            style={[
              styles.clipBox,
              { width: hexSize, height: halfH },
            ]}
          >
            <View style={[styles.layerCenter, { width: hexSize, height: hexSize }]}>
              <MaterialCommunityIcons
                name="hexagon"
                size={hexSize}
                color="#659AD2"
              />
            </View>
          </View>

          <Text
            style={[
              styles.cppText,
              { fontSize, lineHeight: fontSize + 2 },
            ]}
          >
            C++
          </Text>
        </View>
      );
    }

    case 'js': {
      // Official #F7DF1E bright yellow rounded square badge with dark #000000 "JS" lettering
      const radius = Math.max(3, Math.round(s * 0.22));
      const fontSize = Math.max(8, Math.round(s * 0.52));

      return (
        <View
          style={[
            styles.jsBadge,
            {
              width: s,
              height: s,
              borderRadius: radius,
              paddingRight: Math.max(1.5, Math.round(s * 0.08)),
              paddingBottom: Math.max(1, Math.round(s * 0.06)),
            },
          ]}
        >
          <Text
            style={[
              styles.jsText,
              { fontSize, lineHeight: fontSize + 1 },
            ]}
          >
            JS
          </Text>
        </View>
      );
    }

    case 'go': {
      // Official #00ADD8 bright cyan Go badge
      const w = s + 2;
      const h = Math.max(13, Math.round(s * 0.82));
      const radius = Math.max(4, Math.round(h * 0.32));
      const fontSize = Math.max(7.5, Math.round(s * 0.44));

      return (
        <View
          style={[
            styles.goBadge,
            {
              width: w,
              height: h,
              borderRadius: radius,
            },
          ]}
        >
          <Text
            style={[
              styles.goText,
              { fontSize, lineHeight: fontSize + 1 },
            ]}
          >
            GO
          </Text>
        </View>
      );
    }

    case 'java': {
      // Official two-tone Java emblem: crimson/orange steam above #5382A1 blue coffee cup.
      const steamH = Math.round(s * 0.46);
      const iconS = Math.round(s * 0.96);

      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <View style={[styles.layerCenter, { width: s, height: s }]}>
            <FontAwesome5 name="java" size={iconS} color="#5382A1" />
          </View>
          <View style={[styles.clipBox, { width: s, height: steamH }]}>
            <View style={[styles.layerCenter, { width: s, height: s }]}>
              <FontAwesome5 name="java" size={iconS} color="#F89820" />
            </View>
          </View>
        </View>
      );
    }

    case 'rust': {
      // Official #F74C00 vibrant Rust gear emblem with cutout R.
      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <FontAwesome5 name="rust" size={s} color="#F74C00" />
        </View>
      );
    }

    case 'sql': {
      // Two-tone stacked cylinder emblem in official PostgreSQL / SQL sky-blue.
      const topH = Math.round(s * 0.44);

      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <View style={[styles.layerCenter, { width: s, height: s }]}>
            <MaterialCommunityIcons
              name="database"
              size={s}
              color="#0284C7"
            />
          </View>
          <View style={[styles.clipBox, { width: s, height: topH }]}>
            <View style={[styles.layerCenter, { width: s, height: s }]}>
              <MaterialCommunityIcons
                name="database"
                size={s}
                color="#38BDF8"
              />
            </View>
          </View>
        </View>
      );
    }

    case 'c': {
      // Classic C language indigo-blue hexagon badge matching C++ geometry.
      const hexSize = s + 2;
      const halfH = Math.round(hexSize * 0.5);
      const fontSize = Math.max(8, Math.round(s * 0.52));

      return (
        <View style={[styles.box, { width: hexSize, height: hexSize }]}>
          <View style={[styles.layerCenter, { width: hexSize, height: hexSize }]}>
            <MaterialCommunityIcons
              name="hexagon"
              size={hexSize}
              color="#283593"
            />
          </View>

          <View
            style={[
              styles.clipBox,
              { width: hexSize, height: halfH },
            ]}
          >
            <View style={[styles.layerCenter, { width: hexSize, height: hexSize }]}>
              <MaterialCommunityIcons
                name="hexagon"
                size={hexSize}
                color="#5C6BC0"
              />
            </View>
          </View>

          <Text
            style={[
              styles.cText,
              { fontSize, lineHeight: fontSize + 2 },
            ]}
          >
            C
          </Text>
        </View>
      );
    }

    case 'ts': {
      // Official #3178C6 TypeScript rounded square with white bottom-right "TS" lettering.
      const radius = Math.max(3, Math.round(s * 0.22));
      const fontSize = Math.max(8, Math.round(s * 0.50));

      return (
        <View
          style={[
            styles.tsBadge,
            {
              width: s,
              height: s,
              borderRadius: radius,
              paddingRight: Math.max(1.5, Math.round(s * 0.08)),
              paddingBottom: Math.max(1, Math.round(s * 0.06)),
            },
          ]}
        >
          <Text
            style={[
              styles.tsText,
              { fontSize, lineHeight: fontSize + 1 },
            ]}
          >
            TS
          </Text>
        </View>
      );
    }

    case 'css': {
      // Official CSS3 #2965F1 / #264DE4 blue shield emblem.
      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <MaterialCommunityIcons
            name="language-css3"
            size={s}
            color="#38BDF8"
          />
        </View>
      );
    }

    case 'html': {
      // Official HTML5 #E34F26 vibrant orange shield emblem.
      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <MaterialCommunityIcons
            name="language-html5"
            size={s}
            color="#E34F26"
          />
        </View>
      );
    }

    case 'php': {
      // Official PHP indigo-violet oval badge (#777BB4) with crisp italic lettering.
      const w = Math.round(s * 1.18);
      const h = Math.max(12, Math.round(s * 0.72));
      const fontSize = Math.max(6.5, Math.round(s * 0.38));

      return (
        <View
          style={[
            styles.phpBadge,
            {
              width: w,
              height: h,
              borderRadius: h / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.phpText,
              { fontSize, lineHeight: fontSize + 1 },
            ]}
          >
            php
          </Text>
        </View>
      );
    }

    case 'asm': {
      // Crisp silicon microchip emblem for low-level Assembly registers & instructions.
      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <MaterialCommunityIcons
            name="cpu-64-bit"
            size={s}
            color="#10B981"
          />
        </View>
      );
    }

    case 'swift': {
      // Official #F05138 Swift bird silhouette emblem.
      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <FontAwesome5 name="swift" size={Math.round(s * 0.94)} color="#F05138" />
        </View>
      );
    }

    case 'kotlin': {
      // Official two-tone Kotlin emblem (#E44857 coral over #7F52FF violet).
      const halfH = Math.round(s * 0.48);

      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <View style={[styles.layerCenter, { width: s, height: s }]}>
            <MaterialCommunityIcons
              name="language-kotlin"
              size={Math.round(s * 0.92)}
              color="#7F52FF"
            />
          </View>
          <View style={[styles.clipBox, { width: s, height: halfH }]}>
            <View style={[styles.layerCenter, { width: s, height: s }]}>
              <MaterialCommunityIcons
                name="language-kotlin"
                size={Math.round(s * 0.92)}
                color="#F97316"
              />
            </View>
          </View>
        </View>
      );
    }

    case 'julia': {
      // Official 3-dot Julia triad: top green (#389826), left red (#CB3C33), right purple (#9558B2).
      const dot = Math.max(5, Math.round(s * 0.42));
      const pad = Math.max(0.5, Math.round(s * 0.04));

      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <View
            style={{
              position: 'absolute',
              top: pad,
              left: (s - dot) / 2,
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: '#389826',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: pad,
              left: pad,
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: '#CB3C33',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: pad,
              right: pad,
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: '#9558B2',
            }}
          />
        </View>
      );
    }

    case 'lua': {
      // Iconic Lua moon-in-orbit vector emblem (#3B82F6 / #60A5FA).
      return (
        <View style={[styles.box, { width: s, height: s }]}>
          <MaterialCommunityIcons
            name="language-lua"
            size={s}
            color="#60A5FA"
          />
        </View>
      );
    }

    case 'csharp': {
      // Official #512BD4 / #9B4F96 two-tone C# hexagon matching C++ & C badges.
      const hexSize = s + 2;
      const halfH = Math.round(hexSize * 0.5);
      const fontSize = Math.max(7, Math.round(s * 0.44));

      return (
        <View style={[styles.box, { width: hexSize, height: hexSize }]}>
          <View style={[styles.layerCenter, { width: hexSize, height: hexSize }]}>
            <MaterialCommunityIcons
              name="hexagon"
              size={hexSize}
              color="#512BD4"
            />
          </View>

          <View
            style={[
              styles.clipBox,
              { width: hexSize, height: halfH },
            ]}
          >
            <View style={[styles.layerCenter, { width: hexSize, height: hexSize }]}>
              <MaterialCommunityIcons
                name="hexagon"
                size={hexSize}
                color="#8B5CF6"
              />
            </View>
          </View>

          <Text
            style={[
              styles.cText,
              { fontSize, lineHeight: fontSize + 2 },
            ]}
          >
            C#
          </Text>
        </View>
      );
    }

    default:
      return (
        <MaterialCommunityIcons
          name="code-tags"
          size={s}
          color="#38BDF8"
        />
      );
  }
}

const styles = StyleSheet.create({
  box: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  cppText: {
    fontFamily: MONO,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  cText: {
    fontFamily: MONO,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  jsBadge: {
    backgroundColor: '#F7DF1E',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  jsText: {
    fontFamily: UI_FONT,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  tsBadge: {
    backgroundColor: '#3178C6',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  tsText: {
    fontFamily: UI_FONT,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  phpBadge: {
    backgroundColor: '#777BB4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  phpText: {
    fontFamily: UI_FONT,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  goBadge: {
    backgroundColor: '#00ADD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goText: {
    fontFamily: MONO,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});
