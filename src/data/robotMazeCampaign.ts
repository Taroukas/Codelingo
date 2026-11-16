export const ROBOT_MAZE_TOTAL_LEVELS = 30;
export const ROBOT_MAZE_MAX_STARS = 90;

export type MazeDir = 'N' | 'E' | 'S' | 'W';

export type MazeInstructionKind =
  | 'move_forward()'
  | 'turn_left()'
  | 'turn_right()'
  | 'repeat(2):'
  | 'repeat(3):'
  | 'repeat(4):'
  | 'if_laser_ahead():'
  | 'disable_laser()'
  | 'if_path_clear():'
  | 'jump()'
  | 'end_block';

export interface MazeCoord {
  r: number;
  c: number;
}

export interface MazeProgramLine {
  id: string;
  kind: Exclude<MazeInstructionKind, 'end_block'>;
  indent: number;
}

export interface RobotMazeLevel {
  levelNumber: number;
  sector: 1 | 2 | 3;
  sectorTitle: string;
  title: string;
  isBoss: boolean;
  rows: number;
  cols: number;
  start: { r: number; c: number; dir: MazeDir };
  exit: MazeCoord;
  walls: MazeCoord[];
  lasers: MazeCoord[];
  cores: MazeCoord[];
  maxOptimalBlocks: number;
  xpReward: number;
  gemReward: number;
  availablePills: readonly MazeInstructionKind[];
  solution: readonly { kind: Exclude<MazeInstructionKind, 'end_block'>; indent: number }[];
  hintText: string;
}

export interface MazeExecutionStep {
  lineIndex: number;
  r: number;
  c: number;
  dir: MazeDir;
  collectedCoreKeys: string[];
  disabledLaserKeys: string[];
  status: 'step' | 'collect' | 'laser_off' | 'crash' | 'win';
  reason?: string;
}

export const ROBOT_MAZE_SECTORS: Record<
  1 | 2 | 3,
  { sector: 1 | 2 | 3; title: string; subtitle: string }
> = {
  1: {
    sector: 1,
    title: 'Sequential Navigation & Cores',
    subtitle: 'Guide Robo through PCB tiles, collect data cores & reach the portal',
  },
  2: {
    sector: 2,
    title: 'Loop Optimization (repeat)',
    subtitle: 'Compress repetitive movement into repeat(n): blocks for ★★★ efficiency',
  },
  3: {
    sector: 3,
    title: 'Conditionals, Lasers & Jump',
    subtitle: 'Disable laser gates with if_laser_ahead(): and jump firewall gaps',
  },
};

export function coordKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function computeRobotMazeStars(
  blocksUsed: number,
  maxOptimalBlocks: number,
  collectedAllCores: boolean,
): 1 | 2 | 3 {
  if (blocksUsed <= maxOptimalBlocks && collectedAllCores) return 3;
  if (blocksUsed <= maxOptimalBlocks + 2) return 2;
  return 1;
}

function deltaForDir(dir: MazeDir): { dr: number; dc: number } {
  switch (dir) {
    case 'N':
      return { dr: -1, dc: 0 };
    case 'E':
      return { dr: 0, dc: 1 };
    case 'S':
      return { dr: 1, dc: 0 };
    case 'W':
      return { dr: 0, dc: -1 };
  }
}

function rotateLeft(dir: MazeDir): MazeDir {
  switch (dir) {
    case 'N':
      return 'W';
    case 'W':
      return 'S';
    case 'S':
      return 'E';
    case 'E':
      return 'N';
  }
}

function rotateRight(dir: MazeDir): MazeDir {
  switch (dir) {
    case 'N':
      return 'E';
    case 'E':
      return 'S';
    case 'S':
      return 'W';
    case 'W':
      return 'N';
  }
}

