export const GIT_CAMPAIGN_TOTAL_LEVELS = 30;
export const GIT_CAMPAIGN_MAX_STARS = 90;

export type GitLaneColor = 'violet' | 'cyan' | 'amber';

export interface GitCommitNode {
  id: string;
  label: string;
  lane: 0 | 1 | 2;
  row: number;
  parents: string[];
  color: GitLaneColor;
}

export interface GitConflictSpec {
  file: string;
  headBranch: string;
  incomingBranch: string;
  headCode: string;
  incomingCode: string;
  requiredResolution: 'current' | 'incoming' | 'both';
  explanation: string;
}

export interface GitGraphState {
  commits: GitCommitNode[];
  branches: Record<string, string>;
  head: {
    ref: string;
    isDetached?: boolean;
  };
  activeConflict?: GitConflictSpec | null;
  conflictResolved?: boolean;
}

export interface GitGhostNode {
  id: string;
  label: string;
  lane: 0 | 1 | 2;
  row: number;
  parents: string[];
  targetBranch?: string;
}

export interface GitCampaignLevel {
  levelNumber: number;
  sector: 1 | 2 | 3;
  sectorTitle: string;
  title: string;
  isBoss: boolean;
  goalText: string;
  parMoves: number;
  xpReward: number;
  gemReward: number;
  initialState: GitGraphState;
  ghostNodes: GitGhostNode[];
  expectedSteps: readonly { action: string; target?: string }[];
  actionTokens: readonly string[];
  targetTokens: readonly string[];
  conflictSpec?: GitConflictSpec;
}

export const GIT_CAMPAIGN_SECTORS: Record<
  1 | 2 | 3,
  { sector: 1 | 2 | 3; title: string; subtitle: string }
> = {
  1: {
    sector: 1,
    title: 'Commits, Branches & HEAD',
    subtitle: 'Create commits, spawn feature branches & switch HEAD pointers',
  },
  2: {
    sector: 2,
    title: 'Merging, Fast-Forward & Reset',
    subtitle: '3-way merges, fast-forward joins, branch cleanup & git reset',
  },
  3: {
    sector: 3,
    title: 'Rebase, Cherry-Pick & Conflicts',
    subtitle: 'Linearize history, cherry-pick hotfixes & resolve diff conflicts',
  },
};

export function computeGitSimStars(movesUsed: number, parMoves: number): 1 | 2 | 3 {
  if (movesUsed <= parMoves) return 3;
  if (movesUsed <= parMoves + 1) return 2;
  return 1;
}

export function cloneGitGraphState(state: GitGraphState): GitGraphState {
  return {
    commits: state.commits.map((c) => ({ ...c, parents: [...c.parents] })),
    branches: { ...state.branches },
    head: { ...state.head },
    activeConflict: state.activeConflict ? { ...state.activeConflict } : null,
    conflictResolved: Boolean(state.conflictResolved),
  };
}

export function resolveHeadCommitId(state: GitGraphState): string {
  if (state.head.isDetached) return state.head.ref;
  return state.branches[state.head.ref] ?? state.commits[state.commits.length - 1]?.id ?? 'c1';
}

