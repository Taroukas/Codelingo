import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Pattern,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GemIcon, HeartIcon } from '@/components/ui/CurrencyIcons';
import { LANGUAGES, LangId } from '@/data/courses';
import {
  BUG_CAMPAIGN_BUGS_PER_LEVEL,
  BUG_CAMPAIGN_MAX_STARS,
  BUG_CAMPAIGN_SECTORS,
  BUG_CAMPAIGN_STAR_THRESHOLDS,
  getBugCampaignLevels,
} from '@/data/bugCampaign';
import {
  SYNTAX_SPRINT_SECTORS,
  getSyntaxSprintLevels,
} from '@/data/syntaxSprintCampaign';
import {
  GIT_CAMPAIGN_SECTORS,
  getGitCampaignLevels,
} from '@/data/gitCampaign';
import {
  ROBOT_MAZE_SECTORS,
  getRobotMazeLevels,
} from '@/data/robotMazeCampaign';
import {
  BugCampaignProgress,
  GitSimProgress,
  NodeStatus,
  RobotMazeProgress,
  getBugLanguageStars,
  getBugLevelStatus,
  getGitSimLevelStatus,
  getGitSimTotalStars,
  getRobotMazeLevelStatus,
  getRobotMazeTotalStars,
  getSyntaxSprintLanguageStars,
  getSyntaxSprintLevelStatus,
} from '@/store/GameStore';
import { LanguageLogo } from '@/components/LanguageLogo';
import { DUO_NODE_HEIGHT, Tactile3DNode } from '@/components/Tactile3D';
import { MONO, UI_FONT } from '@/theme';
import { mediumHaptic, selectionHaptic, tapHaptic } from '@/utils/haptics';
import { playSound } from '@/utils/sounds';

const PCB_BG = '#090810';
const VIOLET = '#7C5CFC';
const GOLD = '#FBBF24';
const STAR_EMPTY = '#27273A';
const CORAL = '#F85149';
const EMERALD = '#34D399';
const CYAN = '#38BDF8';

const SECTOR_HEADER_H = 44;
const SECTOR_TOP_GAP = 26;
const ROW_STEP = 118;
const BOSS_ROW_STEP = 126;
const SECTOR_GAP = 46;
const TOP_CANVAS_PAD = 22;
const BOTTOM_CANVAS_PAD = 185;
const POPOVER_W = 252;

const PRIORITY_LANG_ORDER: LangId[] = [
  'python',
  'cpp',
  'js',
  'go',
  'asm',
  'java',
  'rust',
  'ts',
  'c',
  'sql',
  'csharp',
  'swift',
  'kotlin',
  'php',
  'html',
  'css',
  'julia',
  'lua',
];

const SHORT_LANG_NAME: Record<LangId, string> = {
  python: 'Python',
  cpp: 'C++',
  js: 'JS',
  go: 'Go',
  asm: 'Assembly',
  java: 'Java',
  rust: 'Rust',
  sql: 'SQL',
  c: 'C',
  ts: 'TS',
  css: 'CSS',
  html: 'HTML',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  julia: 'Julia',
  lua: 'Lua',
  csharp: 'C#',
};

export type CampaignKind =
  | 'bug_hunt'
  | 'syntax_sprint'
  | 'git_sim'
  | 'robot_maze';

interface UnifiedMapLevel {
  levelNumber: number;
  sector: 1 | 2 | 3;
  title: string;
  isBoss: boolean;
  chipBadge: string;
  targetLabel: string;
}

interface NodeCoord {
  level: UnifiedMapLevel;
  x: number;
  y: number;
  col: 0 | 1 | 2;
}

interface SectorLayout {
  sector: 1 | 2 | 3;
  title: string;
  bannerTop: number;
}

export interface BugCampaignMapProps {
  campaignKind?: CampaignKind;
  lang: LangId;
  onChangeLang: (lang: LangId) => void;
  progress: BugCampaignProgress;
  gitProgress?: GitSimProgress;
  robotProgress?: RobotMazeProgress;
  onSelectLevel: (levelNumber: number) => void;
  onBack: () => void;
  bottomInset?: number;
  isRecoveryMode?: boolean;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/* ------------------------------------------------------------------ */
/*  Path Connector Builders (1 per game theme)                         */
/* ------------------------------------------------------------------ */

/** Theme 1 (Bug Hunt): Orthogonal 45°/90° PCB copper traces + via pads. */
function buildOrthogonalPcbPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { d: string; via1: { x: number; y: number }; via2: { x: number; y: number } } {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (Math.abs(dy) < 4) {
    const dir = dx >= 0 ? 1 : -1;
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      via1: { x: x1 + dir * 44, y: y1 },
      via2: { x: x2 - dir * 44, y: y2 },
    };
  }

  if (Math.abs(dx) < 4) {
    const midY = (y1 + y2) / 2;
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      via1: { x: x1, y: y1 + (midY - y1) * 0.45 },
      via2: { x: x2, y: y2 - (y2 - midY) * 0.45 },
    };
  }

  const dirX = dx > 0 ? 1 : -1;
  const chamfer = Math.min(16, Math.abs(dx) * 0.25, Math.abs(dy) * 0.28);
  const midY = y1 + dy * 0.48;
  const d = [
    `M ${x1} ${y1}`,
    `L ${x1} ${midY - chamfer}`,
    `L ${x1 + dirX * chamfer} ${midY}`,
    `L ${x2 - dirX * chamfer} ${midY}`,
    `L ${x2} ${midY + chamfer}`,
    `L ${x2} ${y2}`,
  ].join(' ');

  return {
    d,
    via1: { x: x1 + dirX * chamfer, y: midY },
    via2: { x: x2 - dirX * chamfer, y: midY },
  };
}

/** Theme 2 (Syntax Sprint): Smooth aerodynamic racing-chicane curves. */
function buildChicaneTrackPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  idx: number,
): { d: string; apex: { x: number; y: number } } {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (Math.abs(dy) < 4) {
    const dir = idx % 2 === 0 ? -1 : 1;
    const midX = (x1 + x2) / 2;
    const archY = y1 + dir * 13;
    return {
      d: `M ${x1} ${y1} C ${x1 + dx * 0.34} ${archY}, ${x2 - dx * 0.34} ${archY}, ${x2} ${y2}`,
      apex: { x: midX, y: archY * 0.75 + y1 * 0.25 },
    };
  }

  const midY = y1 + dy * 0.5;
  const sweepBias = Math.abs(dx) < 4 ? (idx % 2 === 0 ? 28 : -28) : 0;
  const c1x = x1 + sweepBias;
  const c2x = x2 - sweepBias;
  return {
    d: `M ${x1} ${y1} C ${c1x} ${y1 + dy * 0.56}, ${c2x} ${y1 + dy * 0.44}, ${x2} ${y2}`,
    apex: { x: (x1 + x2) / 2, y: midY },
  };
}

/** Theme 3 (Git Simulator): Authentic Git Branch & Merge cubic Bezier curves. */
function buildGitBranchBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  idx: number,
): { d: string; mid: { x: number; y: number } } {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (Math.abs(dy) < 4) {
    const swing = (idx % 2 === 0 ? -1 : 1) * 16;
    const midX = (x1 + x2) / 2;
    return {
      d: `M ${x1} ${y1} C ${x1 + dx * 0.28} ${y1 + swing}, ${x2 - dx * 0.28} ${y1 + swing}, ${x2} ${y2}`,
      mid: { x: midX, y: y1 + swing * 0.75 },
    };
  }

  if (Math.abs(dx) < 4) {
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      mid: { x: x1, y: (y1 + y2) / 2 },
    };
  }

  return {
    d: `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.64}, ${x2} ${y1 + dy * 0.36}, ${x2} ${y2}`,
    mid: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 },
  };
}

/** Theme 4 (Robot Maze): Strictly orthogonal 90° grid path with rounded 12px corners. */
function buildRoundedMazeOrthogonalPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cornerRadius = 12,
): { d: string; corner1: { x: number; y: number }; corner2: { x: number; y: number } } {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (Math.abs(dy) < 4) {
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      corner1: { x: x1 + dx * 0.5, y: y1 },
      corner2: { x: x1 + dx * 0.5, y: y1 },
    };
  }

  if (Math.abs(dx) < 4) {
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      corner1: { x: x1, y: y1 + dy * 0.5 },
      corner2: { x: x2, y: y1 + dy * 0.5 },
    };
  }

  const dirX = dx > 0 ? 1 : -1;
  const dirY = dy > 0 ? 1 : -1;
  const r = Math.min(cornerRadius, Math.abs(dx) * 0.42, Math.abs(dy) * 0.28);
  const midY = y1 + dy * 0.5;

  const d = [
    `M ${x1} ${y1}`,
    `L ${x1} ${midY - dirY * r}`,
    `Q ${x1} ${midY} ${x1 + dirX * r} ${midY}`,
    `L ${x2 - dirX * r} ${midY}`,
    `Q ${x2} ${midY} ${x2} ${midY + dirY * r}`,
    `L ${x2} ${y2}`,
  ].join(' ');

  return {
    d,
    corner1: { x: x1, y: midY },
    corner2: { x: x2, y: midY },
  };
}

/* ------------------------------------------------------------------ */
/*  Game-Specific Procedural Vector Artwork (per Sector)               */
/* ------------------------------------------------------------------ */

/**
 * Theme 1 (Bug Hunt): Motherboard PCB & Logic Gates.
 * 24px micro-dot silkscreen grid, orthogonal 45°/90° bus highways,
 * QFP & BGA IC chips (ALU_64, MEM_0x7F, IRQ_04), resistor/capacitor symbols & logic gates.
 */
