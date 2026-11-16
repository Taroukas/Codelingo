import React, { useEffect } from 'react';
import { Appearance, Platform, View } from 'react-native';
import { DarkTheme, Href, Stack, ThemeProvider, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { GameProvider, useGame } from '@/store/GameStore';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { initAudioSession } from '@/utils/sounds';

const CodelingoDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#7C5CFC',
    background: '#0B0D12',
    card: '#12111A',
    border: 'rgba(255, 255, 255, 0.08)',
  },
};

const ROOT_TAB_ROUTE = '/' as unknown as Href;

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen may already be hidden (web / fast refresh).
});

function RootLayoutGate({ fontsReady }: { fontsReady: boolean }) {
  const { isHydrated, hasCompletedOnboarding, pendingFirstLessonLaunch } = useGame();

  useEffect(() => {
    if (fontsReady && isHydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsReady, isHydrated]);

  useEffect(() => {
    if (isHydrated && hasCompletedOnboarding && pendingFirstLessonLaunch) {
      // Ensure we land on the Learn tab when transitioning out of Onboarding.
      const timer = setTimeout(() => {
        try {
          router.replace(ROOT_TAB_ROUTE);
        } catch {
          // Already on root Learn route
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, hasCompletedOnboarding, pendingFirstLessonLaunch]);

  if (!fontsReady || !isHydrated) {
    return <View style={{ flex: 1, backgroundColor: '#0B0D12' }} />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0D12' },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="lesson/[chapterId]" />
    </Stack>
  );
}

export default function RootLayout() {
  // One family, five real faces: `fontWeight` selects the correct cut.
  const [fontsLoaded, fontError] = useFonts([
    {
      fontFamily: 'BricolageGrotesque',
      fontDefinitions: [
        { path: BricolageGrotesque_400Regular, weight: 400 },
        { path: BricolageGrotesque_500Medium, weight: 500 },
        { path: BricolageGrotesque_600SemiBold, weight: 600 },
        { path: BricolageGrotesque_700Bold, weight: 700 },
        { path: BricolageGrotesque_800ExtraBold, weight: 800 },
      ],
    },
  ]);

  const fontsReady = Boolean(fontsLoaded || fontError);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme('dark');
    }
    initAudioSession();
  }, []);

  // Never block the app forever on a missing glyph file — fall back to system type.
  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: '#0B0D12' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0B0D12' }}>
      <SafeAreaProvider>
        <ThemeProvider value={CodelingoDarkTheme}>
          <GameProvider>
            <StatusBar style="light" />
            <RootLayoutGate fontsReady={fontsReady} />
          </GameProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