export function executeGitCommandOnState(
  prevState: GitGraphState,
  action: string,
  target: string | null,
  level: GitCampaignLevel,
): {
  nextState: GitGraphState;
  ok: boolean;
  feedback: string;
  triggeredConflict?: boolean;
} {
  const next = cloneGitGraphState(prevState);
  const cleanAction = action.trim();
  const cleanTarget = (target ?? '').trim();

  if (next.activeConflict && !next.conflictResolved) {
    return {
      nextState: prevState,
      ok: false,
      feedback: 'Resolve the active merge conflict in the diff card first!',
    };
  }

  const headCommitId = resolveHeadCommitId(next);
  const headCommit = next.commits.find((c) => c.id === headCommitId);
  const headRow = headCommit?.row ?? 0;
  const headLane = headCommit?.lane ?? 0;

  // 1. commit -m
  if (cleanAction === 'commit -m' || cleanAction === 'commit') {
    const nextNum = next.commits.length + 1;
    const newId = `c${nextNum}`;
    const activeBranch = next.head.isDetached ? null : next.head.ref;
    const lane: 0 | 1 | 2 =
      activeBranch === 'main'
        ? 0
        : activeBranch?.includes('hotfix')
          ? 2
          : headLane;
    const color: GitLaneColor =
      lane === 0 ? 'violet' : lane === 1 ? 'cyan' : 'amber';

    const newCommit: GitCommitNode = {
      id: newId,
      label: newId,
      lane,
      row: headRow + 1,
      parents: [headCommitId],
      color,
    };
    next.commits.push(newCommit);
    if (activeBranch) {
      next.branches[activeBranch] = newId;
    } else {
      next.head.ref = newId;
    }
    return {
      nextState: next,
      ok: true,
      feedback: `Created commit \`${newId}\` on \`${activeBranch ?? 'HEAD'}\`.`,
    };
  }

  // 2. branch <name>
  if (cleanAction === 'branch') {
    if (!cleanTarget) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Select a branch name token (e.g. `feature/auth` or `hotfix`) to create.',
      };
    }
    next.branches[cleanTarget] = headCommitId;
    return {
      nextState: next,
      ok: true,
      feedback: `Created branch pointer \`${cleanTarget}\` at \`${headCommitId}\`.`,
    };
  }

  // 3. branch -d <name>
  if (cleanAction === 'branch -d') {
    if (!cleanTarget || !next.branches[cleanTarget]) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Choose an existing non-HEAD branch to delete.',
      };
    }
    if (!next.head.isDetached && next.head.ref === cleanTarget) {
      return {
        nextState: prevState,
        ok: false,
        feedback: `Cannot delete branch \`${cleanTarget}\` while \`HEAD\` is checked out on it.`,
      };
    }
    delete next.branches[cleanTarget];
    return {
      nextState: next,
      ok: true,
      feedback: `Deleted merged branch pointer \`${cleanTarget}\`.`,
    };
  }

  // 4. checkout / switch
  if (cleanAction === 'checkout' || cleanAction === 'switch') {
    if (!cleanTarget) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Select a target branch or commit to check out.',
      };
    }
    if (next.branches[cleanTarget]) {
      next.head = { ref: cleanTarget, isDetached: false };
      return {
        nextState: next,
        ok: true,
        feedback: `Switched \`HEAD\` to branch \`${cleanTarget}\`.`,
      };
    }
    const commitExists = next.commits.some((c) => c.id === cleanTarget);
    if (commitExists) {
      next.head = { ref: cleanTarget, isDetached: true };
      return {
        nextState: next,
        ok: true,
        feedback: `Detached \`HEAD\` at commit \`${cleanTarget}\`.`,
      };
    }
    return {
      nextState: prevState,
      ok: false,
      feedback: `Branch \`${cleanTarget}\` does not exist yet—create it with \`branch\` first.`,
    };
  }

  // 5. checkout -b <name>
  if (cleanAction === 'checkout -b') {
    if (!cleanTarget) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Provide a branch name for `checkout -b`.',
      };
    }
    next.branches[cleanTarget] = headCommitId;
    next.head = { ref: cleanTarget, isDetached: false };
    return {
      nextState: next,
      ok: true,
      feedback: `Created and switched \`HEAD\` to new branch \`${cleanTarget}\`.`,
    };
  }

  // 6. merge <branch>
  if (cleanAction === 'merge') {
    const sourceCommitId = next.branches[cleanTarget];
    if (!cleanTarget || !sourceCommitId) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Select a valid branch to merge into current `HEAD`.',
      };
    }
    if (sourceCommitId === headCommitId) {
      return {
        nextState: prevState,
        ok: false,
        feedback: `\`${cleanTarget}\` is already up to date with \`HEAD\`.`,
      };
    }

    // Check if level has an unresolved conflict spec
    if (level.conflictSpec && !next.conflictResolved) {
      next.activeConflict = level.conflictSpec;
      return {
        nextState: next,
        ok: true,
        triggeredConflict: true,
        feedback: `CONFLICT in \`${level.conflictSpec.file}\`! Resolve the diff to complete the merge.`,
      };
    }

    const sourceCommit = next.commits.find((c) => c.id === sourceCommitId);
    // Fast-forward if sourceCommit directly descends from headCommitId and head is behind
    if (sourceCommit && sourceCommit.parents.includes(headCommitId) && sourceCommit.lane === headLane) {
      if (!next.head.isDetached) {
        next.branches[next.head.ref] = sourceCommitId;
      } else {
        next.head.ref = sourceCommitId;
      }
      return {
        nextState: next,
        ok: true,
        feedback: `Fast-forwarded \`${next.head.ref}\` to \`${sourceCommitId}\`.`,
      };
    }

    const maxRow = Math.max(headRow, sourceCommit?.row ?? headRow);
    const ghostLabel = level.ghostNodes[0]?.label ?? `m1`;
    const mergeCommit: GitCommitNode = {
      id: ghostLabel,
      label: ghostLabel,
      lane: headLane,
      row: maxRow + 1,
      parents: [headCommitId, sourceCommitId],
      color: headLane === 0 ? 'violet' : 'cyan',
    };
    next.commits.push(mergeCommit);
    if (!next.head.isDetached) {
      next.branches[next.head.ref] = mergeCommit.id;
    } else {
      next.head.ref = mergeCommit.id;
    }
    return {
      nextState: next,
      ok: true,
      feedback: `Merged \`${cleanTarget}\` into \`${next.head.ref}\` via merge commit \`${mergeCommit.id}\`.`,
    };
  }

  // 7. rebase <branch>
  if (cleanAction === 'rebase') {
    const ontoCommitId = next.branches[cleanTarget];
    if (!cleanTarget || !ontoCommitId) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Select the base branch (e.g. `main`) to rebase onto.',
      };
    }
    const ontoCommit = next.commits.find((c) => c.id === ontoCommitId);
    if (!ontoCommit || !headCommit) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Cannot rebase from current state.',
      };
    }

    if (level.conflictSpec && !next.conflictResolved) {
      next.activeConflict = level.conflictSpec;
      return {
        nextState: next,
        ok: true,
        triggeredConflict: true,
        feedback: `Rebase conflict in \`${level.conflictSpec.file}\`! Resolve the diff card.`,
      };
    }

    const rebasedId = `${headCommit.id}'`;
    const rebasedNode: GitCommitNode = {
      id: rebasedId,
      label: rebasedId,
      lane: ontoCommit.lane,
      row: ontoCommit.row + 1,
      parents: [ontoCommitId],
      color: 'violet',
    };
    next.commits.push(rebasedNode);
    if (!next.head.isDetached) {
      next.branches[next.head.ref] = rebasedId;
    } else {
      next.head.ref = rebasedId;
    }
    return {
      nextState: next,
      ok: true,
      feedback: `Rebased \`${next.head.ref}\` onto \`${cleanTarget}\` (\`${rebasedId}\`).`,
    };
  }

  // 8. cherry-pick <commit>
  if (cleanAction === 'cherry-pick') {
    const picked = next.commits.find((c) => c.id === cleanTarget);
    if (!picked) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Select a commit hash token (e.g. `c4`) to cherry-pick.',
      };
    }
    const copyId = `${picked.id}'`;
    const copyNode: GitCommitNode = {
      id: copyId,
      label: copyId,
      lane: headLane,
      row: headRow + 1,
      parents: [headCommitId],
      color: headLane === 0 ? 'violet' : 'cyan',
    };
    next.commits.push(copyNode);
    if (!next.head.isDetached) {
      next.branches[next.head.ref] = copyId;
    } else {
      next.head.ref = copyId;
    }
    return {
      nextState: next,
      ok: true,
      feedback: `Cherry-picked \`${picked.id}\` onto \`${next.head.ref}\` as \`${copyId}\`.`,
    };
  }

  // 9. reset --hard <target>
  if (cleanAction === 'reset --hard') {
    const targetCommit = next.commits.find(
      (c) => c.id === cleanTarget || next.branches[cleanTarget] === c.id,
    );
    if (!targetCommit) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Select a valid commit (e.g. `c2`) to reset current branch to.',
      };
    }
    if (!next.head.isDetached) {
      next.branches[next.head.ref] = targetCommit.id;
    } else {
      next.head.ref = targetCommit.id;
    }
    return {
      nextState: next,
      ok: true,
      feedback: `Hard-reset \`${next.head.ref}\` pointer back to \`${targetCommit.id}\`.`,
    };
  }

  // 10. revert <commit>
  if (cleanAction === 'revert') {
    const targetCommit = next.commits.find((c) => c.id === cleanTarget);
    if (!targetCommit) {
      return {
        nextState: prevState,
        ok: false,
        feedback: 'Select a commit token to revert.',
      };
    }
    const revId = `rv1`;
    const revNode: GitCommitNode = {
      id: revId,
      label: revId,
      lane: headLane,
      row: headRow + 1,
      parents: [headCommitId],
      color: 'violet',
    };
    next.commits.push(revNode);
    if (!next.head.isDetached) {
      next.branches[next.head.ref] = revId;
    }
    return {
      nextState: next,
      ok: true,
      feedback: `Created inverse commit \`${revId}\` reverting \`${targetCommit.id}\`.`,
    };
  }

  return {
    nextState: prevState,
    ok: false,
    feedback: `Unsupported command \`git ${cleanAction} ${cleanTarget}\`.`,
  };
}