function MicrochipSectorArtwork({
  width,
  sectorTop,
  sectorIndex,
}: {
  width: number;
  sectorTop: number;
  sectorIndex: number;
}) {
  const leftRailX = 12;
  const rightRailX = Math.max(width - 12, 300);
  const centerX = width / 2;
  const chipY1 = sectorTop + 132;
  const chipY2 = sectorTop + 265;
  const bossY =
    sectorTop +
    SECTOR_HEADER_H +
    SECTOR_TOP_GAP +
    DUO_NODE_HEIGHT / 2 +
    2 * ROW_STEP +
    BOSS_ROW_STEP;
  const socTop = sectorTop + 225;

  const lanes = [0, 5, 10];
  const bgaOffsets = [-9, -3, 3, 9];
  const qfpPinOffsets = [-12, -4, 4, 12];
  const labels = ['ALU_64', 'MEM_0x7F', 'IRQ_04'] as const;

  return (
    <G pointerEvents="none">
      {/* Left 3-lane vertical/45° address bus highway */}
      {lanes.map((offset, idx) => {
        const x = leftRailX + offset;
        const bendY1 = chipY1 - 24 + idx * 4;
        const bendY2 = bossY + 48 - idx * 4;
        const innerX = x + 18;
        return (
          <G key={`lbus-${sectorIndex}-${idx}`}>
            <Path
              d={[
                `M ${x} ${sectorTop + 48}`,
                `L ${x} ${bendY1}`,
                `L ${innerX} ${bendY1 + 18}`,
                `L ${innerX} ${bendY2 - 64}`,
                `L ${x} ${bendY2 - 46}`,
                `L ${x} ${sectorTop + 498}`,
              ].join(' ')}
              stroke={
                idx === 1
                  ? 'rgba(124, 92, 252, 0.16)'
                  : 'rgba(148, 163, 184, 0.08)'
              }
              strokeWidth={1.1}
              fill="none"
            />
            <Circle
              cx={x}
              cy={sectorTop + 48}
              r={2.1}
              fill={PCB_BG}
              stroke="rgba(167, 139, 250, 0.25)"
              strokeWidth={1}
            />
            <Circle
              cx={x}
              cy={sectorTop + 498}
              r={2.1}
              fill={PCB_BG}
              stroke="rgba(167, 139, 250, 0.25)"
              strokeWidth={1}
            />
          </G>
        );
      })}

      {/* Right 3-lane vertical/45° data bus highway */}
      {lanes.map((offset, idx) => {
        const x = rightRailX - offset;
        const bendY1 = chipY2 - 42 + idx * 4;
        const bendY2 = bossY + 32 - idx * 4;
        const innerX = x - 18;
        return (
          <G key={`rbus-${sectorIndex}-${idx}`}>
            <Path
              d={[
                `M ${x} ${sectorTop + 56}`,
                `L ${x} ${bendY1}`,
                `L ${innerX} ${bendY1 + 18}`,
                `L ${innerX} ${bendY2 - 64}`,
                `L ${x} ${bendY2 - 46}`,
                `L ${x} ${sectorTop + 498}`,
              ].join(' ')}
              stroke={
                idx === 1
                  ? 'rgba(124, 92, 252, 0.16)'
                  : 'rgba(148, 163, 184, 0.08)'
              }
              strokeWidth={1.1}
              fill="none"
            />
            <Circle
              cx={x}
              cy={sectorTop + 56}
              r={2.1}
              fill={PCB_BG}
              stroke="rgba(167, 139, 250, 0.25)"
              strokeWidth={1}
            />
          </G>
        );
      })}

      {/* Cross-board differential pair routing */}
      {[0, 4.5].map((dy, idx) => (
        <Path
          key={`xpair-${sectorIndex}-${idx}`}
          d={[
            `M ${leftRailX + 18} ${chipY1 + 52 + dy}`,
            `L ${centerX - 64} ${chipY1 + 52 + dy}`,
            `L ${centerX - 44} ${chipY1 + 72 + dy}`,
            `L ${centerX + 44} ${chipY1 + 72 + dy}`,
            `L ${centerX + 64} ${chipY1 + 52 + dy}`,
            `L ${rightRailX - 18} ${chipY1 + 52 + dy}`,
          ].join(' ')}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
          fill="none"
        />
      ))}

      {/* Left QFP Microcontroller Footprint + Silkscreen IC Label */}
      <G>
        <Rect
          x={6}
          y={chipY2 - 22}
          width={34}
          height={44}
          rx={3}
          fill="#0D0C18"
          stroke="rgba(124, 92, 252, 0.24)"
          strokeWidth={1}
        />
        <Rect
          x={12}
          y={chipY2 - 14}
          width={22}
          height={28}
          rx={2}
          fill="rgba(124, 92, 252, 0.06)"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={0.9}
        />
        <Circle
          cx={11}
          cy={chipY2 - 17}
          r={1.5}
          fill="rgba(167, 139, 250, 0.45)"
        />
        {qfpPinOffsets.map((py, idx) => (
          <G key={`lpin-${sectorIndex}-${idx}`}>
            <Line
              x1={40}
              y1={chipY2 + py}
              x2={52}
              y2={chipY2 + py}
              stroke="rgba(167, 139, 250, 0.22)"
              strokeWidth={1.1}
            />
            <Circle
              cx={54}
              cy={chipY2 + py}
              r={1.6}
              fill={PCB_BG}
              stroke="rgba(167, 139, 250, 0.30)"
              strokeWidth={1}
            />
          </G>
        ))}
        <SvgText
          x={10}
          y={chipY2 - 28}
          fill="rgba(167, 139, 250, 0.34)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          {labels[sectorIndex % labels.length]}
        </SvgText>
      </G>

      {/* Schematic AND logic gate symbol (top-left edge) */}
      <G opacity={0.42}>
        <Line
          x1={8}
          y1={sectorTop + 82}
          x2={16}
          y2={sectorTop + 82}
          stroke="rgba(167, 139, 250, 0.55)"
          strokeWidth={1}
        />
        <Line
          x1={8}
          y1={sectorTop + 92}
          x2={16}
          y2={sectorTop + 92}
          stroke="rgba(167, 139, 250, 0.55)"
          strokeWidth={1}
        />
        <Path
          d={`M 16 ${sectorTop + 77} L 24 ${sectorTop + 77} A 9 10 0 0 1 24 ${sectorTop + 97} L 16 ${sectorTop + 97} Z`}
          fill="#0D0C18"
          stroke="rgba(167, 139, 250, 0.55)"
          strokeWidth={1}
        />
        <Line
          x1={33}
          y1={sectorTop + 87}
          x2={42}
          y2={sectorTop + 87}
          stroke="rgba(167, 139, 250, 0.55)"
          strokeWidth={1}
        />
      </G>

      {/* Schematic Resistor & Capacitor footprints (right/left margins) */}
      <G opacity={0.45}>
        <Path
          d={`M ${rightRailX - 28} ${sectorTop + 88} L ${rightRailX - 22} ${sectorTop + 88} L ${rightRailX - 20} ${sectorTop + 84} L ${rightRailX - 16} ${sectorTop + 92} L ${rightRailX - 12} ${sectorTop + 84} L ${rightRailX - 8} ${sectorTop + 92} L ${rightRailX - 6} ${sectorTop + 88} L ${rightRailX - 1} ${sectorTop + 88}`}
          stroke="rgba(148, 163, 184, 0.55)"
          strokeWidth={1}
          fill="none"
        />
        <SvgText
          x={rightRailX - 36}
          y={sectorTop + 79}
          fill="rgba(148, 163, 184, 0.45)"
          fontFamily={MONO}
          fontSize={7}
        >
          MEM_0x7F
        </SvgText>
        {/* Capacitor parallel plates */}
        <Line
          x1={10}
          y1={bossY - 12}
          x2={18}
          y2={bossY - 12}
          stroke="rgba(167, 139, 250, 0.45)"
          strokeWidth={1}
        />
        <Line
          x1={18}
          y1={bossY - 18}
          x2={18}
          y2={bossY - 6}
          stroke="rgba(167, 139, 250, 0.60)"
          strokeWidth={1.3}
        />
        <Line
          x1={23}
          y1={bossY - 18}
          x2={23}
          y2={bossY - 6}
          stroke="rgba(167, 139, 250, 0.60)"
          strokeWidth={1.3}
        />
        <Line
          x1={23}
          y1={bossY - 12}
          x2={31}
          y2={bossY - 12}
          stroke="rgba(167, 139, 250, 0.45)"
          strokeWidth={1}
        />
        <SvgText
          x={9}
          y={bossY + 2}
          fill="rgba(167, 139, 250, 0.42)"
          fontFamily={MONO}
          fontSize={7}
        >
          IRQ_04
        </SvgText>
      </G>

      {/* Right BGA SoC Socket Matrix + Diagonal Breakout */}
      <G>
        <Rect
          x={rightRailX - 38}
          y={socTop - 22}
          width={40}
          height={40}
          rx={4}
          fill="#0D0C18"
          stroke="rgba(124, 92, 252, 0.24)"
          strokeWidth={1}
        />
        <Rect
          x={rightRailX - 32}
          y={socTop - 16}
          width={28}
          height={28}
          rx={2}
          fill="none"
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth={0.8}
        />
        {bgaOffsets.map((bx) =>
          bgaOffsets.map((by) => (
            <Circle
              key={`bga-${sectorIndex}-${bx}-${by}`}
              cx={rightRailX - 18 + bx}
              cy={socTop - 2 + by}
              r={1.1}
              fill="rgba(167, 139, 250, 0.26)"
            />
          )),
        )}
        <Path
          d={`M ${rightRailX - 38} ${socTop - 10} L ${rightRailX - 54} ${socTop - 10} L ${rightRailX - 66} ${socTop + 2}`}
          stroke="rgba(124, 92, 252, 0.20)"
          strokeWidth={1}
          fill="none"
        />
        <Circle
          cx={rightRailX - 66}
          cy={socTop + 2}
          r={1.8}
          fill={PCB_BG}
          stroke="rgba(167, 139, 250, 0.30)"
          strokeWidth={1}
        />
      </G>

      {/* Center Boss Die Shield Symmetry Ring */}
      <G opacity={0.75}>
        <Path
          d={[
            `M ${centerX - 66} ${bossY - 26}`,
            `L ${centerX - 52} ${bossY - 40}`,
            `L ${centerX + 52} ${bossY - 40}`,
            `L ${centerX + 66} ${bossY - 26}`,
          ].join(' ')}
          stroke="rgba(124, 92, 252, 0.14)"
          strokeWidth={1}
          fill="none"
        />
        <Path
          d={[
            `M ${centerX - 66} ${bossY + 22}`,
            `L ${centerX - 52} ${bossY + 36}`,
            `L ${centerX + 52} ${bossY + 36}`,
            `L ${centerX + 66} ${bossY + 22}`,
          ].join(' ')}
          stroke="rgba(124, 92, 252, 0.14)"
          strokeWidth={1}
          fill="none"
        />
        <Rect
          x={centerX - 88}
          y={bossY - 5}
          width={12}
          height={6}
          rx={1.5}
          fill="rgba(255, 255, 255, 0.04)"
          stroke="rgba(255, 255, 255, 0.11)"
          strokeWidth={0.9}
        />
        <Rect
          x={centerX + 76}
          y={bossY - 5}
          width={12}
          height={6}
          rx={1.5}
          fill="rgba(255, 255, 255, 0.04)"
          stroke="rgba(255, 255, 255, 0.11)"
          strokeWidth={0.9}
        />
      </G>
    </G>
  );
}

