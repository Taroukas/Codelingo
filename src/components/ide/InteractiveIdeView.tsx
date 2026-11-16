import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LanguageLogo } from '@/components/LanguageLogo';
import {
  CarbonCompilerLoader,
  CarbonSpinnerDots,
  PulseStatusDot,
} from '@/components/ui/AmbientSurface';
import { RoboCopilotCard } from '@/components/ide/RoboCopilotCard';
import { RoboMascot, type RoboMood } from '@/components/ide/RoboMascot';
import { SyntaxHighlightedEditor } from '@/components/ide/SyntaxHighlightedEditor';
import {
  PLAYGROUND_SNIPPETS,
  getLanguage,
  type LangId,
} from '@/data/courses';
import {
  IDE_DEFAULT_CODE,
  compileAndRunCode,
  getCompilerSpec,
  type CompilerExecutionResult,
} from '@/services/compiler';
import {
  askRoboCopilot,
  type CopilotAction,
  type CopilotDiffProposal,
} from '@/services/roboCopilot';
import { MONO, UI_FONT } from '@/theme';
import { playSound } from '@/utils/sounds';
import { playComboChime, playTactileSound } from '@/services/soundEngine';
import { GemIcon } from '@/components/ui/CurrencyIcons';
import { RichCodeText } from '@/components/ui/RichCodeText';
import type { GuidedProject } from '@/data/guidedProjects';
import { useUserStore } from '@/store/useUserStore';

const INACTIVITY_SLEEP_MS = 25000;
const TYPING_WATCH_MS = 950;
const MAX_UNDO_STACK = 25;

const LANG_ORDER: LangId[] = [
  'python',
  'cpp',
  'js',
  'go',
  'java',
  'rust',
  'sql',
  'c',
  'ts',
  'css',
  'html',
  'php',
  'asm',
  'swift',
  'kotlin',
  'julia',
  'lua',
  'csharp',
];

const SHORT_CHIP_LABEL: Record<LangId, string> = {
  python: 'Py 3.12',
  cpp: 'C++ 20',
  c: 'C11',
  js: 'JS Node',
  ts: 'TS 5.6',
  go: 'Go 1.23',
  rust: 'Rust 1.85',
  asm: 'NASM x86',
  java: 'Java 17',
  csharp: 'C# Mono',
  swift: 'Swift 6',
  kotlin: 'Kotlin',
  php: 'PHP 8.3',
  lua: 'Lua 5.4',
  sql: 'SQLite',
  julia: 'Julia',
  html: 'HTML5',
  css: 'CSS3',
};

const ACCESSORY_KEYS: readonly string[] = [
  'Tab',
  '{ }',
  '( )',
  '[ ]',
  '" "',
  "' '",
  ';',
  ':',
  '=',
  '->',
  '<<',
  '+',
];

interface InteractiveIdeViewProps {
  initialLang: LangId;
  initialSnippetIndex?: number;
  initialMode?: 'starter' | 'challenge';
  activeProject?: GuidedProject | null;
  topInset: number;
  bottomInset: number;
  onClose: () => void;
  onExecutionRecorded: () => void;
}

type SheetKind = 'language' | 'template' | null;

function buildInitialCode(
  lang: LangId,
  snippetIndex: number,
  mode: 'starter' | 'challenge',
): string {
  if (mode === 'challenge') {
    const list = PLAYGROUND_SNIPPETS[lang];
    const target = list?.[snippetIndex] ?? list?.[0];
    if (target) return target.code.join('\n');
  }
  return (
    IDE_DEFAULT_CODE[lang] ??
    PLAYGROUND_SNIPPETS[lang]?.[0]?.code.join('\n') ??
    ''
  );
}

function buildInitialTerminal(lang: LangId): CompilerExecutionResult {
  const spec = getCompilerSpec(lang);
  return {
    stdout: 'Tap RUN to compile and execute on live cloud runtime.',
    stderr: '',
    exitCode: 0,
    executionTimeMs: 0,
    compilerName: spec.badgeLabel,
    errorLine: null,
    source: 'local',
    commandLabel: spec.commandLabel,
  };
}