const SECTOR_1_BLUEPRINTS: readonly {
  title: string;
  goalText: string;
  parMoves: number;
  initialState: GitGraphState;
  ghostNodes: GitGhostNode[];
  expectedSteps: readonly { action: string; target?: string }[];
  actionTokens: readonly string[];
  targetTokens: readonly string[];
}[] = [
  {
    title: 'First Commit on Main',
    goalText: 'Create a new commit `c3` on `main` to advance `HEAD`.',
    parMoves: 1,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
      ],
      branches: { main: 'c2' },
      head: { ref: 'main' },
    },
    ghostNodes: [{ id: 'c3', label: 'c3', lane: 0, row: 2, parents: ['c2'], targetBranch: 'main' }],
    expectedSteps: [{ action: 'commit -m' }],
    actionTokens: ['commit -m', 'branch', 'checkout'],
    targetTokens: ['main', 'feature/auth'],
  },
  {
    title: 'Spawn Feature Branch',
    goalText: 'Create branch `feature/auth` at `c2` and switch `HEAD` onto it.',
    parMoves: 2,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
      ],
      branches: { main: 'c2' },
      head: { ref: 'main' },
    },
    ghostNodes: [],
    expectedSteps: [
      { action: 'branch', target: 'feature/auth' },
      { action: 'checkout', target: 'feature/auth' },
    ],
    actionTokens: ['branch', 'checkout', 'commit -m', 'merge'],
    targetTokens: ['feature/auth', 'main'],
  },
  {
    title: 'Fast Branch + Switch',
    goalText: 'Use `checkout -b` to create and switch to `feature/ui`, then commit `c3`.',
    parMoves: 2,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
      ],
      branches: { main: 'c2' },
      head: { ref: 'main' },
    },
    ghostNodes: [{ id: 'c3', label: 'c3', lane: 1, row: 2, parents: ['c2'], targetBranch: 'feature/ui' }],
    expectedSteps: [
      { action: 'checkout -b', target: 'feature/ui' },
      { action: 'commit -m' },
    ],
    actionTokens: ['checkout -b', 'commit -m', 'branch', 'checkout'],
    targetTokens: ['feature/ui', 'main'],
  },
  {
    title: 'Return HEAD to Main',
    goalText: 'Commit `c4` on `feature/api`, then switch `HEAD` back to `main`.',
    parMoves: 2,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 1, row: 2, parents: ['c2'], color: 'cyan' },
      ],
      branches: { main: 'c2', 'feature/api': 'c3' },
      head: { ref: 'feature/api' },
    },
    ghostNodes: [{ id: 'c4', label: 'c4', lane: 1, row: 3, parents: ['c3'], targetBranch: 'feature/api' }],
    expectedSteps: [
      { action: 'commit -m' },
      { action: 'checkout', target: 'main' },
    ],
    actionTokens: ['commit -m', 'checkout', 'branch', 'merge'],
    targetTokens: ['main', 'feature/api'],
  },
  {
    title: 'Emergency Hotfix Branch',
    goalText: 'Create and checkout `hotfix` from `main` (`c2`) and commit patch `c4`.',
    parMoves: 2,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 1, row: 2, parents: ['c2'], color: 'cyan' },
      ],
      branches: { main: 'c2', 'feature/auth': 'c3' },
      head: { ref: 'main' },
    },
    ghostNodes: [{ id: 'c4', label: 'c4', lane: 2, row: 2, parents: ['c2'], targetBranch: 'hotfix' }],
    expectedSteps: [
      { action: 'checkout -b', target: 'hotfix' },
      { action: 'commit -m' },
    ],
    actionTokens: ['checkout -b', 'commit -m', 'checkout', 'branch'],
    targetTokens: ['hotfix', 'main', 'feature/auth'],
  },
];