export function simulateRobotProgram(
  level: RobotMazeLevel,
  lines: readonly MazeProgramLine[],
): {
  steps: MazeExecutionStep[];
  won: boolean;
  collectedAllCores: boolean;
  crashReason: string | null;
  crashLineIndex: number | null;
} {
  const wallSet = new Set(level.walls.map((w) => coordKey(w.r, w.c)));
  const initialLasers = new Set(level.lasers.map((l) => coordKey(l.r, l.c)));
  const allCores = new Set(level.cores.map((d) => coordKey(d.r, d.c)));

  let r = level.start.r;
  let c = level.start.c;
  let dir: MazeDir = level.start.dir;
  const collected = new Set<string>();
  const disabledLasers = new Set<string>();
  const steps: MazeExecutionStep[] = [];

  if (allCores.has(coordKey(r, c))) {
    collected.add(coordKey(r, c));
  }

  let crashedReason: string | null = null;
  let crashedLineIdx: number | null = null;
  let reachedExit = false;
  let safetyCounter = 0;

  const snapshot = (
    lineIndex: number,
    status: MazeExecutionStep['status'],
    reason?: string,
  ) => {
    steps.push({
      lineIndex,
      r,
      c,
      dir,
      collectedCoreKeys: Array.from(collected),
      disabledLaserKeys: Array.from(disabledLasers),
      status,
      reason,
    });
  };

  const isTileBlocked = (tr: number, tc: number): 'bounds' | 'wall' | 'laser' | null => {
    if (tr < 0 || tr >= level.rows || tc < 0 || tc >= level.cols) return 'bounds';
    const k = coordKey(tr, tc);
    if (wallSet.has(k)) return 'wall';
    if (initialLasers.has(k) && !disabledLasers.has(k)) return 'laser';
    return null;
  };

  const executeRange = (startIdx: number, endIdx: number, expectedIndent: number) => {
    let i = startIdx;
    while (i < endIdx) {
      if (crashedReason || reachedExit) return;
      safetyCounter += 1;
      if (safetyCounter > 80) {
        crashedReason = 'Execution exceeded 80 steps (infinite loop guard).';
        crashedLineIdx = i;
        snapshot(i, 'crash', crashedReason);
        return;
      }

      const line = lines[i];
      if (!line || line.indent < expectedIndent) {
        i += 1;
        continue;
      }

      const kind = line.kind;

      // Check block headers (`repeat` or `if`)
      if (
        kind === 'repeat(2):' ||
        kind === 'repeat(3):' ||
        kind === 'repeat(4):' ||
        kind === 'if_laser_ahead():' ||
        kind === 'if_path_clear():'
      ) {
        // Find children with indent > line.indent
        let childEnd = i + 1;
        while (childEnd < endIdx && lines[childEnd].indent > line.indent) {
          childEnd += 1;
        }

        if (kind.startsWith('repeat(')) {
          const count = kind === 'repeat(2):' ? 2 : kind === 'repeat(3):' ? 3 : 4;
          snapshot(i, 'step');
          for (let rep = 0; rep < count; rep += 1) {
            if (crashedReason || reachedExit) return;
            if (childEnd > i + 1) {
              executeRange(i + 1, childEnd, line.indent + 1);
            }
          }
        } else if (kind === 'if_laser_ahead():') {
          const { dr, dc } = deltaForDir(dir);
          const nr = r + dr;
          const nc = c + dc;
          const nk = coordKey(nr, nc);
          const hasLaserAhead = initialLasers.has(nk) && !disabledLasers.has(nk);
          snapshot(i, 'step');
          if (hasLaserAhead && childEnd > i + 1) {
            executeRange(i + 1, childEnd, line.indent + 1);
          }
        } else if (kind === 'if_path_clear():') {
          const { dr, dc } = deltaForDir(dir);
          const blocked = isTileBlocked(r + dr, c + dc);
          snapshot(i, 'step');
          if (!blocked && childEnd > i + 1) {
            executeRange(i + 1, childEnd, line.indent + 1);
          }
        }

        i = childEnd;
        continue;
      }

      // Leaf instructions
      if (kind === 'turn_left()') {
        dir = rotateLeft(dir);
        snapshot(i, 'step');
      } else if (kind === 'turn_right()') {
        dir = rotateRight(dir);
        snapshot(i, 'step');
      } else if (kind === 'disable_laser()') {
        const { dr, dc } = deltaForDir(dir);
        const nk = coordKey(r + dr, c + dc);
        if (initialLasers.has(nk)) {
          disabledLasers.add(nk);
        }
        snapshot(i, 'laser_off');
      } else if (kind === 'move_forward()' || kind === 'jump()') {
        const { dr, dc } = deltaForDir(dir);
        const stepDist = kind === 'jump()' ? 2 : 1;
        const nr = r + dr * stepDist;
        const nc = c + dc * stepDist;
        const blockType = isTileBlocked(nr, nc);

        if (blockType === 'bounds') {
          crashedReason = 'Robo stepped outside the PCB grid boundary!';
          crashedLineIdx = i;
          snapshot(i, 'crash', crashedReason);
          return;
        }
        if (blockType === 'wall') {
          r = nr;
          c = nc;
          crashedReason = 'Collision with a solid firewall memory block!';
          crashedLineIdx = i;
          snapshot(i, 'crash', crashedReason);
          return;
        }
        if (blockType === 'laser') {
          r = nr;
          c = nc;
          crashedReason = 'Hit an active red laser barrier! Use `disable_laser()` first.';
          crashedLineIdx = i;
          snapshot(i, 'crash', crashedReason);
          return;
        }

        r = nr;
        c = nc;
        const curKey = coordKey(r, c);
        if (allCores.has(curKey) && !collected.has(curKey)) {
          collected.add(curKey);
          snapshot(i, 'collect');
        } else {
          snapshot(i, 'step');
        }

        if (r === level.exit.r && c === level.exit.c) {
          reachedExit = true;
          snapshot(i, 'win');
          return;
        }
      }

      i += 1;
    }
  };

  executeRange(0, lines.length, 0);

  const collectedAllCores = collected.size >= allCores.size;
  if (!crashedReason && !reachedExit) {
    crashedReason =
      lines.length === 0
        ? 'Add instruction blocks before running.'
        : 'Program finished before Robo reached the exit portal.';
    crashedLineIdx = Math.max(0, lines.length - 1);
  }

  return {
    steps,
    won: reachedExit && !crashedReason,
    collectedAllCores,
    crashReason: crashedReason,
    crashLineIndex: crashedLineIdx,
  };
}

