# Expo Project Guidelines

Expo has changed — do not trust your training data. Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed.

Before writing any code that touches an Expo, EAS, or React Native API:
1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch `https://docs.expo.dev/llms.txt` — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

- Use `bunx` instead of `npx` if the project uses Bun (`bun.lock` present).
- `npx expo install <package>` — ALWAYS use instead of `npm`, `yarn`, `pnpm`, or `bun add` — resolves SDK-compatible versions.
- `npx expo start` — Start the development server.
- `npx expo lint` — Run the linter.
- `npx tsc --noEmit` — Run TypeScript type checking.
- `npx expo-doctor` — Diagnose dependency and project configuration issues.
- `npx expo install --fix` — Fix incompatible package versions.
- Run `npx expo lint` and `npx tsc --noEmit` before declaring any task complete.

## Navigation & Routing

- Use Expo Router for all navigation.
- Routes live in `src/app/` (or `app/`) — every file there is a screen, and `_layout.tsx` files define navigators.
- Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Reference documentation index: `https://docs.expo.dev/llms.txt` and [Expo Router Documentation](https://docs.expo.dev/router/introduction.md).

---

# CodeLingo — Cyberpunk / Hacker Pro Design System & Règles Métier

## 1. Tech Stack & Strict Constraints
- **Framework**: React Native with Expo Managed Workflow (100% compatible with standard iOS Expo Go).
- **Allowed Packages**: ONLY use packages already installed in `package.json` (`expo-linear-gradient`, `expo-haptics`, `@expo/vector-icons`, `react-native-reanimated`, `react-native-safe-area-context`). Do NOT run `npm install` for any native library unsupported by Expo Go.
- **Language**: All UI text, lessons, code comments, and feedback must be in **English**.
- **Typing**: Strict TypeScript (`.tsx` and `.ts`).
- **Safe Area**: Every screen must respect the iPhone Notch / Dynamic Island and Home Indicator using `useSafeAreaInsets` or `SafeAreaView`.

## 2. UI Skill: Cyberpunk / Hacker Pro Design System (Linear + Mimo Style)
- **Color Palette**:
  - Main Background (Void Black): `#060913`
  - Surface / Cards (Glass Dark): `#0F1629` with crisp 1px border `#1E293B`
  - Primary Glow / Active Border (Cyber Cyan): `#00F0FF`
  - Secondary Accent (Neon Purple): `#8B5CF6`
  - Success / Validation (Matrix Green): `#10B981`
  - Error / Bug (Cyber Crimson): `#F43F5E`
  - Combo / Streak (Plasma Amber): `#F59E0B`
  - Primary Text: `#F8FAFC` | Secondary Text: `#94A3B8`
- **Code Typography**: Always use `Platform.OS === 'ios' ? 'Menlo' : 'monospace'` for all code blocks, terminals, XP counters, and syntax chips.
- **Signature Components**:
  - 3D tactile buttons with a 3px darker bottom border (or subtle neon glow) and systematic haptic feedback (`expo-haptics`: `ImpactFeedbackStyle.Light` on tap, `NotificationFeedbackType.Success` on correct answer, `NotificationFeedbackType.Error` on mistake).
  - Code editors styled like a dark macOS/Linux IDE with line numbers on the left, three window dots at the top (`#F43F5E`, `#F59E0B`, `#10B981`), and simulated syntax highlighting.