/**
 * Theme 2 (Syntax Sprint): Velocity Data Highway & Lexer Track.
 * Vertical dashed data-stream rails, speed-chevron markers,
 * and floating monospace lexer checkpoints.
 */
function SyntaxSprintSectorArtwork({
  width,
  sectorTop,
  sectorIndex,
}: {
  width: number;
  sectorTop: number;
  sectorIndex: number;
}) {
  const rightX = Math.max(width - 14, 300);
  const centerX = width / 2;
  const topY = sectorTop + 50;
  const botY = sectorTop + 505;
  const chevronYs = [sectorTop + 146, sectorTop + 282, sectorTop + 422];

  return (
    <G pointerEvents="none">
      {/* Vertical high-speed data-stream edge rails */}
      {[12, 20, rightX - 6, rightX + 2].map((rx, idx) => (
        <Line
          key={`stream-${sectorIndex}-${idx}`}
          x1={rx}
          y1={topY}
          x2={rx}
          y2={botY}
          stroke={
            idx % 2 === 0
              ? 'rgba(52, 211, 153, 0.12)'
              : 'rgba(124, 92, 252, 0.14)'
          }
          strokeWidth={1.2}
          strokeDasharray="2 18"
        />
      ))}

      {/* Subtle center velocity rail ticks */}
      <Line
        x1={centerX}
        y1={sectorTop + 54}
        x2={centerX}
        y2={botY}
        stroke="rgba(124, 92, 252, 0.07)"
        strokeWidth={1}
        strokeDasharray="3 16"
      />

      {/* Minimalist directional speed chevrons along left/right track shoulders */}
      {chevronYs.map((cy, rowIdx) => (
        <G key={`chev-${sectorIndex}-${rowIdx}`} opacity={0.55}>
          {[0, 6, 12].map((dy, ci) => (
            <G key={`c-${ci}`}>
              <Path
                d={`M 10 ${cy + dy + 4} L 15 ${cy + dy} L 20 ${cy + dy + 4}`}
                stroke={
                  rowIdx % 2 === 0
                    ? 'rgba(52, 211, 153, 0.42)'
                    : 'rgba(124, 92, 252, 0.45)'
                }
                strokeWidth={1.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d={`M ${rightX - 8} ${cy + dy + 4} L ${rightX - 3} ${cy + dy} L ${rightX + 2} ${cy + dy + 4}`}
                stroke={
                  rowIdx % 2 === 0
                    ? 'rgba(124, 92, 252, 0.45)'
                    : 'rgba(52, 211, 153, 0.42)'
                }
                strokeWidth={1.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </G>
          ))}
        </G>
      ))}

      {/* Monospace Lexer Track Checkpoints along margins */}
      <G>
        <SvgText
          x={26}
          y={sectorTop + 68}
          fill="rgba(52, 211, 153, 0.34)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          [TOKEN_STREAM]
        </SvgText>
        <SvgText
          x={rightX - 46}
          y={sectorTop + 178}
          fill="rgba(167, 139, 250, 0.34)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          120_FPS
        </SvgText>
        <SvgText
          x={26}
          y={sectorTop + 398}
          fill="rgba(52, 211, 153, 0.32)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          VALID // ERR
        </SvgText>
        <SvgText
          x={rightX - 72}
          y={sectorTop + 476}
          fill="rgba(167, 139, 250, 0.34)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          &gt;&gt; FAST_LANE
        </SvgText>
      </G>
    </G>
  );
}

/**
 * Theme 3 (Git Simulator): Commit Graph & Branch Topology Blueprint.
 * 3 continuous parallel vertical branch rails (`main`, `feature/*`, `hotfix/*`)
 * with decorative commit annotations and diff markers.
 */
function GitGraphSectorArtwork({
  width,
  sectorTop,
  sectorIndex,
}: {
  width: number;
  sectorTop: number;
  sectorIndex: number;
}) {
  const hotfixX = 24;
  const mainX = width / 2;
  const featureX = Math.max(width - 24, 300);
  const topY = sectorTop + 46;
  const botY = sectorTop + 510;
  const bossY =
    sectorTop +
    SECTOR_HEADER_H +
    SECTOR_TOP_GAP +
    DUO_NODE_HEIGHT / 2 +
    2 * ROW_STEP +
    BOSS_ROW_STEP;

  return (
    <G pointerEvents="none">
      {/* 3 Continuous Parallel Vertical Branch Rails */}
      <Line
        x1={hotfixX}
        y1={topY}
        x2={hotfixX}
        y2={botY}
        stroke="rgba(251, 191, 36, 0.11)"
        strokeWidth={1.5}
      />
      <Line
        x1={mainX}
        y1={topY}
        x2={mainX}
        y2={botY}
        stroke="rgba(124, 92, 252, 0.15)"
        strokeWidth={1.8}
      />
      <Line
        x1={featureX}
        y1={topY}
        x2={featureX}
        y2={botY}
        stroke="rgba(56, 189, 248, 0.13)"
        strokeWidth={1.5}
      />

      {/* Subtle architectural fork & merge curves connecting margin branches to main */}
      <Path
        d={`M ${mainX} ${sectorTop + 150} C ${mainX + 64} ${sectorTop + 165}, ${featureX} ${sectorTop + 170}, ${featureX} ${sectorTop + 210}`}
        stroke="rgba(56, 189, 248, 0.10)"
        strokeWidth={1.2}
        strokeDasharray="4 4"
        fill="none"
      />
      <Path
        d={`M ${hotfixX} ${sectorTop + 310} C ${hotfixX} ${sectorTop + 370}, ${mainX - 65} ${sectorTop + 410}, ${mainX} ${bossY}`}
        stroke="rgba(251, 191, 36, 0.10)"
        strokeWidth={1.2}
        strokeDasharray="4 4"
        fill="none"
      />

      {/* Blueprint Commit Dots along side branch rails */}
      {[sectorTop + 86, sectorTop + 274].map((cy, idx) => (
        <Circle
          key={`hf-dot-${sectorIndex}-${idx}`}
          cx={hotfixX}
          cy={cy}
          r={3.2}
          fill={PCB_BG}
          stroke="rgba(251, 191, 36, 0.34)"
          strokeWidth={1.3}
        />
      ))}
      {[sectorTop + 156, sectorTop + 344].map((cy, idx) => (
        <Circle
          key={`ft-dot-${sectorIndex}-${idx}`}
          cx={featureX}
          cy={cy}
          r={3.2}
          fill={PCB_BG}
          stroke="rgba(56, 189, 248, 0.36)"
          strokeWidth={1.3}
        />
      ))}

      {/* Decorative Monospace Git Annotations */}
      <G>
        <SvgText
          x={hotfixX + 7}
          y={sectorTop + 65}
          fill="rgba(251, 191, 36, 0.34)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          commit 8f3a1d
        </SvgText>
        <SvgText
          x={mainX + 10}
          y={sectorTop + 66}
          fill="rgba(167, 139, 250, 0.36)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          HEAD -&gt; main
        </SvgText>
        <SvgText
          x={featureX - 60}
          y={sectorTop + 159}
          fill="rgba(56, 189, 248, 0.38)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          origin/prod
        </SvgText>
        <SvgText
          x={hotfixX + 7}
          y={sectorTop + 277}
          fill="rgba(56, 189, 248, 0.34)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          ff-merge
        </SvgText>
        <SvgText
          x={featureX - 68}
          y={sectorTop + 347}
          fill="rgba(167, 139, 250, 0.34)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          rebase --onto
        </SvgText>

        {/* Subtle Diff Markers */}
        <SvgText
          x={hotfixX + 7}
          y={bossY + 6}
          fill="rgba(52, 211, 153, 0.38)"
          fontFamily={MONO}
          fontSize={8}
          fontWeight="700"
        >
          +14
        </SvgText>
        <SvgText
          x={hotfixX + 27}
          y={bossY + 6}
          fill="rgba(248, 113, 113, 0.38)"
          fontFamily={MONO}
          fontSize={8}
          fontWeight="700"
        >
          -3
        </SvgText>
      </G>
    </G>
  );
}

/**
 * Theme 4 (Robot Maze): Cyber-Labyrinth Architectural Blueprint & Laser Grid.
 * Orthogonal chamber walls, corner coordinates, coral laser emitter beams,
 * and concentric cyan teleporter pad rings.
 */
function RobotMazeSectorArtwork({
  width,
  sectorTop,
  sectorIndex,
}: {
  width: number;
  sectorTop: number;
  sectorIndex: number;
}) {
  const rightX = Math.max(width - 14, 300);
  const centerX = width / 2;
  const bossY =
    sectorTop +
    SECTOR_HEADER_H +
    SECTOR_TOP_GAP +
    DUO_NODE_HEIGHT / 2 +
    2 * ROW_STEP +
    BOSS_ROW_STEP;

  return (
    <G pointerEvents="none">
      {/* Orthogonal Labyrinth Chamber Walls (2px electric violet architectural lines) */}
      <Path
        d={[
          `M 10 ${sectorTop + 72}`,
          `L 10 ${sectorTop + 178}`,
          `L 42 ${sectorTop + 178}`,
        ].join(' ')}
        stroke="rgba(124, 92, 252, 0.18)"
        strokeWidth={2}
        fill="none"
      />
      <Path
        d={[
          `M ${rightX + 4} ${sectorTop + 72}`,
          `L ${rightX + 4} ${sectorTop + 168}`,
          `L ${rightX - 32} ${sectorTop + 168}`,
        ].join(' ')}
        stroke="rgba(124, 92, 252, 0.18)"
        strokeWidth={2}
        fill="none"
      />
      <Path
        d={[
          `M 10 ${sectorTop + 266}`,
          `L 10 ${sectorTop + 410}`,
          `L 52 ${sectorTop + 410}`,
          `L 52 ${sectorTop + 432}`,
        ].join(' ')}
        stroke="rgba(124, 92, 252, 0.18)"
        strokeWidth={2}
        fill="none"
      />
      <Path
        d={[
          `M ${rightX + 4} ${sectorTop + 264}`,
          `L ${rightX + 4} ${sectorTop + 412}`,
          `L ${rightX - 42} ${sectorTop + 412}`,
        ].join(' ')}
        stroke="rgba(124, 92, 252, 0.18)"
        strokeWidth={2}
        fill="none"
      />
      {/* Internal chamber wall brackets */}
      <Path
        d={`M ${centerX - 36} ${sectorTop + 158} L ${centerX + 36} ${sectorTop + 158}`}
        stroke="rgba(124, 92, 252, 0.14)"
        strokeWidth={2}
        fill="none"
      />
      <Path
        d={`M ${centerX - 32} ${sectorTop + 286} L ${centerX + 32} ${sectorTop + 286}`}
        stroke="rgba(124, 92, 252, 0.14)"
        strokeWidth={2}
        fill="none"
      />

      {/* Coral-Red Laser Emitter Beams across side corridors */}
      <G>
        {/* Left laser gate */}
        <Line
          x1={10}
          y1={sectorTop + 220}
          x2={44}
          y2={sectorTop + 220}
          stroke="rgba(239, 68, 68, 0.22)"
          strokeWidth={5}
        />
        <Line
          x1={10}
          y1={sectorTop + 220}
          x2={44}
          y2={sectorTop + 220}
          stroke="rgba(248, 113, 113, 0.45)"
          strokeWidth={1.4}
        />
        <Circle cx={10} cy={sectorTop + 220} r={2.4} fill="rgba(239, 68, 68, 0.55)" />
        <Circle cx={44} cy={sectorTop + 220} r={2.4} fill="rgba(239, 68, 68, 0.55)" />

        {/* Right laser gate */}
        <Line
          x1={rightX - 36}
          y1={sectorTop + 312}
          x2={rightX + 4}
          y2={sectorTop + 312}
          stroke="rgba(239, 68, 68, 0.22)"
          strokeWidth={5}
        />
        <Line
          x1={rightX - 36}
          y1={sectorTop + 312}
          x2={rightX + 4}
          y2={sectorTop + 312}
          stroke="rgba(248, 113, 113, 0.45)"
          strokeWidth={1.4}
        />
        <Circle
          cx={rightX - 36}
          cy={sectorTop + 312}
          r={2.4}
          fill="rgba(239, 68, 68, 0.55)"
        />
        <Circle
          cx={rightX + 4}
          cy={sectorTop + 312}
          r={2.4}
          fill="rgba(239, 68, 68, 0.55)"
        />
      </G>

      {/* Concentric Cyan Teleporter Pad Rings near boss flanks */}
      {[72, rightX - 62].map((tx, idx) => {
        const ty = bossY - 6;
        return (
          <G key={`tp-${sectorIndex}-${idx}`} opacity={0.55}>
            <Circle
              cx={tx}
              cy={ty}
              r={15}
              fill="rgba(56, 189, 248, 0.05)"
              stroke="rgba(56, 189, 248, 0.34)"
              strokeWidth={1.2}
              strokeDasharray="4 3"
            />
            <Circle
              cx={tx}
              cy={ty}
              r={9}
              fill="none"
              stroke="rgba(56, 189, 248, 0.42)"
              strokeWidth={1.2}
            />
            <Circle cx={tx} cy={ty} r={2.5} fill="rgba(186, 230, 253, 0.55)" />
          </G>
        );
      })}

      {/* Corner Coordinates & Chamber Silkscreen */}
      <G>
        <SvgText
          x={16}
          y={sectorTop + 65}
          fill="rgba(167, 139, 250, 0.34)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          [X:0{sectorIndex + 1}, Y:12]
        </SvgText>
        <SvgText
          x={rightX - 66}
          y={sectorTop + 65}
          fill="rgba(167, 139, 250, 0.30)"
          fontFamily={MONO}
          fontSize={7.5}
          fontWeight="700"
        >
          SECTOR_WALL
        </SvgText>
      </G>
    </G>
  );
}

/** Mini geometric robot head SVG displayed on the Robot Maze active node puck. */
function MiniRobotHeadIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30">
      {/* Antenna */}
      <Line
        x1={15}
        y1={2}
        x2={15}
        y2={6.5}
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={15} cy={2.2} r={1.8} fill="#38BDF8" />
      {/* Ear tabs */}
      <Rect x={2.5} y={12} width={2.5} height={7} rx={1.2} fill="#E0E7FF" />
      <Rect x={25} y={12} width={2.5} height={7} rx={1.2} fill="#E0E7FF" />
      {/* Robot Head Shell */}
      <Rect
        x={5}
        y={6.5}
        width={20}
        height={18.5}
        rx={5.5}
        fill="#FFFFFF"
      />
      {/* Dark Cyber Visor */}
      <Rect x={7.5} y={10.5} width={15} height={8.5} rx={3} fill="#141322" />
      {/* Cyan Pixel Eyes */}
      <Rect x={10} y={13} width={3} height={3.5} rx={1} fill="#38BDF8" />
      <Rect x={17} y={13} width={3} height={3.5} rx={1} fill="#38BDF8" />
      {/* Tiny mouth grille */}
      <Line
        x1={11.5}
        y1={21.8}
        x2={18.5}
        y2={21.8}
        stroke="#5B21B6"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Generalized 30-Level Campaign Map Component                   */
/* ------------------------------------------------------------------ */

export function BugCampaignMap({
  campaignKind = 'bug_hunt',
  lang,
  onChangeLang,
  progress,
  gitProgress = {},
  robotProgress = {},
  onSelectLevel,
  onBack,
  bottomInset = 16,
  isRecoveryMode = false,
}: BugCampaignMapProps) {
  const [canvasWidth, setCanvasWidth] = useState(375);
  const [selectedLevelNum, setSelectedLevelNum] = useState<number | null>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const langScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const lastScrolledKeyRef = useRef<string | null>(null);

  const popoverScale = useRef(new Animated.Value(0.1)).current;
  const popoverOpacity = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  const isLangBased =
    campaignKind === 'bug_hunt' || campaignKind === 'syntax_sprint';

  const headerTitle =
    campaignKind === 'syntax_sprint'
      ? 'Syntax Sprint'
      : campaignKind === 'git_sim'
        ? 'Git Simulator'
        : campaignKind === 'robot_maze'
          ? 'Robot Maze'
          : 'Bug Hunt Campaign';

  const activeBubbleLabel =
    campaignKind === 'syntax_sprint'
      ? 'SPRINT'
      : campaignKind === 'git_sim'
        ? 'MERGE'
        : campaignKind === 'robot_maze'
          ? 'CODE'
          : 'HUNT';

  const levels = useMemo<UnifiedMapLevel[]>(() => {
    if (campaignKind === 'syntax_sprint') {
      return getSyntaxSprintLevels(lang).map((l) => ({
        levelNumber: l.levelNumber,
        sector: l.sector,
        title: l.title,
        isBoss: l.isBoss,
        chipBadge: l.isBoss
          ? `BOSS · ${l.cardCount} CARDS`
          : `${l.cardCount} CARDS`,
        targetLabel: `< ${l.starThresholds[0]}s · 0 err`,
      }));
    }
    if (campaignKind === 'git_sim') {
      return getGitCampaignLevels().map((l) => ({
        levelNumber: l.levelNumber,
        sector: l.sector,
        title: l.title,
        isBoss: l.isBoss,
        chipBadge: l.isBoss ? `BOSS · PAR ${l.parMoves}` : `PAR ${l.parMoves}`,
        targetLabel: `≤ ${l.parMoves} moves`,
      }));
    }
    if (campaignKind === 'robot_maze') {
      return getRobotMazeLevels().map((l) => ({
        levelNumber: l.levelNumber,
        sector: l.sector,
        title: l.title,
        isBoss: l.isBoss,
        chipBadge: l.isBoss
          ? `BOSS · MAX ${l.maxOptimalBlocks}`
          : `MAX ${l.maxOptimalBlocks}`,
        targetLabel: `≤ ${l.maxOptimalBlocks} blocks`,
      }));
    }
    return getBugCampaignLevels(lang).map((l) => ({
      levelNumber: l.levelNumber,
      sector: l.sector,
      title: l.title,
      isBoss: l.isBoss,
      chipBadge: l.isBoss
        ? 'BOSS · 3 BUGS'
        : `${BUG_CAMPAIGN_BUGS_PER_LEVEL} BUGS`,
      targetLabel: `< ${BUG_CAMPAIGN_STAR_THRESHOLDS[0]}s`,
    }));
  }, [campaignKind, lang]);

  const getLevelStars = useMemo(() => {
    return (lvlNum: number): { stars: 1 | 2 | 3; bestLabel: string } | undefined => {
      if (campaignKind === 'git_sim') {
        const rec = gitProgress[lvlNum];
        if (!rec) return undefined;
        return { stars: rec.stars, bestLabel: `Best ${rec.bestMoves} moves` };
      }
      if (campaignKind === 'robot_maze') {
        const rec = robotProgress[lvlNum];
        if (!rec) return undefined;
        return { stars: rec.stars, bestLabel: `Best ${rec.bestBlocks} blocks` };
      }
      const rec = progress[lang]?.[lvlNum];
      if (!rec) return undefined;
      return {
        stars: rec.stars,
        bestLabel: `Best ${(rec.bestTimeMs / 1000).toFixed(1)}s`,
      };
    };
  }, [campaignKind, gitProgress, lang, progress, robotProgress]);

  const checkLevelStatus = useMemo(() => {
    return (lvlNum: number): NodeStatus => {
      if (campaignKind === 'git_sim') {
        return getGitSimLevelStatus(gitProgress, lvlNum);
      }
      if (campaignKind === 'robot_maze') {
        return getRobotMazeLevelStatus(robotProgress, lvlNum);
      }
      if (campaignKind === 'syntax_sprint') {
        return getSyntaxSprintLevelStatus(progress, lang, lvlNum);
      }
      return getBugLevelStatus(progress, lang, lvlNum);
    };
  }, [campaignKind, gitProgress, lang, progress, robotProgress]);

  const earnedStars = useMemo(() => {
    if (campaignKind === 'git_sim') return getGitSimTotalStars(gitProgress);
    if (campaignKind === 'robot_maze') return getRobotMazeTotalStars(robotProgress);
    if (campaignKind === 'syntax_sprint') {
      return getSyntaxSprintLanguageStars(progress, lang);
    }
    return getBugLanguageStars(progress, lang);
  }, [campaignKind, gitProgress, lang, progress, robotProgress]);

  const orderedLanguages = useMemo(() => {
    const validIds = new Set(LANGUAGES.map((l) => l.id));
    const list: LangId[] = [];
    for (const id of PRIORITY_LANG_ORDER) {
      if (validIds.has(id) && !list.includes(id)) list.push(id);
    }
    for (const l of LANGUAGES) {
      if (!list.includes(l.id)) list.push(l.id);
    }
    return list;
  }, []);

  const { nodeCoords, sectorLayouts, totalHeight } = useMemo(() => {
    const sidePad = Math.max(58, Math.min(82, canvasWidth * 0.175));
    const col0 = sidePad;
    const col1 = canvasWidth / 2;
    const col2 = canvasWidth - sidePad;
    const colX: Record<0 | 1 | 2, number> = { 0: col0, 1: col1, 2: col2 };

    const coords: NodeCoord[] = [];
    const banners: SectorLayout[] = [];
    let cursorY = TOP_CANVAS_PAD;
    const sectorIds = [1, 2, 3] as const;

    const sectorTable =
      campaignKind === 'syntax_sprint'
        ? SYNTAX_SPRINT_SECTORS
        : campaignKind === 'git_sim'
          ? GIT_CAMPAIGN_SECTORS
          : campaignKind === 'robot_maze'
            ? ROBOT_MAZE_SECTORS
            : BUG_CAMPAIGN_SECTORS;

    for (let sIdx = 0; sIdx < sectorIds.length; sIdx += 1) {
      const sectorMeta = sectorTable[sectorIds[sIdx]];
      const sectorStart = sIdx * 10;
      const sectorLevels = levels.slice(sectorStart, sectorStart + 10);

      banners.push({
        sector: sectorMeta.sector,
        title: sectorMeta.title,
        bannerTop: cursorY,
      });

      const firstRowY =
        cursorY + SECTOR_HEADER_H + SECTOR_TOP_GAP + DUO_NODE_HEIGHT / 2;

      const patternCols: (0 | 1 | 2)[] = [0, 1, 2, 2, 1, 0, 0, 1, 2, 1];
      const patternRows = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3];

      for (let i = 0; i < sectorLevels.length; i += 1) {
        const lvl = sectorLevels[i];
        const col = patternCols[i] ?? 1;
        const row = patternRows[i] ?? 0;
        const y =
          firstRowY +
          (row < 3 ? row * ROW_STEP : 2 * ROW_STEP + BOSS_ROW_STEP);
        coords.push({ level: lvl, x: colX[col], y, col });
      }

      const bossY = firstRowY + 2 * ROW_STEP + BOSS_ROW_STEP;
      cursorY = bossY + DUO_NODE_HEIGHT / 2 + 30 + SECTOR_GAP;
    }

    return {
      nodeCoords: coords,
      sectorLayouts: banners,
      totalHeight: cursorY - SECTOR_GAP + BOTTOM_CANVAS_PAD,
    };
  }, [campaignKind, canvasWidth, levels]);

  const activeLevelNumber = useMemo(() => {
    for (let i = 1; i <= 30; i += 1) {
      if (checkLevelStatus(i) === 'active') return i;
    }
    return 30;
  }, [checkLevelStatus]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -5,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bobAnim]);

  useEffect(() => {
    if (selectedLevelNum === null) return;
    popoverScale.stopAnimation();
    popoverOpacity.stopAnimation();
    popoverScale.setValue(0.1);
    popoverOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(popoverScale, {
        toValue: 1,
        damping: 13,
        stiffness: 350,
        mass: 0.65,
        useNativeDriver: true,
      }),
      Animated.timing(popoverOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedLevelNum, popoverOpacity, popoverScale]);

  const scrollKey = `${campaignKind}-${lang}-${activeLevelNumber}`;
  useEffect(() => {
    if (lastScrolledKeyRef.current === scrollKey) return;
    const target = nodeCoords.find(
      (c) => c.level.levelNumber === activeLevelNumber,
    );
    if (!target) return;
    lastScrolledKeyRef.current = scrollKey;
    const timer = setTimeout(() => {
      const targetY = Math.max(0, target.y - 200);
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }, 90);
    return () => clearTimeout(timer);
  }, [activeLevelNumber, nodeCoords, scrollKey]);

  const handleCanvasLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - canvasWidth) > 2) {
      setCanvasWidth(w);
    }
  };

  const handleLanguagePick = (nextLang: LangId) => {
    if (nextLang === lang) return;
    selectionHaptic();
    playSound('select');
    setSelectedLevelNum(null);
    onChangeLang(nextLang);
  };

  const handleNodePress = (levelNumber: number) => {
    tapHaptic();
    playSound('tap');
    setSelectedLevelNum((prev) => (prev === levelNumber ? null : levelNumber));
  };

  const selectedCoord = useMemo(
    () =>
      selectedLevelNum !== null
        ? nodeCoords.find((c) => c.level.levelNumber === selectedLevelNum) ??
          null
        : null,
    [nodeCoords, selectedLevelNum],
  );

  const selectedStatus: NodeStatus | null = useMemo(() => {
    if (!selectedCoord) return null;
    return checkLevelStatus(selectedCoord.level.levelNumber);
  }, [checkLevelStatus, selectedCoord]);

  const selectedRecord = selectedCoord
    ? getLevelStars(selectedCoord.level.levelNumber)
    : undefined;

  const popoverPlacement = useMemo(() => {
    if (!selectedCoord || !selectedStatus) return null;
    const placeBelow = selectedCoord.y < 235;
    const left = Math.max(
      14,
      Math.min(canvasWidth - POPOVER_W - 14, selectedCoord.x - POPOVER_W / 2),
    );
    const arrowOffset = Math.max(
      22,
      Math.min(POPOVER_W - 22, selectedCoord.x - left),
    );
    const top = placeBelow
      ? selectedCoord.y + DUO_NODE_HEIGHT / 2 + 28
      : undefined;
    const bottom = !placeBelow
      ? totalHeight -
        (selectedCoord.y -
          DUO_NODE_HEIGHT / 2 -
          (selectedStatus === 'active' ? 22 : 16))
      : undefined;
    return { left, top, bottom, arrowOffset, placeBelow };
  }, [canvasWidth, selectedCoord, selectedStatus, totalHeight]);

  const patternId = `bgGrid-${campaignKind}`;
  const sectorIconName =
    campaignKind === 'syntax_sprint'
      ? 'flash'
      : campaignKind === 'git_sim'
        ? 'git-branch'
        : campaignKind === 'robot_maze'
          ? 'hardware-chip'
          : 'chip';

  const bossIconName: React.ComponentProps<typeof Ionicons>['name'] =
    campaignKind === 'syntax_sprint'
      ? 'flash'
      : campaignKind === 'git_sim'
        ? 'git-merge'
        : campaignKind === 'robot_maze'
          ? 'hardware-chip'
          : 'bug';

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable
          onPress={() => {
            tapHaptic();
            onBack();
          }}
          style={({ pressed }) => [
            styles.backPill,
            pressed && styles.pressedFade,
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={16} color="#FAFAFA" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {headerTitle}
        </Text>

        <View style={styles.totalStarsPill}>
          <Ionicons name="star" size={13} color={GOLD} />
          <Text style={styles.totalStarsValue}>
            {earnedStars}
            <Text style={styles.totalStarsMax}>/{BUG_CAMPAIGN_MAX_STARS}</Text>
          </Text>
        </View>
      </View>

      {isRecoveryMode && campaignKind === 'bug_hunt' ? (
        <View style={styles.recoveryStrip}>
          <HeartIcon size={14} />
          <Text style={styles.recoveryStripText}>
            Clear any unlocked level (3 bugs) to recover +2 Hearts
          </Text>
        </View>
      ) : null}

      {/* Horizontal Language Switcher or Sector Jump Strip */}
      <View style={styles.langStripWrap}>
        <ScrollView
          ref={langScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.langStripContent}
        >
          {isLangBased
            ? orderedLanguages.map((langId) => {
                const isActive = langId === lang;
                const starsForLang =
                  campaignKind === 'syntax_sprint'
                    ? getSyntaxSprintLanguageStars(progress, langId)
                    : getBugLanguageStars(progress, langId);
                return (
                  <Pressable
                    key={langId}
                    onPress={() => handleLanguagePick(langId)}
                    style={({ pressed }) => [
                      styles.langPill,
                      isActive && styles.langPillActive,
                      pressed && styles.pressedFade,
                    ]}
                  >
                    <LanguageLogo lang={langId} size={14} />
                    <Text
                      style={[
                        styles.langPillLabel,
                        isActive && styles.langPillLabelActive,
                      ]}
                    >
                      {SHORT_LANG_NAME[langId]}
                    </Text>
                    {starsForLang > 0 ? (
                      <View
                        style={[
                          styles.langMiniStars,
                          isActive && styles.langMiniStarsActive,
                        ]}
                      >
                        <Ionicons name="star" size={9} color={GOLD} />
                        <Text style={styles.langMiniStarsText}>
                          {starsForLang}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            : sectorLayouts.map((sec) => (
                <Pressable
                  key={`jump-${sec.sector}`}
                  onPress={() => {
                    selectionHaptic();
                    scrollRef.current?.scrollTo({
                      y: Math.max(0, sec.bannerTop - 16),
                      animated: true,
                    });
                  }}
                  style={({ pressed }) => [
                    styles.langPill,
                    pressed && styles.pressedFade,
                  ]}
                >
                  <Ionicons
                    name={
                      campaignKind === 'git_sim' ? 'git-branch' : 'hardware-chip'
                    }
                    size={13}
                    color={campaignKind === 'git_sim' ? CYAN : '#A78BFA'}
                  />
                  <Text style={styles.langPillLabel}>
                    Sector 0{sec.sector}: {sec.title}
                  </Text>
                </Pressable>
              ))}
        </ScrollView>
      </View>

      {/* Scrollable Game-Themed Blueprint SVG Canvas */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(bottomInset, 24) }}
        showsVerticalScrollIndicator={false}
        onLayout={handleCanvasLayout}
      >
        <Pressable
          style={[styles.pcbCanvas, { height: totalHeight }]}
          onPress={() => {
            if (selectedLevelNum !== null) setSelectedLevelNum(null);
          }}
        >
          {/* Layer 1: Custom Game-Specific Procedural SVG Background + Path Connectors */}
          <Svg
            width={canvasWidth}
            height={totalHeight}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Defs>
              {campaignKind === 'bug_hunt' ? (
                <Pattern
                  id={patternId}
                  width={24}
                  height={24}
                  patternUnits="userSpaceOnUse"
                >
                  <Line
                    x1={0}
                    y1={0}
                    x2={24}
                    y2={0}
                    stroke="rgba(255,255,255,0.025)"
                    strokeWidth={1}
                  />
                  <Line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={24}
                    stroke="rgba(255,255,255,0.025)"
                    strokeWidth={1}
                  />
                  <Circle cx={0} cy={0} r={1} fill="rgba(255,255,255,0.045)" />
                </Pattern>
              ) : campaignKind === 'syntax_sprint' ? (
                <Pattern
                  id={patternId}
                  width={48}
                  height={40}
                  patternUnits="userSpaceOnUse"
                >
                  <Line
                    x1={24}
                    y1={0}
                    x2={24}
                    y2={40}
                    stroke="rgba(124, 92, 252, 0.045)"
                    strokeWidth={1}
                    strokeDasharray="2 18"
                  />
                  <Line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={40}
                    stroke="rgba(52, 211, 153, 0.035)"
                    strokeWidth={1}
                    strokeDasharray="2 18"
                  />
                </Pattern>
              ) : campaignKind === 'git_sim' ? (
                <Pattern
                  id={patternId}
                  width={28}
                  height={28}
                  patternUnits="userSpaceOnUse"
                >
                  <Line
                    x1={0}
                    y1={0}
                    x2={28}
                    y2={0}
                    stroke="rgba(56, 189, 248, 0.028)"
                    strokeWidth={1}
                  />
                  <Line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={28}
                    stroke="rgba(124, 92, 252, 0.028)"
                    strokeWidth={1}
                  />
                </Pattern>
              ) : (
                <Pattern
                  id={patternId}
                  width={32}
                  height={32}
                  patternUnits="userSpaceOnUse"
                >
                  <Line
                    x1={0}
                    y1={0}
                    x2={32}
                    y2={0}
                    stroke="rgba(139, 92, 246, 0.06)"
                    strokeWidth={1}
                  />
                  <Line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={32}
                    stroke="rgba(139, 92, 246, 0.06)"
                    strokeWidth={1}
                  />
                  <Circle
                    cx={0}
                    cy={0}
                    r={0.9}
                    fill="rgba(139, 92, 246, 0.14)"
                  />
                </Pattern>
              )}
            </Defs>

            <Rect x={0} y={0} width={canvasWidth} height={totalHeight} fill={PCB_BG} />
            <Rect
              x={0}
              y={0}
              width={canvasWidth}
              height={totalHeight}
              fill={`url(#${patternId})`}
            />

            {/* Per-Sector Game-Specific Vector Artwork */}
            {sectorLayouts.map((sec, idx) =>
              campaignKind === 'syntax_sprint' ? (
                <SyntaxSprintSectorArtwork
                  key={`art-sprint-${sec.sector}`}
                  width={canvasWidth}
                  sectorTop={sec.bannerTop}
                  sectorIndex={idx}
                />
              ) : campaignKind === 'git_sim' ? (
                <GitGraphSectorArtwork
                  key={`art-git-${sec.sector}`}
                  width={canvasWidth}
                  sectorTop={sec.bannerTop}
                  sectorIndex={idx}
                />
              ) : campaignKind === 'robot_maze' ? (
                <RobotMazeSectorArtwork
                  key={`art-maze-${sec.sector}`}
                  width={canvasWidth}
                  sectorTop={sec.bannerTop}
                  sectorIndex={idx}
                />
              ) : (
                <MicrochipSectorArtwork
                  key={`art-bug-${sec.sector}`}
                  width={canvasWidth}
                  sectorTop={sec.bannerTop}
                  sectorIndex={idx}
                />
              ),
            )}

            {/* Game-Specific Path Connectors (Node 01 -> 30) */}
            {nodeCoords.map((curr, idx) => {
              const next = nodeCoords[idx + 1];
              if (!next) return null;
              const currDone =
                checkLevelStatus(curr.level.levelNumber) === 'completed';

              if (campaignKind === 'syntax_sprint') {
                const { d, apex } = buildChicaneTrackPath(
                  curr.x,
                  curr.y,
                  next.x,
                  next.y,
                  idx,
                );
                return (
                  <G key={`sprint-track-${curr.level.levelNumber}`}>
                    {/* Outer Racing Track Boundary */}
                    <Path
                      d={d}
                      stroke={
                        currDone
                          ? 'rgba(124, 92, 252, 0.22)'
                          : 'rgba(255, 255, 255, 0.06)'
                      }
                      strokeWidth={10}
                      strokeLinecap="round"
                      fill="none"
                    />
                    {currDone ? (
                      <>
                        <Path
                          d={d}
                          stroke="rgba(124, 92, 252, 0.72)"
                          strokeWidth={2.6}
                          strokeLinecap="round"
                          fill="none"
                        />
                        <Path
                          d={d}
                          stroke={EMERALD}
                          strokeWidth={2.2}
                          strokeDasharray="10 6"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <Circle
                          cx={apex.x}
                          cy={apex.y}
                          r={2.8}
                          fill={PCB_BG}
                          stroke={EMERALD}
                          strokeWidth={1.4}
                        />
                      </>
                    ) : (
                      <Path
                        d={d}
                        stroke="rgba(148, 163, 184, 0.20)"
                        strokeWidth={2}
                        strokeDasharray="6 8"
                        strokeLinecap="round"
                        fill="none"
                      />
                    )}
                  </G>
                );
              }

              if (campaignKind === 'git_sim') {
                const { d, mid } = buildGitBranchBezierPath(
                  curr.x,
                  curr.y,
                  next.x,
                  next.y,
                  idx,
                );
                const isTrunkMerge = next.level.isBoss || next.col === 1;
                const branchColor = isTrunkMerge ? VIOLET : CYAN;
                const glowColor = isTrunkMerge
                  ? 'rgba(124, 92, 252, 0.24)'
                  : 'rgba(56, 189, 248, 0.22)';
                return (
                  <G key={`git-branch-${curr.level.levelNumber}`}>
                    {currDone ? (
                      <>
                        <Path
                          d={d}
                          stroke={glowColor}
                          strokeWidth={7.5}
                          strokeLinecap="round"
                          fill="none"
                        />
                        <Path
                          d={d}
                          stroke={branchColor}
                          strokeWidth={2.8}
                          strokeLinecap="round"
                          fill="none"
                        />
                        <Circle
                          cx={mid.x}
                          cy={mid.y}
                          r={3}
                          fill={PCB_BG}
                          stroke={branchColor}
                          strokeWidth={1.5}
                        />
                      </>
                    ) : (
                      <>
                        <Path
                          d={d}
                          stroke="rgba(148, 163, 184, 0.18)"
                          strokeWidth={2}
                          strokeDasharray="6 5"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <Circle
                          cx={mid.x}
                          cy={mid.y}
                          r={2.2}
                          fill={PCB_BG}
                          stroke="rgba(148, 163, 184, 0.24)"
                          strokeWidth={1}
                        />
                      </>
                    )}
                  </G>
                );
              }

              if (campaignKind === 'robot_maze') {
                const { d, corner1, corner2 } =
                  buildRoundedMazeOrthogonalPath(
                    curr.x,
                    curr.y,
                    next.x,
                    next.y,
                    12,
                  );
                return (
                  <G key={`maze-path-${curr.level.levelNumber}`}>
                    {currDone ? (
                      <>
                        <Path
                          d={d}
                          stroke="rgba(124, 92, 252, 0.20)"
                          strokeWidth={7}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <Path
                          d={d}
                          stroke={VIOLET}
                          strokeWidth={2.8}
                          strokeDasharray="4 8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <Circle
                          cx={corner1.x}
                          cy={corner1.y}
                          r={2.4}
                          fill="#A78BFA"
                        />
                        <Circle
                          cx={corner2.x}
                          cy={corner2.y}
                          r={2.4}
                          fill="#A78BFA"
                        />
                      </>
                    ) : (
                      <Path
                        d={d}
                        stroke="rgba(167, 139, 250, 0.20)"
                        strokeWidth={2}
                        strokeDasharray="4 8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    )}
                  </G>
                );
              }

              // Default: Theme 1 — Bug Hunt orthogonal 45°/90° PCB traces
              const { d, via1, via2 } = buildOrthogonalPcbPath(
                curr.x,
                curr.y,
                next.x,
                next.y,
              );
              return (
                <G key={`trace-${curr.level.levelNumber}`}>
                  {currDone ? (
                    <>
                      <Path
                        d={d}
                        stroke="rgba(124, 92, 252, 0.25)"
                        strokeWidth={7.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <Path
                        d={d}
                        stroke={VIOLET}
                        strokeWidth={2.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <Circle
                        cx={via1.x}
                        cy={via1.y}
                        r={3.2}
                        fill={PCB_BG}
                        stroke="#A78BFA"
                        strokeWidth={1.5}
                      />
                      <Circle
                        cx={via2.x}
                        cy={via2.y}
                        r={3.2}
                        fill={PCB_BG}
                        stroke="#A78BFA"
                        strokeWidth={1.5}
                      />
                    </>
                  ) : (
                    <>
                      <Path
                        d={d}
                        stroke="rgba(255, 255, 255, 0.14)"
                        strokeWidth={2}
                        strokeDasharray="6 5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <Circle
                        cx={via1.x}
                        cy={via1.y}
                        r={2.4}
                        fill={PCB_BG}
                        stroke="rgba(255, 255, 255, 0.18)"
                        strokeWidth={1.1}
                      />
                      <Circle
                        cx={via2.x}
                        cy={via2.y}
                        r={2.4}
                        fill={PCB_BG}
                        stroke="rgba(255, 255, 255, 0.18)"
                        strokeWidth={1.1}
                      />
                    </>
                  )}
                </G>
              );
            })}
          </Svg>

          {/* Layer 2: Sector Headers */}
          {sectorLayouts.map((sec) => {
            const sectorStart = (sec.sector - 1) * 10 + 1;
            let sectorStars = 0;
            for (let n = sectorStart; n < sectorStart + 10; n += 1) {
              sectorStars += getLevelStars(n)?.stars ?? 0;
            }
            return (
              <View
                key={`sector-${sec.sector}`}
                style={[styles.sectorBanner, { top: sec.bannerTop }]}
                pointerEvents="none"
              >
                <View style={styles.sectorBannerLeft}>
                  {sectorIconName === 'chip' ? (
                    <MaterialCommunityIcons
                      name="chip"
                      size={15}
                      color={VIOLET}
                    />
                  ) : (
                    <Ionicons
                      name={sectorIconName}
                      size={14}
                      color={
                        campaignKind === 'syntax_sprint'
                          ? EMERALD
                          : campaignKind === 'git_sim'
                            ? CYAN
                            : VIOLET
                      }
                    />
                  )}
                  <Text style={styles.sectorBannerText} numberOfLines={1}>
                    SECTOR {pad2(sec.sector)} · {sec.title.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.sectorStarChip}>
                  <Ionicons name="star" size={10} color={GOLD} />
                  <Text style={styles.sectorStarText}>{sectorStars}/30</Text>
                </View>
              </View>
            );
          })}

          {/* Layer 3: 30 Main-Path Style Cylindrical 3D Nodes */}
          {nodeCoords.map(({ level, x, y }) => {
            const status = checkLevelStatus(level.levelNumber);
            const isCompleted = status === 'completed';
            const isActive = status === 'active';
            const isLocked = status === 'locked';
            const record = getLevelStars(level.levelNumber);
            const isSelected = selectedLevelNum === level.levelNumber;
            const numLabel = pad2(level.levelNumber);

            const puckFace = isCompleted
              ? '#35256B'
              : isActive
                ? '#7C5CFC'
                : '#161720';
            const puckLip = isCompleted
              ? '#211547'
              : isActive
                ? '#4C32B8'
                : '#0D0E14';

            const renderNodeInner = () => {
              if (isLocked) {
                if (level.isBoss) {
                  return (
                    <View style={styles.bossLockedInner}>
                      <Text style={styles.bossLockedNum}>{numLabel}</Text>
                      <View style={styles.bossLockedIcons}>
                        <Ionicons name={bossIconName} size={11} color={CORAL} />
                        <Ionicons
                          name="lock-closed"
                          size={11}
                          color="#64748B"
                        />
                      </View>
                    </View>
                  );
                }
                return <Ionicons name="lock-closed" size={18} color="#475569" />;
              }

              if (campaignKind === 'robot_maze' && isActive) {
                return (
                  <View style={styles.unlockedInner}>
                    <MiniRobotHeadIcon />
                    {level.isBoss ? (
                      <View style={styles.bossTinyTag}>
                        <Text style={styles.bossTinyTagText}>BOSS</Text>
                      </View>
                    ) : null}
                  </View>
                );
              }

              return (
                <View style={styles.unlockedInner}>
                  <Text
                    style={[
                      styles.nodeNumberText,
                      isActive && styles.nodeNumberActive,
                    ]}
                  >
                    {numLabel}
                  </Text>
                  {level.isBoss ? (
                    <View style={styles.bossTinyTag}>
                      <Ionicons
                        name={bossIconName}
                        size={9}
                        color={isActive ? '#FFFFFF' : '#F87171'}
                      />
                      <Text style={styles.bossTinyTagText}>BOSS</Text>
                    </View>
                  ) : null}
                </View>
              );
            };

            const bubbleBoxStyle =
              campaignKind === 'syntax_sprint'
                ? styles.sprintBubbleBox
                : campaignKind === 'git_sim'
                  ? styles.gitBubbleBox
                  : styles.huntBubbleBox;
            const bubbleTriStyle =
              campaignKind === 'syntax_sprint'
                ? styles.sprintBubbleTriangle
                : campaignKind === 'git_sim'
                  ? styles.gitBubbleTriangle
                  : styles.huntBubbleTriangle;
            const bubbleTextStyle =
              campaignKind === 'syntax_sprint'
                ? styles.sprintBubbleText
                : campaignKind === 'git_sim'
                  ? styles.gitBubbleText
                  : styles.huntBubbleText;

            return (
              <View
                key={`node-${level.levelNumber}`}
                style={[
                  styles.nodeSlot,
                  {
                    left: x - 46,
                    top: y - 42,
                    zIndex: isSelected ? 35 : isActive ? 20 : 10,
                  },
                ]}
              >
                {/* Floating Speech Bubble above Active Cylindrical Node */}
                {isActive && !isSelected ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.huntBubbleWrapper,
                      { transform: [{ translateY: bobAnim }] },
                    ]}
                  >
                    <View style={bubbleBoxStyle}>
                      <Text style={bubbleTextStyle}>
                        {activeBubbleLabel}
                      </Text>
                    </View>
                    <View style={bubbleTriStyle} />
                  </Animated.View>
                ) : null}

                {/* Cylindrical 3D Puck */}
                {isActive ? (
                  <View style={styles.activeConcentricRing}>
                    <Tactile3DNode
                      faceColor={puckFace}
                      lipColor={puckLip}
                      borderColor={isSelected ? '#FFFFFF' : undefined}
                      borderWidth={isSelected ? 1.5 : 0}
                      showGloss
                      onPress={() => handleNodePress(level.levelNumber)}
                    >
                      {renderNodeInner()}
                    </Tactile3DNode>
                  </View>
                ) : (
                  <Tactile3DNode
                    faceColor={puckFace}
                    lipColor={puckLip}
                    borderColor={
                      isSelected
                        ? '#FFFFFF'
                        : isLocked && level.isBoss
                          ? 'rgba(248, 81, 73, 0.35)'
                          : undefined
                    }
                    borderWidth={isSelected ? 1.5 : isLocked && level.isBoss ? 1 : 0}
                    showGloss={!isLocked}
                    glossOpacity={isCompleted ? 0.14 : 0.11}
                    onPress={() => handleNodePress(level.levelNumber)}
                  >
                    {renderNodeInner()}
                  </Tactile3DNode>
                )}

                {/* Star Pill beneath Completed Cylindrical Nodes */}
                {isCompleted && record ? (
                  <View style={styles.starPill} pointerEvents="none">
                    {[1, 2, 3].map((idx) => (
                      <Ionicons
                        key={idx}
                        name="star"
                        size={11}
                        color={idx <= record.stars ? GOLD : STAR_EMPTY}
                      />
                    ))}
                  </View>
                ) : level.isBoss && isActive ? (
                  <View style={styles.bossRewardPill} pointerEvents="none">
                    <GemIcon size={11} />
                    <Text style={styles.bossRewardPillText}>+25</Text>
                  </View>
                ) : null}
              </View>
            );
          })}

          {/* Layer 4: Anchored Spring Popover */}
          {selectedCoord && selectedStatus && popoverPlacement ? (
            <Animated.View
              style={[
                styles.popoverWrap,
                {
                  left: popoverPlacement.left,
                  ...(popoverPlacement.top !== undefined
                    ? { top: popoverPlacement.top }
                    : { bottom: popoverPlacement.bottom }),
                  opacity: popoverOpacity,
                  transform: [{ scale: popoverScale }],
                },
              ]}
            >
              {popoverPlacement.placeBelow ? (
                <View
                  style={[
                    styles.arrowTopWrap,
                    { left: popoverPlacement.arrowOffset - 9 },
                  ]}
                  pointerEvents="none"
                >
                  <Svg width={18} height={10}>
                    <Polygon
                      points="9,0 18,10 0,10"
                      fill={selectedStatus === 'locked' ? '#1C1D26' : '#161426'}
                    />
                  </Svg>
                </View>
              ) : null}

              <Pressable
                onPress={() => undefined}
                style={[
                  styles.popoverCard,
                  selectedStatus === 'locked' && styles.popoverCardLocked,
                ]}
              >
                <View style={styles.popoverHeaderRow}>
                  <Text style={styles.popoverTitle} numberOfLines={2}>
                    Level {pad2(selectedCoord.level.levelNumber)}:{' '}
                    {selectedCoord.level.title}
                  </Text>
                  <View
                    style={[
                      styles.popoverCountChip,
                      selectedCoord.level.isBoss && styles.popoverBossChip,
                    ]}
                  >
                    {selectedCoord.level.isBoss ? (
                      <Ionicons name={bossIconName} size={10} color={CORAL} />
                    ) : null}
                    <Text
                      style={[
                        styles.popoverCountText,
                        selectedCoord.level.isBoss && styles.popoverBossText,
                      ]}
                    >
                      {selectedCoord.level.chipBadge}
                    </Text>
                  </View>
                </View>

                {selectedStatus === 'locked' ? (
                  <View style={styles.popoverLockedBody}>
                    <Ionicons name="lock-closed" size={14} color="#71717A" />
                    <Text style={styles.popoverLockedText}>
                      Clear Level {pad2(selectedCoord.level.levelNumber - 1)} to
                      unlock this sector node!
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.popoverMetaRow}>
                      <Text style={styles.popoverTargetLabel}>Target:</Text>
                      <View style={styles.popoverStarsInline}>
                        <Ionicons name="star" size={12} color={GOLD} />
                        <Ionicons name="star" size={12} color={GOLD} />
                        <Ionicons name="star" size={12} color={GOLD} />
                      </View>
                      <Text style={styles.popoverTargetTime}>
                        {selectedCoord.level.targetLabel}
                      </Text>
                      {selectedRecord ? (
                        <Text style={styles.popoverBestTime}>
                          · {selectedRecord.bestLabel}
                        </Text>
                      ) : null}
                    </View>

                    <Pressable
                      onPress={() => {
                        mediumHaptic();
                        playSound('run_code');
                        const levelNum = selectedCoord.level.levelNumber;
                        setSelectedLevelNum(null);
                        onSelectLevel(levelNum);
                      }}
                      style={({ pressed }) => [
                        styles.popoverCta,
                        pressed && styles.popoverCtaPressed,
                      ]}
                    >
                      <Text style={styles.popoverCtaText}>
                        {selectedStatus === 'completed'
                          ? selectedRecord && selectedRecord.stars >= 3
                            ? `REPLAY LEVEL ${pad2(selectedCoord.level.levelNumber)}`
                            : 'REPLAY FOR ★★★'
                          : `START LEVEL ${pad2(selectedCoord.level.levelNumber)}`}
                      </Text>
                    </Pressable>
                  </>
                )}
              </Pressable>

              {!popoverPlacement.placeBelow ? (
                <View
                  style={[
                    styles.arrowBottomWrap,
                    { left: popoverPlacement.arrowOffset - 9 },
                  ]}
                  pointerEvents="none"
                >
                  <Svg width={18} height={10}>
                    <Polygon
                      points="0,0 18,0 9,10"
                      fill={selectedStatus === 'locked' ? '#1C1D26' : '#161426'}
                    />
                  </Svg>
                </View>
              ) : null}
            </Animated.View>
          ) : null}
        </Pressable>
      </ScrollView>
    </View>
  );
}

export const CampaignMapModal = BugCampaignMap;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PCB_BG,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: PCB_BG,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#151422',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  backText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  headerTitle: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.2,
  },
  totalStarsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#171522',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
  },
  totalStarsValue: {
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  totalStarsMax: {
    color: '#A1A1AA',
    fontWeight: '600',
  },
  recoveryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 63, 94, 0.24)',
  },
  recoveryStripText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#FDA4AF',
  },
  langStripWrap: {
    backgroundColor: '#0E0D17',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  langStripContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#161522',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langPillActive: {
    backgroundColor: VIOLET,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  langPillLabel: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  langPillLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  langMiniStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: 'rgba(11, 10, 18, 0.55)',
  },
  langMiniStarsActive: {
    backgroundColor: 'rgba(11, 10, 18, 0.35)',
  },
  langMiniStarsText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  pcbCanvas: {
    width: '100%',
    position: 'relative',
  },
  sectorBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: SECTOR_HEADER_H,
    borderRadius: 10,
    backgroundColor: '#12111D',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.28)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectorBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectorBannerText: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D4D4D8',
    letterSpacing: 0.4,
  },
  sectorStarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#191728',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectorStarText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.2,
  },
  nodeSlot: {
    position: 'absolute',
    width: 92,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeConcentricRing: {
    padding: 6,
    borderRadius: 48,
    backgroundColor: '#12131C',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 92, 252, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  huntBubbleWrapper: {
    position: 'absolute',
    top: -27,
    alignItems: 'center',
    zIndex: 40,
  },
  huntBubbleBox: {
    backgroundColor: '#7C5CFC',
    borderWidth: 1.5,
    borderColor: '#A78BFA',
    borderBottomWidth: 3,
    borderBottomColor: '#4C35B5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  huntBubbleText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.7,
  },
  huntBubbleTriangle: {
    width: 8,
    height: 8,
    backgroundColor: '#7C5CFC',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#4C35B5',
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
  sprintBubbleBox: {
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    borderBottomWidth: 3,
    borderBottomColor: '#047857',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  sprintBubbleText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.7,
  },
  sprintBubbleTriangle: {
    width: 8,
    height: 8,
    backgroundColor: '#10B981',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#047857',
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
  gitBubbleBox: {
    backgroundColor: '#0EA5E9',
    borderWidth: 1.5,
    borderColor: '#7DD3FC',
    borderBottomWidth: 3,
    borderBottomColor: '#0369A1',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  gitBubbleText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.7,
  },
  gitBubbleTriangle: {
    width: 8,
    height: 8,
    backgroundColor: '#0EA5E9',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#0369A1',
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
  unlockedInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeNumberText: {
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: '800',
    color: '#E4E4E7',
    letterSpacing: -0.4,
    lineHeight: 21,
  },
  nodeNumberActive: {
    color: '#FFFFFF',
  },
  bossTinyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  bossTinyTagText: {
    fontFamily: MONO,
    fontSize: 8,
    fontWeight: '800',
    color: '#FCA5A5',
    letterSpacing: 0.3,
  },
  bossLockedInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  bossLockedNum: {
    fontFamily: MONO,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: -0.2,
  },
  bossLockedIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starPill: {
    position: 'absolute',
    top: 73,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bossRewardPill: {
    position: 'absolute',
    top: 81,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: '#131624',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.30)',
  },
  bossRewardPillText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: CYAN,
  },
  popoverWrap: {
    position: 'absolute',
    width: POPOVER_W,
    zIndex: 60,
  },
  arrowTopWrap: {
    position: 'absolute',
    top: -9,
    zIndex: 62,
  },
  arrowBottomWrap: {
    position: 'absolute',
    bottom: -9,
    zIndex: 62,
  },
  popoverCard: {
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: '#161426',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 14,
    gap: 9,
  },
  popoverCardLocked: {
    backgroundColor: '#1C1D26',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  popoverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  popoverTitle: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
    lineHeight: 19,
  },
  popoverCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.35)',
  },
  popoverBossChip: {
    backgroundColor: 'rgba(248, 81, 73, 0.14)',
    borderColor: 'rgba(248, 81, 73, 0.35)',
  },
  popoverCountText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    color: '#C4B5FD',
    letterSpacing: 0.4,
  },
  popoverBossText: {
    color: CORAL,
  },
  popoverLockedBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popoverLockedText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 12.5,
    color: '#A1A1AA',
    lineHeight: 17,
  },
  popoverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  popoverTargetLabel: {
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#A1A1AA',
  },
  popoverStarsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  popoverTargetTime: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: -0.2,
  },
  popoverBestTime: {
    fontFamily: MONO,
    fontSize: 11.5,
    color: '#A1A1AA',
    letterSpacing: -0.2,
  },
  popoverCta: {
    height: 40,
    borderRadius: 999,
    backgroundColor: VIOLET,
    borderBottomWidth: 3,
    borderBottomColor: '#5639D6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  popoverCtaPressed: {
    opacity: 0.88,
  },
  popoverCtaText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  pressedFade: {
    opacity: 0.84,
  },
});
