import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Polygon,
  Stop,
} from 'react-native-svg';

export interface HeartIconProps {
  size?: number;
  depleted?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Custom faceted 3-layer Bezier Heart SVG.
 * Never uses flat vector/Ionicons glyphs.
 */
export function HeartIcon({
  size = 20,
  depleted = false,
  style,
}: HeartIconProps) {
  const uniquePrefix = depleted ? 'heart-dep' : 'heart-live';

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient
            id={`${uniquePrefix}-base`}
            x1="0.15"
            y1="0.1"
            x2="0.88"
            y2="0.95"
          >
            <Stop offset="0%" stopColor="#F87171" />
            <Stop offset="42%" stopColor="#EF4444" />
            <Stop offset="100%" stopColor="#DC2626" />
          </LinearGradient>
          <LinearGradient
            id={`${uniquePrefix}-rim`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <Stop offset="0%" stopColor="#FCA5A5" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#991B1B" stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        {depleted ? (
          <>
            {/* Depleted Layer 1: Muted matte slate body */}
            <Path
              d="M12 20.65C11.72 20.65 11.44 20.55 11.21 20.36C6.15 16.06 2.85 12.66 2.85 8.62C2.85 5.62 5.2 3.35 8.12 3.35C9.8 3.35 11.33 4.18 12 5.42C12.67 4.18 14.2 3.35 15.88 3.35C18.8 3.35 21.15 5.62 21.15 8.62C21.15 12.66 17.85 16.06 12.79 20.36C12.56 20.55 12.28 20.65 12 20.65Z"
              fill="#27273A"
              stroke="#3F3F52"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Depleted Layer 2: Subtle lower slate depth shadow */}
            <Path
              d="M12 19.95C16.75 15.9 20.35 12.6 20.35 8.65C20.35 7.45 19.96 6.38 19.28 5.54C19.58 6.38 19.65 7.36 19.38 8.42C18.66 11.34 15.72 14.34 11.48 17.82C11.12 18.12 10.95 18.88 12 19.95Z"
              fill="#1E1E2E"
              opacity={0.75}
            />
            {/* Depleted Layer 3: Muted hairline specular reflection */}
            <Path
              d="M5.45 7.95C5.52 6.45 6.65 5.3 8.15 5.18C8.48 5.15 8.68 5.48 8.42 5.74C7.54 6.6 6.82 7.36 6.36 8.38C6.16 8.82 5.42 8.58 5.45 7.95Z"
              fill="#52526B"
              opacity={0.45}
            />
          </>
        ) : (
          <>
            {/* Layer 1: Rich ruby-crimson base silhouette */}
            <Path
              d="M12 20.8C11.71 20.8 11.42 20.7 11.19 20.5C6.06 16.14 2.7 12.68 2.7 8.58C2.7 5.53 5.09 3.2 8.06 3.2C9.78 3.2 11.33 4.04 12 5.31C12.67 4.04 14.22 3.2 15.94 3.2C18.91 3.2 21.3 5.53 21.3 8.58C21.3 12.68 17.94 16.14 12.81 20.5C12.58 20.7 12.29 20.8 12 20.8Z"
              fill={`url(#${uniquePrefix}-base)`}
              stroke="#B91C1C"
              strokeWidth="0.65"
              strokeLinejoin="round"
            />
            {/* Layer 2: Deeper lower-right warm shading curve for 3D volume */}
            <Path
              d="M12 20.2C17.16 15.88 20.68 12.48 20.68 8.62C20.68 6.9 19.9 5.42 18.68 4.46C19.32 5.58 19.5 6.95 19.12 8.45C18.24 11.96 15.16 14.95 10.65 18.42C11.08 19.12 11.54 19.72 12 20.2Z"
              fill="#B91C1C"
              opacity={0.78}
            />
            {/* Subtle inner shadow pocket under cleft */}
            <Path
              d="M12 5.45C12.7 4.4 13.78 3.68 15.05 3.42C13.95 3.92 13.02 4.82 12.38 6.08C12.22 6.39 11.78 6.38 11.64 6.06C11.42 5.56 11.68 5.9 12 5.45Z"
              fill="#991B1B"
              opacity={0.42}
            />
            {/* Layer 3: Top-left curved glass specular highlight */}
            <Path
              d="M4.92 8.32C4.95 6.42 6.32 4.88 8.28 4.74C8.72 4.71 8.95 5.18 8.58 5.48C7.42 6.42 6.6 7.36 6.06 8.68C5.85 9.2 4.91 8.98 4.92 8.32Z"
              fill="#FCA5A5"
              opacity={0.75}
            />
            {/* Secondary pinpoint specular sparkle on upper-left lobe */}
            <Path
              d="M6.42 5.44C6.88 5.18 7.42 5.05 7.98 5.05C8.22 5.05 8.28 5.36 8.05 5.48C7.54 5.74 7.05 6.02 6.62 6.38C6.34 6.6 5.98 5.7 6.42 5.44Z"
              fill="#FFFFFF"
              opacity={0.82}
            />
          </>
        )}
      </Svg>
    </View>
  );
}

export interface GemIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Custom 3D-faceted vector crystal / diamond with 6 distinct geometric polygon facets
 * plus a crisp white sparkle glint on the top-right edge.
 */
export function GemIcon({ size = 20, style }: GemIconProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Outer bevel crisp crystal contour */}
        <Polygon
          points="7.2,3.4 16.8,3.4 21.6,9.2 12,21.2 2.4,9.2"
          fill="#0369A1"
        />

        {/* Facet 1: Top horizontal crown table (#E0F2FE ice-cyan) */}
        <Polygon points="7.5,3.8 16.5,3.8 15.1,9.0 8.9,9.0" fill="#E0F2FE" />

        {/* Facet 2: Upper-left crown bevel (#7DD3FC) */}
        <Polygon points="7.3,3.8 8.9,9.0 2.9,9.0" fill="#7DD3FC" />

        {/* Facet 3: Upper-right crown bevel (#38BDF8) */}
        <Polygon points="16.7,3.8 21.1,9.0 15.1,9.0" fill="#38BDF8" />

        {/* Facet 4: Lower-left pavilion facet (#0EA5E9) */}
        <Polygon points="2.9,9.2 8.8,9.2 11.8,20.5" fill="#0EA5E9" />

        {/* Facet 5: Center deep sapphire pavilion facet (#0284C7) */}
        <Polygon points="8.9,9.2 15.1,9.2 12.0,20.7" fill="#0284C7" />

        {/* Facet 6: Lower-right royal sapphire shadow facet (#0369A1) */}
        <Polygon points="15.2,9.2 21.1,9.2 12.2,20.5" fill="#0369A1" />

        {/* Inner crisp facet catchlight along top-left table seam */}
        <Polygon
          points="7.5,3.8 12.1,3.8 10.6,6.1 8.4,6.1"
          fill="#FFFFFF"
          opacity={0.45}
        />

        {/* Crisp white 4-point sparkle glint on the top-right edge */}
        <Path
          d="M18.3 2.1L18.78 3.52L20.2 4.0L18.78 4.48L18.3 5.9L17.82 4.48L16.4 4.0L17.82 3.52Z"
          fill="#FFFFFF"
          opacity={0.96}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