export function InteractiveIdeView({
  initialLang,
  initialSnippetIndex = 0,
  initialMode = 'starter',
  activeProject = null,
  topInset,
  bottomInset,
  onClose,
  onExecutionRecorded,
}: InteractiveIdeViewProps) {
  const { completedProjects, completeGuidedProject } = useUserStore();
  const initialResolvedLang = activeProject?.language ?? initialLang;
  const [lang, setLang] = useState<LangId>(initialResolvedLang);
  const [code, setCode] = useState<string>(() =>
    activeProject
      ? activeProject.steps[0].starterCode
      : buildInitialCode(initialLang, initialSnippetIndex, initialMode),
  );
  const [editorHistory, setEditorHistory] = useState<string[]>([]);
  const [stdinText, setStdinText] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  const [isCompiling, setIsCompiling] = useState(false);
  const [execResult, setExecResult] = useState<CompilerExecutionResult>(() =>
    buildInitialTerminal(initialResolvedLang),
  );

  // Guided project milestone progression
  const [projectStepIdx, setProjectStepIdx] = useState(0);
  const [isVerifyingStep, setIsVerifyingStep] = useState(false);
  const [projectFeedback, setProjectFeedback] = useState<{
    kind: 'idle' | 'pass' | 'fail' | 'complete';
    message: string;
  }>({ kind: 'idle', message: '' });

  const currentMilestone = activeProject
    ? activeProject.steps[projectStepIdx] ?? activeProject.steps[0]
    : null;
  const isProjectCompleted = Boolean(
    activeProject && completedProjects.includes(activeProject.id),
  );

  // Cursor / selection tracking for active line highlight & accessory keys
  const [cursorIndex, setCursorIndex] = useState<number>(0);
  const [controlledSelection, setControlledSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const selectionRef = useRef<{ start: number; end: number }>({
    start: code.length,
    end: code.length,
  });

  // Expressive Mascot & Copilot state
  const [botMood, setBotMood] = useState<RoboMood>('idle');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isBotBusy, setIsBotBusy] = useState(false);
  const [botMessage, setBotMessage] = useState<string>(() => {
    const spec = getCompilerSpec(initialResolvedLang);
    if (activeProject) {
      return `Building **${activeProject.title}** (${activeProject.steps.length} milestones). Complete Step 1 and tap \`Verify Step\`!`;
    }
    return `Ready on \`${spec.mainFilename}\`. Write a comment like \`# bubble sort\`, tap \`Complete Code\`, or ask me anything!`;
  });
  const [pendingProposal, setPendingProposal] =
    useState<CopilotDiffProposal | null>(null);

  // Pickers & refs
  const [activeSheet, setActiveSheet] = useState<SheetKind>(null);
  const mainScrollRef = useRef<React.ComponentRef<typeof ScrollView> | null>(
    null,
  );
  const codeInputRef = useRef<React.ComponentRef<typeof TextInput> | null>(
    null,
  );
  const copilotPromptRef = useRef<React.ComponentRef<typeof TextInput> | null>(
    null,
  );
  const copilotSectionYRef = useRef(0);
  const isMountedRef = useRef(true);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const lastSnapshotRef = useRef<string>(code);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardOpen(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardOpen(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const resetInactivitySleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }
    sleepTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setBotMood((prev) => (prev === 'idle' ? 'sleeping' : prev));
    }, INACTIVITY_SLEEP_MS);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    resetInactivitySleepTimer();
    return () => {
      isMountedRef.current = false;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [resetInactivitySleepTimer]);

  const wakeUpBot = useCallback(() => {
    resetInactivitySleepTimer();
    setBotMood((prev) => (prev === 'sleeping' ? 'idle' : prev));
  }, [resetInactivitySleepTimer]);

  const pushUndoSnapshot = useCallback((snapshot: string) => {
    setEditorHistory((prev) => {
      if (prev[prev.length - 1] === snapshot) return prev;
      const next = [...prev, snapshot];
      return next.length > MAX_UNDO_STACK
        ? next.slice(next.length - MAX_UNDO_STACK)
        : next;
    });
    lastSnapshotRef.current = snapshot;
  }, []);

  const handleUndo = () => {
    if (editorHistory.length === 0) return;
    Haptics.selectionAsync().catch(() => undefined);
    playSound('token_out');
    const previousCode = editorHistory[editorHistory.length - 1];
    setEditorHistory((prev) => prev.slice(0, -1));
    setCode(previousCode);
    lastSnapshotRef.current = previousCode;
    selectionRef.current = {
      start: previousCode.length,
      end: previousCode.length,
    };
    setControlledSelection(undefined);
    setPendingProposal(null);
    wakeUpBot();
    setBotMessage('Restored your previous code snapshot via `Undo`.');
  };

  const spec = getCompilerSpec(lang);
  const errorLine = execResult.errorLine;
  const hasCompilerError = execResult.exitCode !== 0;

  // Compute 1-based active cursor line
  const activeCursorLine = useMemo(() => {
    const safeIdx = Math.max(0, Math.min(cursorIndex, code.length));
    let line = 1;
    for (let i = 0; i < safeIdx; i += 1) {
      if (code.charCodeAt(i) === 10) line += 1;
    }
    return line;
  }, [code, cursorIndex]);

  const handleUserCodeChange = (nextText: string) => {
    let resolvedText = nextText;
    let nextControlledSel: { start: number; end: number } | undefined;

    // Auto-indent when the user presses Return / inserts a single newline
    if (nextText.length === code.length + 1) {
      let diff = 0;
      while (diff < code.length && code[diff] === nextText[diff]) {
        diff += 1;
      }
      if (
        nextText[diff] === '\n' &&
        nextText.slice(diff + 1) === code.slice(diff)
      ) {
        const lineStart = nextText.lastIndexOf('\n', diff - 1) + 1;
        const prevLine = nextText.slice(lineStart, diff);
        const indentMatch = prevLine.match(/^\s*/);
        const baseIndent = indentMatch ? indentMatch[0] : '';
        const trimmed = prevLine.trimEnd();
        const opensBlock =
          trimmed.endsWith(':') ||
          trimmed.endsWith('{') ||
          trimmed.endsWith('(') ||
          trimmed.endsWith('[');
        const indentToAdd = baseIndent + (opensBlock ? '    ' : '');
        if (indentToAdd.length > 0) {
          resolvedText =
            nextText.slice(0, diff + 1) +
            indentToAdd +
            nextText.slice(diff + 1);
          const nextCaret = diff + 1 + indentToAdd.length;
          selectionRef.current = { start: nextCaret, end: nextCaret };
          setCursorIndex(nextCaret);
          nextControlledSel = { start: nextCaret, end: nextCaret };
        }
      }
    }

    // Save periodic undo checkpoints when line count changes or big paste occurs
    if (
      Math.abs(resolvedText.length - lastSnapshotRef.current.length) >= 18 ||
      (resolvedText.endsWith('\n') && resolvedText !== lastSnapshotRef.current)
    ) {
      pushUndoSnapshot(code);
    }

    setCode(resolvedText);
    setControlledSelection(nextControlledSel);
    if (pendingProposal) setPendingProposal(null);

    // Trigger watching_typing mood
    setIsUserTyping(true);
    wakeUpBot();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsUserTyping(false);
      }
    }, TYPING_WATCH_MS);
  };

  const switchLanguage = useCallback(
    (nextLang: LangId) => {
      Haptics.selectionAsync().catch(() => undefined);
      playSound('select');
      const nextCode = buildInitialCode(nextLang, 0, 'starter');
      const nextSpec = getCompilerSpec(nextLang);
      setLang(nextLang);
      setCode(nextCode);
      setEditorHistory([]);
      lastSnapshotRef.current = nextCode;
      selectionRef.current = { start: nextCode.length, end: nextCode.length };
      setCursorIndex(0);
      setControlledSelection(undefined);
      setExecResult(buildInitialTerminal(nextLang));
      setPendingProposal(null);
      setBotMood('idle');
      resetInactivitySleepTimer();
      setBotMessage(
        `Switched workspace to \`${nextSpec.mainFilename}\` (${nextSpec.badgeLabel}). Hit \`RUN\` or ask me to generate any algorithm!`,
      );
      setActiveSheet(null);
    },
    [resetInactivitySleepTimer],
  );

  const loadTemplateCode = useCallback(
    (nextCode: string, label: string) => {
      Haptics.selectionAsync().catch(() => undefined);
      playSound('token_in');
      pushUndoSnapshot(code);
      setCode(nextCode);
      selectionRef.current = { start: nextCode.length, end: nextCode.length };
      setCursorIndex(0);
      setControlledSelection(undefined);
      setPendingProposal(null);
      setExecResult(buildInitialTerminal(lang));
      setBotMood('idle');
      resetInactivitySleepTimer();
      setBotMessage(
        `Loaded \`${label}\`. Tap \`RUN\` to compile or \`Explain\` for a line-by-line breakdown.`,
      );
      setActiveSheet(null);
    },
    [code, lang, pushUndoSnapshot, resetInactivitySleepTimer],
  );

  const handleResetCode = () => {
    const starter = buildInitialCode(lang, 0, 'starter');
    loadTemplateCode(starter, spec.mainFilename);
  };

  const handleClearCode = () => {
    if (!code) return;
    Haptics.selectionAsync().catch(() => undefined);
    playSound('token_out');
    pushUndoSnapshot(code);
    setCode('');
    selectionRef.current = { start: 0, end: 0 };
    setCursorIndex(0);
    setControlledSelection(undefined);
    setPendingProposal(null);
    setExecResult(buildInitialTerminal(lang));
    setBotMood('idle');
    resetInactivitySleepTimer();
    setBotMessage(
      `Cleared \`${spec.mainFilename}\`. Write a comment like \`# binary search\` or tap \`↶ Undo\` to restore.`,
    );
  };

  const handleLoadProjectHint = () => {
    if (!currentMilestone) return;
    Haptics.selectionAsync().catch(() => undefined);
    playSound('select');
    pushUndoSnapshot(code);
    setCode(currentMilestone.solutionHint);
    const caret = currentMilestone.solutionHint.length;
    selectionRef.current = { start: caret, end: caret };
    setCursorIndex(caret);
    setControlledSelection(undefined);
    setPendingProposal(null);
    setBotMood('happy');
    resetInactivitySleepTimer();
    setBotMessage(
      `Loaded the Step ${projectStepIdx + 1} hint into \`${spec.mainFilename}\`. Review the diff and tap \`Verify Step\`!`,
    );
  };

  const handleVerifyProjectStep = async () => {
    if (!activeProject || !currentMilestone || isVerifyingStep || isCompiling) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    playSound('run_code');
    setIsVerifyingStep(true);
    setIsCompiling(true);
    setBotMood('thinking');
    resetInactivitySleepTimer();
    onExecutionRecorded();

    const result = await compileAndRunCode({
      lang,
      source: code,
      stdin: stdinText,
    });

    if (!isMountedRef.current) return;

    setExecResult(result);
    setIsCompiling(false);
    setIsVerifyingStep(false);

    const expected = currentMilestone.expectedOutputSubstring
      .trim()
      .toLowerCase();
    const passed =
      result.exitCode === 0 &&
      result.stdout.trim().toLowerCase().includes(expected);

    if (!passed) {
      playSound('wrong');
      playTactileSound('error', { skipHaptic: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => undefined,
      );
      setBotMood('worried');
      setProjectFeedback({
        kind: 'fail',
        message:
          result.exitCode !== 0
            ? 'Fix the compiler/runtime error in the terminal below first.'
            : `Expected stdout containing "${currentMilestone.expectedOutputSubstring}". Hint: ${currentMilestone.verifyHint}`,
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );

    if (projectStepIdx < 3) {
      const nextIdx = projectStepIdx + 1;
      const nextStep = activeProject.steps[nextIdx];
      playComboChime(projectStepIdx + 1, true);
      setBotMood('happy');
      setProjectStepIdx(nextIdx);
      setCode(nextStep.starterCode);
      selectionRef.current = {
        start: nextStep.starterCode.length,
        end: nextStep.starterCode.length,
      };
      setCursorIndex(nextStep.starterCode.length);
      setControlledSelection(undefined);
      setPendingProposal(null);
      setProjectFeedback({
        kind: 'pass',
        message: `Step ${projectStepIdx + 1}/4 verified! Loaded Step ${nextIdx + 1}: ${nextStep.title}.`,
      });
      setBotMessage(
        `Milestone ${projectStepIdx + 1} passed! Next up: **${nextStep.title}**.`,
      );
    } else {
      const reward = completeGuidedProject(activeProject.id);
      playSound('victory');
      playTactileSound('level_complete', { skipHaptic: true });
      setBotMood('celebrating');
      setProjectFeedback({
        kind: 'complete',
        message: `Project Built! Earned +${reward.xpEarned} XP & +${reward.gemsEarned} Gems.`,
      });
      setBotMessage(
        `Clean build! **${activeProject.title}** is now verified in your Profile showcase.`,
      );
    }
  };

  const handleRun = async () => {
    if (isCompiling) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    playSound('run_code');
    setIsCompiling(true);
    setBotMood('thinking');
    resetInactivitySleepTimer();
    onExecutionRecorded();

    const result = await compileAndRunCode({
      lang,
      source: code,
      stdin: stdinText,
    });

    if (!isMountedRef.current) return;

    setExecResult(result);
    setIsCompiling(false);

    if (result.exitCode === 0) {
      playSound('run_success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      setBotMood('happy');
      setBotMessage(
        `Clean build — \`${spec.mainFilename}\` compiled and ran in \`${result.executionTimeMs}ms\` with \`Exit 0\`.`,
      );
    } else {
      playSound('wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => undefined,
      );
      setBotMood('worried');
      setBotMessage(
        result.errorLine
          ? `Compiler caught an error on line \`${result.errorLine}\`. Tap \`Fix Error\` and I'll patch it so it compiles with \`Exit 0\`!`
          : 'Execution returned a non-zero exit code. Tap `Fix Error` to diagnose and auto-patch your code.',
      );
    }
  };

  const handleInsertKey = (keyLabel: string) => {
    Haptics.selectionAsync().catch(() => undefined);
    const token =
      keyLabel === 'Tab'
        ? '    '
        : keyLabel === '{ }'
        ? '{}'
        : keyLabel === '( )'
        ? '()'
        : keyLabel === '[ ]'
        ? '[]'
        : keyLabel === '" "'
        ? '""'
        : keyLabel === "' '"
        ? "''"
        : keyLabel;

    const { start, end } = selectionRef.current;
    const safeStart = Math.max(0, Math.min(start, code.length));
    const safeEnd = Math.max(safeStart, Math.min(end, code.length));
    const pairMap: Record<string, [string, string]> = {
      '{}': ['{', '}'],
      '()': ['(', ')'],
      '[]': ['[', ']'],
      '""': ['"', '"'],
      "''": ["'", "'"],
    };
    const pair = pairMap[token];

    if (pair && safeEnd > safeStart) {
      const selectedSlice = code.slice(safeStart, safeEnd);
      const nextCode =
        code.slice(0, safeStart) +
        pair[0] +
        selectedSlice +
        pair[1] +
        code.slice(safeEnd);
      const nextSel = { start: safeStart + 1, end: safeEnd + 1 };
      setCode(nextCode);
      selectionRef.current = nextSel;
      setCursorIndex(nextSel.start);
      setControlledSelection(nextSel);
    } else {
      const nextCode = code.slice(0, safeStart) + token + code.slice(safeEnd);
      const nextCaret = pair ? safeStart + 1 : safeStart + token.length;
      setCode(nextCode);
      selectionRef.current = { start: nextCaret, end: nextCaret };
      setCursorIndex(nextCaret);
      setControlledSelection({ start: nextCaret, end: nextCaret });
    }
    wakeUpBot();
    codeInputRef.current?.focus();
  };

  const handleCopilotAction = async (
    action: CopilotAction,
    customPrompt?: string,
  ) => {
    if (isBotBusy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    playSound('select');
    setIsBotBusy(true);
    setBotMood('thinking');
    resetInactivitySleepTimer();
    setBotMessage(
      action === 'fix'
        ? `Analyzing \`${spec.mainFilename}\` compiler diagnostics...`
        : action === 'explain'
        ? `Inspecting your \`${spec.mainFilename}\` line by line...`
        : `Synthesizing code for \`${spec.mainFilename}\`...`,
    );

    const reply = await askRoboCopilot({
      lang,
      code,
      action,
      customPrompt,
      stderr: execResult.stderr,
      errorLine: execResult.errorLine,
      exitCode: execResult.exitCode,
    });

    if (!isMountedRef.current) return;

    setIsBotBusy(false);
    setBotMessage(reply.message);
    setPendingProposal(reply.proposal);
    setBotMood(reply.nextBotState);

    if (reply.proposal) {
      playSound('token_in');
    } else if (reply.nextBotState === 'worried') {
      playSound('wrong');
    } else {
      playSound('correct');
    }
  };

  const handleAcceptProposal = () => {
    if (!pendingProposal) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
    playSound('run_success');
    pushUndoSnapshot(code);
    const nextCode = pendingProposal.proposedFullCode;
    setCode(nextCode);
    selectionRef.current = { start: nextCode.length, end: nextCode.length };
    setCursorIndex(nextCode.length);
    setControlledSelection(undefined);
    setPendingProposal(null);
    setBotMood('happy');
    resetInactivitySleepTimer();
    setBotMessage(
      `Applied patch to \`${spec.mainFilename}\`! Tap \`RUN\` to execute or \`↶\` in the header to undo.`,
    );
    setExecResult((prev) => ({ ...prev, errorLine: null }));
  };

  const handleDismissProposal = () => {
    if (!pendingProposal) return;
    Haptics.selectionAsync().catch(() => undefined);
    playSound('token_out');
    setPendingProposal(null);
    setBotMood('idle');
    resetInactivitySleepTimer();
    setBotMessage(
      `Rejected diff for \`${spec.mainFilename}\`. Your code was left untouched.`,
    );
  };

  const focusCopilotCard = () => {
    Keyboard.dismiss();
    Haptics.selectionAsync().catch(() => undefined);
    playSound('select');
    wakeUpBot();
    setTimeout(() => {
      mainScrollRef.current?.scrollTo({
        y: Math.max(0, copilotSectionYRef.current - 12),
        animated: true,
      });
      copilotPromptRef.current?.focus();
    }, 180);
  };

  const templatesForLang = PLAYGROUND_SNIPPETS[lang] ?? [];
  const canUndo = editorHistory.length > 0;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* 1. Minimalist Top IDE Header */}
      <View style={styles.topHeader}>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.pressedFade,
          ]}
        >
          <Ionicons name="chevron-back" size={20} color="#E2E8F0" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeProject ? activeProject.title : 'Interactive IDE'}
        </Text>

        <Pressable
          disabled={Boolean(activeProject)}
          onPress={() => {
            if (activeProject) return;
            Haptics.selectionAsync().catch(() => undefined);
            playSound('drawer_open');
            setActiveSheet('language');
          }}
          style={({ pressed }) => [
            styles.langSelectPill,
            pressed && !activeProject && styles.pressedFade,
          ]}
        >
          <LanguageLogo language={lang} size={15} />
          <Text style={styles.langSelectText}>{SHORT_CHIP_LABEL[lang]}</Text>
          {!activeProject ? (
            <Ionicons name="chevron-down" size={13} color="#A1A1AA" />
          ) : null}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <ScrollView
          ref={mainScrollRef}
          style={styles.flexOne}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(28, bottomInset + 20) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeProject && currentMilestone ? (
            <View style={styles.projectBannerCard}>
              <View style={styles.projectTopRow}>
                <View style={styles.projectStepPill}>
                  <Text style={styles.projectStepPillText}>
                    {`STEP ${projectStepIdx + 1}/4`}
                  </Text>
                </View>

                <View style={styles.projectProgressTrack}>
                  {activeProject.steps.map((st, idx) => {
                    const done =
                      projectFeedback.kind === 'complete' ||
                      idx < projectStepIdx;
                    const active =
                      projectFeedback.kind !== 'complete' &&
                      idx === projectStepIdx;
                    return (
                      <View
                        key={st.stepNumber}
                        style={[
                          styles.projectStepSegment,
                          done && styles.projectStepDone,
                          active && styles.projectStepActive,
                        ]}
                      />
                    );
                  })}
                </View>

                <View
                  style={[
                    styles.projectRewardPill,
                    (isProjectCompleted ||
                      projectFeedback.kind === 'complete') &&
                      styles.projectBuiltPill,
                  ]}
                >
                  {isProjectCompleted ||
                  projectFeedback.kind === 'complete' ? (
                    <Text style={styles.projectBuiltText}>BUILT ✓</Text>
                  ) : (
                    <>
                      <Text style={styles.projectRewardText}>
                        {`+${activeProject.xpReward} XP`}
                      </Text>
                      <GemIcon size={11} />
                      <Text style={styles.projectRewardGem}>
                        {`+${activeProject.gemReward}`}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <Text style={styles.projectMilestoneTitle}>
                {currentMilestone.title}
              </Text>
              <RichCodeText
                text={currentMilestone.instruction}
                style={styles.projectInstructionText}
              />

              {projectFeedback.kind !== 'idle' ? (
                <View
                  style={[
                    styles.projectFeedbackBox,
                    projectFeedback.kind === 'fail'
                      ? styles.projectFeedbackFail
                      : styles.projectFeedbackPass,
                  ]}
                >
                  <Ionicons
                    name={
                      projectFeedback.kind === 'fail'
                        ? 'alert-circle'
                        : 'checkmark-circle'
                    }
                    size={15}
                    color={
                      projectFeedback.kind === 'fail' ? '#FCA5A5' : '#34D399'
                    }
                  />
                  <Text style={styles.projectFeedbackText}>
                    {projectFeedback.message}
                  </Text>
                </View>
              ) : null}

              <View style={styles.projectActionsRow}>
                <Pressable
                  onPress={handleLoadProjectHint}
                  style={({ pressed }) => [
                    styles.projectHintBtn,
                    pressed && styles.pressedFade,
                  ]}
                >
                  <Ionicons name="bulb-outline" size={14} color="#C4B5FD" />
                  <Text style={styles.projectHintBtnText}>Load Hint</Text>
                </Pressable>

                <Pressable
                  disabled={isVerifyingStep || isCompiling}
                  onPress={handleVerifyProjectStep}
                  style={({ pressed }) => [
                    styles.projectVerifyBtn,
                    (isVerifyingStep || isCompiling) &&
                      styles.projectVerifyBtnBusy,
                    pressed && styles.pressedFade,
                  ]}
                >
                  <Ionicons
                    name={
                      projectStepIdx === 3 ? 'checkmark-done' : 'play-forward'
                    }
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.projectVerifyBtnText}>
                    {isVerifyingStep
                      ? 'Verifying...'
                      : projectStepIdx === 3
                        ? 'Complete Project ✓'
                        : `Verify Step ${projectStepIdx + 1}/4 →`}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* 2. Matte Carbon Live Syntax-Highlighted Code Editor Card */}
          <View style={styles.editorCard}>
            {/* Editor Window Chrome Bar */}
            <View style={styles.editorHeader}>
              <View style={styles.editorHeaderLeft}>
                <View style={styles.dotsRow}>
                  <View style={[styles.dot, styles.dotRed]} />
                  <View style={[styles.dot, styles.dotAmber]} />
                  <View style={[styles.dot, styles.dotGreen]} />
                </View>
                <Text style={styles.filenameText} numberOfLines={1}>
                  {spec.mainFilename}
                </Text>
              </View>

              <View style={styles.editorHeaderActions}>
                {/* Undo Safety Button */}
                <Pressable
                  onPress={handleUndo}
                  disabled={!canUndo}
                  style={({ pressed }) => [
                    styles.iconToolBtn,
                    canUndo && styles.iconToolBtnUndoActive,
                    !canUndo && styles.iconToolBtnDisabled,
                    pressed && canUndo ? styles.pressedFade : null,
                  ]}
                  accessibilityLabel="Undo last code change"
                >
                  <Ionicons
                    name="arrow-undo"
                    size={13.5}
                    color={canUndo ? '#C4B5FD' : '#52525B'}
                  />
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => undefined);
                    playSound('drawer_open');
                    setActiveSheet('template');
                  }}
                  style={({ pressed }) => [
                    styles.iconToolBtn,
                    pressed && styles.pressedFade,
                  ]}
                  accessibilityLabel="Load template"
                >
                  <Ionicons name="layers-outline" size={14} color="#A1A1AA" />
                </Pressable>

                <Pressable
                  onPress={handleClearCode}
                  style={({ pressed }) => [
                    styles.iconToolBtn,
                    pressed && styles.pressedFade,
                  ]}
                  accessibilityLabel="Clear editor"
                >
                  <Ionicons name="trash-outline" size={13.5} color="#A1A1AA" />
                </Pressable>

                <Pressable
                  onPress={handleResetCode}
                  style={({ pressed }) => [
                    styles.iconToolBtn,
                    pressed && styles.pressedFade,
                  ]}
                  accessibilityLabel="Reset starter code"
                >
                  <Ionicons name="refresh" size={13.5} color="#A1A1AA" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => undefined);
                    setShowStdin((v) => !v);
                  }}
                  style={({ pressed }) => [
                    styles.stdinBtn,
                    showStdin && styles.stdinBtnActive,
                    pressed && styles.pressedFade,
                  ]}
                >
                  <Text
                    style={[
                      styles.stdinBtnText,
                      showStdin && styles.stdinBtnTextActive,
                    ]}
                  >
                    STDIN
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleRun}
                  disabled={isCompiling}
                  style={({ pressed }) => [
                    styles.runBtn,
                    isCompiling && styles.runBtnBusy,
                    pressed && !isCompiling ? styles.pressedFade : null,
                  ]}
                >
                  {isCompiling ? (
                    <CarbonSpinnerDots color="#FFFFFF" size="sm" />
                  ) : (
                    <>
                      <Text style={styles.runBtnText}>RUN</Text>
                      <Ionicons name="play" size={10} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Optional 1-Line STDIN Drawer */}
            {showStdin ? (
              <View style={styles.stdinBar}>
                <Text style={styles.stdinPrefix}>stdin &gt;</Text>
                <TextInput
                  value={stdinText}
                  onChangeText={setStdinText}
                  placeholder="Optional standard input lines..."
                  placeholderTextColor="#52525B"
                  style={styles.stdinInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ) : null}

            {/* Dual-Layer Live Syntax Highlighted Editor + Inline Ghost Diff */}
            <SyntaxHighlightedEditor
              code={code}
              lang={lang}
              placeholder={`Write ${getLanguage(lang).name} code or # comment here...`}
              errorLine={errorLine}
              activeLine={activeCursorLine}
              expanded={isKeyboardOpen && isCodeFocused}
              controlledSelection={controlledSelection}
              pendingProposal={pendingProposal}
              inputRef={codeInputRef}
              onChangeCode={handleUserCodeChange}
              onSelectionChange={(sel) => {
                selectionRef.current = sel;
                setCursorIndex(sel.start);
                if (controlledSelection !== undefined) {
                  setControlledSelection(undefined);
                }
              }}
              onFocus={() => setIsCodeFocused(true)}
              onBlur={() => setIsCodeFocused(false)}
              onAcceptProposal={handleAcceptProposal}
              onRejectProposal={handleDismissProposal}
            />

            {/* Mobile Coding Accessory Keybar */}
            <View style={styles.accessoryBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={styles.accessoryKeysRow}
              >
                {ACCESSORY_KEYS.map((keyLabel) => (
                  <Pressable
                    key={keyLabel}
                    onPress={() => handleInsertKey(keyLabel)}
                    style={({ pressed }) => [
                      styles.accessoryKeyPill,
                      pressed && styles.accessoryKeyPillPressed,
                    ]}
                  >
                    <Text style={styles.accessoryKeyText}>{keyLabel}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                onPress={focusCopilotCard}
                style={({ pressed }) => [
                  styles.copilotKeyTrigger,
                  pressed && styles.pressedFade,
                ]}
              >
                <Ionicons name="sparkles" size={12} color="#C4B5FD" />
                <Text style={styles.copilotKeyText}>Copilot</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => undefined);
                  Keyboard.dismiss();
                }}
                style={({ pressed }) => [
                  styles.doneKeyTrigger,
                  pressed && styles.pressedFade,
                ]}
              >
                <Text style={styles.doneKeyText}>Done ⌨️</Text>
              </Pressable>
            </View>
          </View>

          {isKeyboardOpen && isCodeFocused ? (
            <View style={styles.collapsedDockRow}>
              <Pressable
                onPress={focusCopilotCard}
                style={({ pressed }) => [
                  styles.collapsedDockPill,
                  pressed && styles.pressedFade,
                ]}
              >
                <RoboMascot mood={botMood} size={22} interactive={false} />
                <Text style={styles.collapsedDockText} numberOfLines={1}>
                  Ask Copilot
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => undefined);
                  Keyboard.dismiss();
                }}
                style={({ pressed }) => [
                  styles.collapsedDockPill,
                  pressed && styles.pressedFade,
                ]}
              >
                <PulseStatusDot
                  color={
                    isCompiling
                      ? '#A78BFA'
                      : execResult.exitCode === 0
                        ? '#10B981'
                        : '#EF4444'
                  }
                  size={6}
                  active={isCompiling}
                />
                <Text style={styles.collapsedDockText} numberOfLines={1}>
                  {`Terminal (Exit ${execResult.exitCode})`}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* 3. Expressive Robot Copilot Assistant Card */}
              <View
                onLayout={(e) => {
                  copilotSectionYRef.current = e.nativeEvent.layout.y;
                }}
              >
                <RoboCopilotCard
                  botMood={botMood}
                  isUserTyping={isUserTyping}
                  botMessage={botMessage}
                  hasCompilerError={hasCompilerError}
                  isBusy={isBotBusy}
                  pendingProposal={pendingProposal}
                  promptInputRef={copilotPromptRef}
                  onAction={handleCopilotAction}
                  onAcceptProposal={handleAcceptProposal}
                  onDismissProposal={handleDismissProposal}
                  onWakeUp={wakeUpBot}
                />
              </View>

              {/* 4. Live Terminal Output Drawer */}
              <View style={styles.terminalCard}>
                <View style={styles.terminalHeader}>
                  <Text style={styles.terminalTitle}>LIVE TERMINAL OUTPUT</Text>

                  <View style={styles.terminalStatusChip}>
                    <PulseStatusDot
                      color={
                        isCompiling
                          ? '#A78BFA'
                          : execResult.exitCode === 0
                          ? '#10B981'
                          : '#EF4444'
                      }
                      size={6}
                      active={isCompiling}
                    />
                    <Text
                      style={[
                        styles.terminalMetaText,
                        {
                          color: isCompiling
                            ? '#C4B5FD'
                            : execResult.exitCode === 0
                            ? '#34D399'
                            : '#F87171',
                        },
                      ]}
                    >
                      {isCompiling
                        ? 'Compiling...'
                        : `${execResult.compilerName} • ${execResult.executionTimeMs}ms • Exit ${execResult.exitCode}`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.terminalCommand}>
                  &gt; {execResult.commandLabel}
                </Text>

                {isCompiling ? (
                  <CarbonCompilerLoader filename={spec.mainFilename} />
                ) : (
                  <View style={styles.terminalOutputBody}>
                    {execResult.stdout.length > 0 ? (
                      <Text selectable style={styles.terminalStdout}>
                        {execResult.stdout}
                      </Text>
                    ) : null}

                    {execResult.stderr.length > 0 ? (
                      <Text selectable style={styles.terminalStderr}>
                        {execResult.stderr}
                      </Text>
                    ) : null}

                    {execResult.stdout.length === 0 &&
                    execResult.stderr.length === 0 ? (
                      <Text style={styles.terminalMuted}>
                        (Program finished cleanly with empty stdout)
                      </Text>
                    ) : null}

                    {execResult.exitCode !== 0 ? (
                      <Pressable
                        onPress={() => handleCopilotAction('fix')}
                        disabled={isBotBusy}
                        style={({ pressed }) => [
                          styles.terminalFixShortcut,
                          pressed && styles.pressedFade,
                        ]}
                      >
                        <Ionicons
                          name="construct-outline"
                          size={13}
                          color="#FCA5A5"
                        />
                        <Text style={styles.terminalFixText}>
                          Ask Bot to Fix Compiler Error
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Sheet Modal: Language Switcher OR Template Loader */}
      <Modal
        visible={activeSheet !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveSheet(null)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable
            style={styles.sheetBackdropTap}
            onPress={() => setActiveSheet(null)}
          />
          <View
            style={[
              styles.sheetCard,
              { paddingBottom: Math.max(20, bottomInset + 12) },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {activeSheet === 'language'
                  ? 'Select Compiler Runtime'
                  : `${getLanguage(lang).name} Templates`}
              </Text>
              <Pressable
                onPress={() => setActiveSheet(null)}
                hitSlop={10}
                style={styles.sheetCloseBtn}
              >
                <Ionicons name="close" size={18} color="#A1A1AA" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              {activeSheet === 'language' ? (
                <View style={styles.sheetGrid}>
                  {LANG_ORDER.map((itemLang) => {
                    const itemSpec = getCompilerSpec(itemLang);
                    const isSelected = itemLang === lang;
                    return (
                      <Pressable
                        key={itemLang}
                        onPress={() => switchLanguage(itemLang)}
                        style={({ pressed }) => [
                          styles.sheetLangRow,
                          isSelected && styles.sheetLangRowSelected,
                          pressed && styles.pressedFade,
                        ]}
                      >
                        <LanguageLogo language={itemLang} size={18} />
                        <View style={styles.sheetLangInfo}>
                          <Text style={styles.sheetLangName}>
                            {getLanguage(itemLang).name}
                          </Text>
                          <Text style={styles.sheetLangMeta}>
                            {itemSpec.badgeLabel} · {itemSpec.mainFilename}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color="#7C5CFC"
                          />
                        ) : (
                          <Ionicons
                            name="chevron-forward"
                            size={15}
                            color="#52525B"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.sheetGrid}>
                  <Pressable
                    onPress={() =>
                      loadTemplateCode(
                        IDE_DEFAULT_CODE[lang],
                        spec.mainFilename,
                      )
                    }
                    style={({ pressed }) => [
                      styles.sheetTemplateRow,
                      pressed && styles.pressedFade,
                    ]}
                  >
                    <View style={styles.templateIconBox}>
                      <Ionicons name="terminal" size={15} color="#A78BFA" />
                    </View>
                    <View style={styles.sheetLangInfo}>
                      <Text style={styles.sheetLangName}>
                        Full Compiler Starter ({spec.mainFilename})
                      </Text>
                      <Text style={styles.sheetLangMeta}>
                        Clean runnable entrypoint ready for {spec.badgeLabel}
                      </Text>
                    </View>
                  </Pressable>

                  {templatesForLang.map((tpl, idx) => (
                    <Pressable
                      key={`${lang}-${idx}`}
                      onPress={() =>
                        loadTemplateCode(tpl.code.join('\n'), tpl.title)
                      }
                      style={({ pressed }) => [
                        styles.sheetTemplateRow,
                        pressed && styles.pressedFade,
                      ]}
                    >
                      <View style={styles.templateIconBox}>
                        <Ionicons
                          name="code-slash"
                          size={15}
                          color="#A78BFA"
                        />
                      </View>
                      <View style={styles.sheetLangInfo}>
                        <Text style={styles.sheetLangName}>{tpl.title}</Text>
                        <Text style={styles.sheetLangMeta} numberOfLines={2}>
                          {tpl.description}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  topHeader: {
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: '#0E0D15',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 68,
  },
  backText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.2,
    flexShrink: 1,
    marginHorizontal: 8,
  },
  langSelectPill: {
    height: 32,
    borderRadius: 9,
    paddingHorizontal: 9,
    backgroundColor: '#161522',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langSelectText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#F4F4F5',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 12,
  },
  editorCard: {
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    overflow: 'hidden',
  },
  editorHeader: {
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#161521',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  editorHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotRed: {
    backgroundColor: '#EF4444',
  },
  dotAmber: {
    backgroundColor: '#F59E0B',
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  filenameText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    color: '#D4D4D8',
  },
  editorHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  iconToolBtn: {
    width: 27,
    height: 27,
    borderRadius: 7,
    backgroundColor: '#1D1C2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconToolBtnUndoActive: {
    borderColor: 'rgba(124, 92, 252, 0.42)',
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
  },
  iconToolBtnDisabled: {
    opacity: 0.45,
  },
  stdinBtn: {
    height: 27,
    borderRadius: 7,
    paddingHorizontal: 7,
    backgroundColor: '#1D1C2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stdinBtnActive: {
    backgroundColor: 'rgba(124, 92, 252, 0.18)',
    borderColor: 'rgba(124, 92, 252, 0.45)',
  },
  stdinBtnText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  stdinBtnTextActive: {
    color: '#C4B5FD',
  },
  runBtn: {
    height: 30,
    minWidth: 66,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 2,
    borderBottomColor: '#5639D6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  runBtnBusy: {
    backgroundColor: '#5B42C7',
  },
  runBtnText: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
  stdinBar: {
    height: 36,
    paddingHorizontal: 12,
    backgroundColor: '#0F0E17',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stdinPrefix: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A78BFA',
  },
  stdinInput: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 12,
    color: '#FAFAFA',
    paddingVertical: 4,
  },
  accessoryBar: {
    height: 46,
    backgroundColor: '#151420',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accessoryKeysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  accessoryKeyPill: {
    minWidth: 35,
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: '#1E1D2D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.11)',
    borderBottomWidth: 2,
    borderBottomColor: '#0E0D16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessoryKeyPillPressed: {
    backgroundColor: '#2B2940',
  },
  accessoryKeyText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  copilotKeyTrigger: {
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(124, 92, 252, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.44)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copilotKeyText: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  doneKeyTrigger: {
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: '#222033',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneKeyText: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  collapsedDockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsedDockPill: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: '#151421',
    borderWidth: 1.5,
    borderColor: '#262438',
    borderBottomWidth: 3,
    borderBottomColor: '#0C0B14',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  collapsedDockText: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E4E4E7',
    letterSpacing: -0.2,
  },
  terminalCard: {
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 14,
    gap: 8,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  terminalTitle: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#71717A',
  },
  terminalStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#141320',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    maxWidth: '68%',
  },
  terminalMetaText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  terminalCommand: {
    fontFamily: MONO,
    fontSize: 12,
    color: '#71717A',
  },
  terminalOutputBody: {
    gap: 6,
  },
  terminalStdout: {
    fontFamily: MONO,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#F8FAFC',
  },
  terminalStderr: {
    fontFamily: MONO,
    fontSize: 12,
    lineHeight: 17,
    color: '#F87171',
  },
  terminalMuted: {
    fontFamily: MONO,
    fontSize: 12,
    color: '#71717A',
  },
  terminalFixShortcut: {
    marginTop: 4,
    alignSelf: 'flex-start',
    height: 30,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  terminalFixText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#FCA5A5',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetBackdropTap: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#12111A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderCurve: 'continuous',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#252338',
    maxHeight: '76%',
  },
  sheetHeader: {
    height: 50,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: UI_FONT,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#1A1926',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  sheetGrid: {
    gap: 8,
    paddingBottom: 12,
  },
  sheetLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#161522',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  sheetLangRowSelected: {
    borderColor: 'rgba(124, 92, 252, 0.55)',
    backgroundColor: 'rgba(124, 92, 252, 0.12)',
  },
  sheetTemplateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#161522',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  templateIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(124, 92, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetLangInfo: {
    flex: 1,
    gap: 2,
  },
  sheetLangName: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  sheetLangMeta: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#A1A1AA',
  },
  pressedFade: {
    opacity: 0.82,
  },
  projectBannerCard: {
    backgroundColor: '#12111A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.30)',
    padding: 13,
    gap: 9,
  },
  projectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  projectStepPill: {
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.42)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  projectStepPillText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#C4B5FD',
    letterSpacing: 0.3,
  },
  projectProgressTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectStepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  projectStepActive: {
    backgroundColor: '#7C5CFC',
  },
  projectStepDone: {
    backgroundColor: '#10B981',
  },
  projectRewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#181824',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  projectBuiltPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(16, 185, 129, 0.40)',
  },
  projectRewardText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
  },
  projectRewardGem: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
  },
  projectBuiltText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  projectMilestoneTitle: {
    fontFamily: UI_FONT,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.2,
  },
  projectInstructionText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#CBD5E1',
  },
  projectFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  projectFeedbackPass: {
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  projectFeedbackFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  projectFeedbackText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 12,
    lineHeight: 17,
    color: '#E2E8F0',
  },
  projectActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  projectHintBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#181824',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  projectHintBtnText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  projectVerifyBtn: {
    flex: 1,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#7C5CFC',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  projectVerifyBtnBusy: {
    opacity: 0.65,
  },
  projectVerifyBtnText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