const SECTOR_2_BLUEPRINTS: readonly {
  title: string;
  goalText: string;
  parMoves: number;
  initialState: GitGraphState;
  ghostNodes: GitGhostNode[];
  expectedSteps: readonly { action: string; target?: string }[];
  actionTokens: readonly string[];
  targetTokens: readonly string[];
}[] = [
  {
    title: 'Merge Feature into Main',
    goalText: 'Merge `feature/auth` into `main` and resolve the `HEAD` pointer.',
    parMoves: 1,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 1, row: 1.5, parents: ['c2'], color: 'cyan' },
        { id: 'c4', label: 'c4', lane: 1, row: 2.3, parents: ['c3'], color: 'cyan' },
        { id: 'c5', label: 'HEAD', lane: 0, row: 2.3, parents: ['c2'], color: 'violet' },
      ],
      branches: { main: 'c5', 'feature/auth': 'c4' },
      head: { ref: 'main' },
    },
    ghostNodes: [
      { id: 'm1', label: 'm1', lane: 0, row: 3.3, parents: ['c5', 'c4'], targetBranch: 'main' },
    ],
    expectedSteps: [{ action: 'merge', target: 'feature/auth' }],
    actionTokens: ['commit -m', 'branch', 'checkout', 'merge', 'rebase'],
    targetTokens: ['feature/auth', 'main'],
  },
  {
    title: 'Checkout Main & 3-Way Merge',
    goalText: 'Switch `HEAD` from `feature/auth` to `main`, then merge `feature/auth`.',
    parMoves: 2,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 1, row: 2, parents: ['c1'], color: 'cyan' },
      ],
      branches: { main: 'c2', 'feature/auth': 'c3' },
      head: { ref: 'feature/auth' },
    },
    ghostNodes: [
      { id: 'm1', label: 'm1', lane: 0, row: 3, parents: ['c2', 'c3'], targetBranch: 'main' },
    ],
    expectedSteps: [
      { action: 'checkout', target: 'main' },
      { action: 'merge', target: 'feature/auth' },
    ],
    actionTokens: ['checkout', 'merge', 'commit -m', 'branch -d'],
    targetTokens: ['main', 'feature/auth'],
  },
  {
    title: 'Merge & Prune Branch',
    goalText: 'Merge `feature/ui` into `main` and delete the merged `feature/ui` branch.',
    parMoves: 2,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 1, row: 2, parents: ['c1'], color: 'cyan' },
      ],
      branches: { main: 'c2', 'feature/ui': 'c3' },
      head: { ref: 'main' },
    },
    ghostNodes: [
      { id: 'm1', label: 'm1', lane: 0, row: 3, parents: ['c2', 'c3'], targetBranch: 'main' },
    ],
    expectedSteps: [
      { action: 'merge', target: 'feature/ui' },
      { action: 'branch -d', target: 'feature/ui' },
    ],
    actionTokens: ['merge', 'branch -d', 'checkout', 'commit -m'],
    targetTokens: ['feature/ui', 'main'],
  },
  {
    title: 'Roll Back Broken Commit',
    goalText: 'Use `reset --hard` to rewind `main` from broken commit `c3` back to `c2`.',
    parMoves: 1,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 0, row: 2, parents: ['c2'], color: 'amber' },
      ],
      branches: { main: 'c3' },
      head: { ref: 'main' },
    },
    ghostNodes: [],
    expectedSteps: [{ action: 'reset --hard', target: 'c2' }],
    actionTokens: ['reset --hard', 'revert', 'checkout', 'commit -m'],
    targetTokens: ['c2', 'c1', 'main'],
  },
  {
    title: 'Hotfix Patch & Merge',
    goalText: 'Switch to `main` and merge `hotfix` to ship the urgent patch.',
    parMoves: 2,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 2, row: 2, parents: ['c1'], color: 'amber' },
      ],
      branches: { main: 'c2', hotfix: 'c3' },
      head: { ref: 'hotfix' },
    },
    ghostNodes: [
      { id: 'm1', label: 'm1', lane: 0, row: 3, parents: ['c2', 'c3'], targetBranch: 'main' },
    ],
    expectedSteps: [
      { action: 'checkout', target: 'main' },
      { action: 'merge', target: 'hotfix' },
    ],
    actionTokens: ['checkout', 'merge', 'rebase', 'branch -d'],
    targetTokens: ['main', 'hotfix'],
  },
];