interface MazeBlueprint {
  title: string;
  rows: number;
  cols: number;
  start: { r: number; c: number; dir: MazeDir };
  exit: MazeCoord;
  walls: MazeCoord[];
  lasers: MazeCoord[];
  cores: MazeCoord[];
  maxOptimalBlocks: number;
  availablePills: readonly MazeInstructionKind[];
  solution: readonly { kind: Exclude<MazeInstructionKind, 'end_block'>; indent: number }[];
  hintText: string;
}

const SECTOR_1_BLUEPRINTS: readonly MazeBlueprint[] = [
  {
    title: 'Straight Data Bus',
    rows: 4,
    cols: 5,
    start: { r: 1, c: 0, dir: 'E' },
    exit: { r: 1, c: 3 },
    walls: [
      { r: 0, c: 2 },
      { r: 2, c: 1 },
    ],
    lasers: [],
    cores: [{ r: 1, c: 2 }],
    maxOptimalBlocks: 3,
    availablePills: ['move_forward()', 'turn_left()', 'turn_right()'],
    solution: [
      { kind: 'move_forward()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
    ],
    hintText: 'Queue 3 `move_forward()` instructions to collect the core and enter the portal.',
  },
  {
    title: 'Right-Angle Corner',
    rows: 4,
    cols: 5,
    start: { r: 0, c: 0, dir: 'E' },
    exit: { r: 2, c: 2 },
    walls: [
      { r: 0, c: 3 },
      { r: 1, c: 0 },
    ],
    lasers: [],
    cores: [{ r: 0, c: 2 }, { r: 1, c: 2 }],
    maxOptimalBlocks: 5,
    availablePills: ['move_forward()', 'turn_right()', 'turn_left()'],
    solution: [
      { kind: 'move_forward()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
      { kind: 'turn_right()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
    ],
    hintText: 'Move 2 tiles East, `turn_right()`, then move 2 tiles South.',
  },
  {
    title: 'Firewall Bypass',
    rows: 4,
    cols: 5,
    start: { r: 2, c: 0, dir: 'E' },
    exit: { r: 1, c: 2 },
    walls: [{ r: 2, c: 2 }],
    lasers: [],
    cores: [{ r: 2, c: 1 }],
    maxOptimalBlocks: 4,
    availablePills: ['move_forward()', 'turn_left()', 'turn_right()'],
    solution: [
      { kind: 'move_forward()', indent: 0 },
      { kind: 'turn_left()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
      { kind: 'turn_right()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
    ],
    hintText: 'Step forward onto the core, `turn_left()`, step North, `turn_right()`, and step into the portal.',
  },
  {
    title: 'Dual Core Zig-Zag',
    rows: 4,
    cols: 5,
    start: { r: 0, c: 1, dir: 'S' },
    exit: { r: 2, c: 3 },
    walls: [{ r: 2, c: 1 }, { r: 0, c: 3 }],
    lasers: [],
    cores: [{ r: 1, c: 1 }, { r: 1, c: 3 }],
    maxOptimalBlocks: 6,
    availablePills: ['move_forward()', 'turn_left()', 'turn_right()'],
    solution: [
      { kind: 'move_forward()', indent: 0 },
      { kind: 'turn_left()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
      { kind: 'turn_right()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
    ],
    hintText: 'Step South to grab the first core, turn East for 2 tiles, then turn South into the portal.',
  },
  {
    title: 'Northbound Trace',
    rows: 4,
    cols: 5,
    start: { r: 3, c: 1, dir: 'N' },
    exit: { r: 1, c: 3 },
    walls: [{ r: 0, c: 1 }, { r: 2, c: 2 }],
    lasers: [],
    cores: [{ r: 1, c: 1 }, { r: 1, c: 2 }],
    maxOptimalBlocks: 5,
    availablePills: ['move_forward()', 'turn_right()', 'turn_left()'],
    solution: [
      { kind: 'move_forward()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
      { kind: 'turn_right()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
      { kind: 'move_forward()', indent: 0 },
    ],
    hintText: 'Move 2 tiles North, `turn_right()`, and move 2 tiles East.',
  },
];

const SECTOR_2_BLUEPRINTS: readonly MazeBlueprint[] = [
  {
    title: 'Repeat(4) Corridor',
    rows: 4,
    cols: 5,
    start: { r: 1, c: 0, dir: 'E' },
    exit: { r: 1, c: 4 },
    walls: [
      { r: 0, c: 1 },
      { r: 0, c: 3 },
      { r: 2, c: 2 },
    ],
    lasers: [],
    cores: [
      { r: 1, c: 1 },
      { r: 1, c: 2 },
      { r: 1, c: 3 },
    ],
    maxOptimalBlocks: 2,
    availablePills: ['repeat(4):', 'move_forward()', 'turn_right()', 'End Block ↵' as MazeInstructionKind],
    solution: [
      { kind: 'repeat(4):', indent: 0 },
      { kind: 'move_forward()', indent: 1 },
    ],
    hintText: 'Use `repeat(4):` with an indented `move_forward()` to cross the 4 tiles in just 2 blocks!',
  },
  {
    title: 'Staircase Loop',
    rows: 4,
    cols: 5,
    start: { r: 0, c: 0, dir: 'E' },
    exit: { r: 3, c: 3 },
    walls: [
      { r: 1, c: 0 },
      { r: 2, c: 1 },
      { r: 3, c: 2 },
    ],
    lasers: [],
    cores: [
      { r: 0, c: 1 },
      { r: 1, c: 2 },
      { r: 2, c: 3 },
    ],
    maxOptimalBlocks: 5,
    availablePills: [
      'repeat(3):',
      'move_forward()',
      'turn_right()',
      'turn_left()',
      'end_block',
    ],
    solution: [
      { kind: 'repeat(3):', indent: 0 },
      { kind: 'move_forward()', indent: 1 },
      { kind: 'turn_right()', indent: 1 },
      { kind: 'move_forward()', indent: 1 },
      { kind: 'turn_left()', indent: 1 },
    ],
    hintText: 'Inside `repeat(3):`, chain `move_forward()`, `turn_right()`, `move_forward()`, `turn_left()`.',
  },
  {
    title: 'Perimeter Sweep',
    rows: 4,
    cols: 5,
    start: { r: 0, c: 0, dir: 'E' },
    exit: { r: 3, c: 3 },
    walls: [{ r: 1, c: 1 }, { r: 2, c: 2 }],
    lasers: [],
    cores: [{ r: 0, c: 3 }, { r: 2, c: 3 }],
    maxOptimalBlocks: 5,
    availablePills: [
      'repeat(3):',
      'move_forward()',
      'turn_right()',
      'turn_left()',
      'end_block',
    ],
    solution: [
      { kind: 'repeat(3):', indent: 0 },
      { kind: 'move_forward()', indent: 1 },
      { kind: 'turn_right()', indent: 0 },
      { kind: 'repeat(3):', indent: 0 },
      { kind: 'move_forward()', indent: 1 },
    ],
    hintText: 'Run `repeat(3): move_forward()`, exit the block with `End Block ↵`, `turn_right()`, and `repeat(3): move_forward()`.',
  },
  {
    title: 'Double Corner Sprint',
    rows: 4,
    cols: 5,
    start: { r: 0, c: 0, dir: 'E' },
    exit: { r: 2, c: 0 },
    walls: [{ r: 1, c: 0 }, { r: 1, c: 1 }],
    lasers: [],
    cores: [{ r: 0, c: 2 }, { r: 2, c: 2 }],
    maxOptimalBlocks: 4,
    availablePills: [
      'repeat(3):',
      'repeat(2):',
      'move_forward()',
      'turn_right()',
      'end_block',
    ],
    solution: [
      { kind: 'repeat(3):', indent: 0 },
      { kind: 'move_forward()', indent: 1 },
      { kind: 'move_forward()', indent: 1 },
      { kind: 'turn_right()', indent: 1 },
    ],
    hintText: 'Use `repeat(3):` containing two `move_forward()` calls and a `turn_right()` to trace 3 sides of the square!',
  },
];

const SECTOR_3_BLUEPRINTS: readonly MazeBlueprint[] = [
  {
    title: 'Laser Gate Disarm',
    rows: 4,
    cols: 5,
    start: { r: 1, c: 0, dir: 'E' },
    exit: { r: 1, c: 4 },
    walls: [{ r: 0, c: 2 }, { r: 2, c: 2 }],
    lasers: [{ r: 1, c: 2 }],
    cores: [{ r: 1, c: 1 }, { r: 1, c: 3 }],
    maxOptimalBlocks: 4,
    availablePills: [
      'repeat(4):',
      'if_laser_ahead():',
      'disable_laser()',
      'move_forward()',
      'end_block',
    ],
    solution: [
      { kind: 'repeat(4):', indent: 0 },
      { kind: 'if_laser_ahead():', indent: 1 },
      { kind: 'disable_laser()', indent: 2 },
      { kind: 'move_forward()', indent: 1 },
    ],
    hintText: 'Inside `repeat(4):`, check `if_laser_ahead(): disable_laser()`, then `move_forward()`.',
  },
  {
    title: 'Firewall Gap Jump',
    rows: 4,
    cols: 5,
    start: { r: 1, c: 0, dir: 'E' },
    exit: { r: 1, c: 4 },
    walls: [
      { r: 0, c: 1 },
      { r: 1, c: 1 },
      { r: 2, c: 1 },
      { r: 0, c: 3 },
      { r: 1, c: 3 },
      { r: 2, c: 3 },
    ],
    lasers: [],
    cores: [{ r: 1, c: 2 }],
    maxOptimalBlocks: 2,
    availablePills: ['repeat(2):', 'jump()', 'move_forward()', 'turn_right()', 'end_block'],
    solution: [
      { kind: 'repeat(2):', indent: 0 },
      { kind: 'jump()', indent: 1 },
    ],
    hintText: 'Use `repeat(2):` with `jump()` to leap over both firewall walls (`c=1` and `c=3`)!',
  },
  {
    title: 'Laser & Turn Matrix',
    rows: 4,
    cols: 5,
    start: { r: 0, c: 0, dir: 'E' },
    exit: { r: 3, c: 3 },
    walls: [{ r: 1, c: 1 }, { r: 2, c: 1 }],
    lasers: [{ r: 0, c: 2 }, { r: 2, c: 3 }],
    cores: [{ r: 0, c: 3 }, { r: 1, c: 3 }],
    maxOptimalBlocks: 6,
    availablePills: [
      'repeat(3):',
      'if_laser_ahead():',
      'disable_laser()',
      'move_forward()',
      'turn_right()',
      'end_block',
    ],
    solution: [
      { kind: 'repeat(3):', indent: 0 },
      { kind: 'if_laser_ahead():', indent: 1 },
      { kind: 'disable_laser()', indent: 2 },
      { kind: 'move_forward()', indent: 1 },
      { kind: 'turn_right()', indent: 0 },
      { kind: 'repeat(3):', indent: 0 },
      { kind: 'if_laser_ahead():', indent: 1 },
      { kind: 'disable_laser()', indent: 2 },
      { kind: 'move_forward()', indent: 1 },
    ],
    hintText: 'Disarm lasers along the top row, `turn_right()`, and disarm the laser on the East column.',
  },
];

export function getRobotMazeLevel(levelNumber: number): RobotMazeLevel {
  const safeNum = Math.max(1, Math.min(ROBOT_MAZE_TOTAL_LEVELS, levelNumber));
  const sector: 1 | 2 | 3 = safeNum <= 10 ? 1 : safeNum <= 20 ? 2 : 3;
  const isBoss = safeNum === 10 || safeNum === 20 || safeNum === 30;

  const pool =
    sector === 1
      ? SECTOR_1_BLUEPRINTS
      : sector === 2
        ? SECTOR_2_BLUEPRINTS
        : SECTOR_3_BLUEPRINTS;
  const blueprint = pool[(safeNum - 1) % pool.length];

  return {
    levelNumber: safeNum,
    sector,
    sectorTitle: ROBOT_MAZE_SECTORS[sector].title,
    title: isBoss ? `BOSS: ${blueprint.title}` : blueprint.title,
    isBoss,
    rows: blueprint.rows,
    cols: blueprint.cols,
    start: { ...blueprint.start },
    exit: { ...blueprint.exit },
    walls: blueprint.walls.map((w) => ({ ...w })),
    lasers: blueprint.lasers.map((l) => ({ ...l })),
    cores: blueprint.cores.map((d) => ({ ...d })),
    maxOptimalBlocks: Math.max(blueprint.maxOptimalBlocks, blueprint.solution.length),
    xpReward: isBoss ? 55 : 22 + sector * 5,
    gemReward: isBoss ? 25 : 8 + sector * 2,
    availablePills: blueprint.availablePills,
    solution: blueprint.solution,
    hintText: blueprint.hintText,
  };
}

export function getRobotMazeLevels(): RobotMazeLevel[] {
  const list: RobotMazeLevel[] = [];
  for (let lvl = 1; lvl <= ROBOT_MAZE_TOTAL_LEVELS; lvl += 1) {
    list.push(getRobotMazeLevel(lvl));
  }
  return list;
}