const SECTOR_3_BLUEPRINTS: readonly {
  title: string;
  goalText: string;
  parMoves: number;
  initialState: GitGraphState;
  ghostNodes: GitGhostNode[];
  expectedSteps: readonly { action: string; target?: string }[];
  actionTokens: readonly string[];
  targetTokens: readonly string[];
  conflictSpec?: GitConflictSpec;
}[] = [
  {
    title: 'Linear Rebase onto Main',
    goalText: 'Rebase `feature/auth` (`c3`) onto the tip of `main` (`c2`) for a linear history.',
    parMoves: 1,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 1, row: 1, parents: ['c1'], color: 'cyan' },
      ],
      branches: { main: 'c2', 'feature/auth': 'c3' },
      head: { ref: 'feature/auth' },
    },
    ghostNodes: [
      { id: "c3'", label: "c3'", lane: 0, row: 2, parents: ['c2'], targetBranch: 'feature/auth' },
    ],
    expectedSteps: [{ action: 'rebase', target: 'main' }],
    actionTokens: ['rebase', 'merge', 'cherry-pick', 'checkout'],
    targetTokens: ['main', 'feature/auth'],
  },
  {
    title: 'Cherry-Pick Critical Fix',
    goalText: 'Apply commit `c4` from `feature/auth` directly onto `main` using `cherry-pick`.',
    parMoves: 1,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 1, row: 1, parents: ['c1'], color: 'cyan' },
        { id: 'c4', label: 'c4', lane: 1, row: 2, parents: ['c3'], color: 'cyan' },
      ],
      branches: { main: 'c2', 'feature/auth': 'c4' },
      head: { ref: 'main' },
    },
    ghostNodes: [
      { id: "c4'", label: "c4'", lane: 0, row: 2, parents: ['c2'], targetBranch: 'main' },
    ],
    expectedSteps: [{ action: 'cherry-pick', target: 'c4' }],
    actionTokens: ['cherry-pick', 'merge', 'rebase', 'checkout'],
    targetTokens: ['c4', 'c3', 'feature/auth'],
  },
  {
    title: 'Resolve Auth Merge Conflict',
    goalText: 'Merge `feature/auth` into `main` and resolve the conflict by keeping `Incoming` (`JWT v2`).',
    parMoves: 2,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 1, row: 1.5, parents: ['c1'], color: 'cyan' },
      ],
      branches: { main: 'c2', 'feature/auth': 'c3' },
      head: { ref: 'main' },
    },
    ghostNodes: [
      { id: 'm1', label: 'm1', lane: 0, row: 2.6, parents: ['c2', 'c3'], targetBranch: 'main' },
    ],
    expectedSteps: [{ action: 'merge', target: 'feature/auth' }],
    actionTokens: ['merge', 'rebase', 'checkout', 'commit -m'],
    targetTokens: ['feature/auth', 'main'],
    conflictSpec: {
      file: 'src/auth/token.ts',
      headBranch: 'main',
      incomingBranch: 'feature/auth',
      headCode: 'const TOKEN_TTL = 300; // legacy 5m',
      incomingCode: 'const TOKEN_TTL = 3600; // JWT v2 1h',
      requiredResolution: 'incoming',
      explanation: 'Select `Keep Incoming` (`feature/auth`) to adopt the `JWT v2` token TTL.',
    },
  },
  {
    title: 'Safe Production Revert',
    goalText: 'Create an inverse commit on `main` using `revert` on `c2` without rewriting history.',
    parMoves: 1,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
      ],
      branches: { main: 'c2' },
      head: { ref: 'main' },
    },
    ghostNodes: [
      { id: 'rv1', label: 'rv1', lane: 0, row: 2, parents: ['c2'], targetBranch: 'main' },
    ],
    expectedSteps: [{ action: 'revert', target: 'c2' }],
    actionTokens: ['revert', 'reset --hard', 'commit -m', 'checkout'],
    targetTokens: ['c2', 'c1', 'main'],
  },
  {
    title: 'Conflict: Keep Both Routes',
    goalText: 'Merge `feature/api` into `main` and resolve the conflict by choosing `Keep Both`.',
    parMoves: 2,
    initialState: {
      commits: [
        { id: 'c1', label: 'c1', lane: 0, row: 0, parents: [], color: 'violet' },
        { id: 'c2', label: 'c2', lane: 0, row: 1, parents: ['c1'], color: 'violet' },
        { id: 'c3', label: 'c3', lane: 1, row: 1.5, parents: ['c1'], color: 'cyan' },
      ],
      branches: { main: 'c2', 'feature/api': 'c3' },
      head: { ref: 'main' },
    },
    ghostNodes: [
      { id: 'm1', label: 'm1', lane: 0, row: 2.6, parents: ['c2', 'c3'], targetBranch: 'main' },
    ],
    expectedSteps: [{ action: 'merge', target: 'feature/api' }],
    actionTokens: ['merge', 'checkout', 'rebase', 'branch -d'],
    targetTokens: ['feature/api', 'main'],
    conflictSpec: {
      file: 'src/routes/index.ts',
      headBranch: 'main',
      incomingBranch: 'feature/api',
      headCode: 'app.use("/v1/health", healthRouter);',
      incomingCode: 'app.use("/v2/metrics", metricsRouter);',
      requiredResolution: 'both',
      explanation: 'Choose `Keep Both` so both `/v1/health` and `/v2/metrics` remain mounted.',
    },
  },
];

export function isGitLevelSolved(
  state: GitGraphState,
  level: GitCampaignLevel,
): boolean {
  if (state.activeConflict && !state.conflictResolved) return false;

  // Compute expected final state by running level.expectedSteps on level.initialState
  let targetState = cloneGitGraphState(level.initialState);
  if (level.conflictSpec) {
    targetState.conflictResolved = true;
  }
  for (const step of level.expectedSteps) {
    const res = executeGitCommandOnState(
      targetState,
      step.action,
      step.target ?? null,
      level,
    );
    targetState = res.nextState;
  }

  // Compare branches & HEAD ref & commit count
  if (state.head.ref !== targetState.head.ref) return false;
  if (state.commits.length !== targetState.commits.length) return false;
  const targetBranchKeys = Object.keys(targetState.branches);
  if (Object.keys(state.branches).length !== targetBranchKeys.length) return false;
  for (const bKey of targetBranchKeys) {
    if (state.branches[bKey] !== targetState.branches[bKey]) return false;
  }
  return true;
}

export function getGitCampaignLevel(levelNumber: number): GitCampaignLevel {
  const safeNum = Math.max(1, Math.min(GIT_CAMPAIGN_TOTAL_LEVELS, levelNumber));
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
    sectorTitle: GIT_CAMPAIGN_SECTORS[sector].title,
    title: isBoss ? `BOSS: ${blueprint.title}` : blueprint.title,
    isBoss,
    goalText: blueprint.goalText,
    parMoves: blueprint.parMoves,
    xpReward: isBoss ? 55 : 22 + sector * 5,
    gemReward: isBoss ? 25 : 8 + sector * 2,
    initialState: cloneGitGraphState(blueprint.initialState),
    ghostNodes: blueprint.ghostNodes.map((g) => ({
      ...g,
      parents: [...g.parents],
    })),
    expectedSteps: blueprint.expectedSteps,
    actionTokens: blueprint.actionTokens,
    targetTokens: blueprint.targetTokens,
    conflictSpec: (blueprint as { conflictSpec?: GitConflictSpec }).conflictSpec,
  };
}

export function getGitCampaignLevels(): GitCampaignLevel[] {
  const list: GitCampaignLevel[] = [];
  for (let lvl = 1; lvl <= GIT_CAMPAIGN_TOTAL_LEVELS; lvl += 1) {
    list.push(getGitCampaignLevel(lvl));
  }
  return list;
}
