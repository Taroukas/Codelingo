import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { GameProvider } from '@/store/GameStore';

function TabSelectionFrame({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.tabFrame, focused && styles.tabFrameActive]}>
      {children}
    </View>
  );
}

/** Tab 1: Chunky Multi-Tone Duolingo House Icon (#FF4B4B/#FF9600 roof + #FFC800 body) */
function LearnTabIcon({ focused }: { focused: boolean }) {
  return (
    <TabSelectionFrame focused={focused}>
      <View style={styles.houseWrap}>
        <View style={styles.houseRoof} />
        <View style={styles.houseBody}>
          <View style={styles.houseHole} />
          <View style={styles.housePerch} />
        </View>
      </View>
    </TabSelectionFrame>
  );
}

/** Tab 2: Chunky Golden/Amber Treasure/Practice Chest Icon */
function PracticeTabIcon({ focused }: { focused: boolean }) {
  return (
    <TabSelectionFrame focused={focused}>
      <View style={styles.chestIconWrap}>
        <View style={styles.chestIconLid} />
        <View style={styles.chestIconBand}>
          <View style={styles.chestIconLatch} />
        </View>
        <View style={styles.chestIconBody} />
      </View>
    </TabSelectionFrame>
  );
}

/** Tab 3: Chunky Crimson/Gold Trophy Shield with Promotion Arrow Badge */
function LeaderboardTabIcon({ focused }: { focused: boolean }) {
  return (
    <TabSelectionFrame focused={focused}>
      <View style={styles.trophyWrap}>
        <Ionicons name="trophy" size={30} color={Colors.red} />
        <View style={styles.trophyArrowBadge}>
          <Ionicons name="arrow-up" size={10} color={Colors.bg} />
        </View>
      </View>
    </TabSelectionFrame>
  );
}

/** Tab 4: Chunky Violet/Magenta Profile Badge Icon (#CE82FF) */
function ProfileTabIcon({ focused }: { focused: boolean }) {
  return (
    <TabSelectionFrame focused={focused}>
      <View style={styles.profileIconCircle}>
        <Ionicons name="person" size={20} color={Colors.bg} />
      </View>
    </TabSelectionFrame>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <StatusBar style="light" />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
              height: 82,
              backgroundColor: Colors.bg,
              borderTopWidth: 2,
              borderTopColor: Colors.border,
              paddingTop: 10,
              paddingBottom: 20,
              elevation: 0,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Learn',
              tabBarIcon: ({ focused }) => <LearnTabIcon focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="sandbox"
            options={{
              title: 'Practice',
              tabBarIcon: ({ focused }) => <PracticeTabIcon focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="leaderboard"
            options={{
              title: 'Leaderboard',
              tabBarIcon: ({ focused }) => <LeaderboardTabIcon focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ focused }) => <ProfileTabIcon focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="lesson/[chapterId]"
            options={{
              href: null,
              tabBarStyle: { display: 'none' },
            }}
          />
        </Tabs>
      </GameProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabFrame: {
    width: 52,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabFrameActive: {
    borderColor: Colors.sky,
    backgroundColor: Colors.skyTint,
  },
  // Tab 1: Multi-tone House
  houseWrap: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  houseRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.red,
    marginBottom: -2,
    zIndex: 2,
  },
  houseBody: {
    width: 24,
    height: 18,
    backgroundColor: Colors.gold,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderBottomWidth: 3,
    borderBottomColor: Colors.flame,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5C2831',
  },
  housePerch: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.flame,
    marginTop: 2,
  },
  // Tab 2: Multi-tone Chest
  chestIconWrap: {
    width: 30,
    height: 26,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.goldLip,
  },
  chestIconLid: {
    height: 9,
    backgroundColor: Colors.gold,
  },
  chestIconBand: {
    height: 5,
    backgroundColor: Colors.flame,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestIconLatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FEF9C3',
    borderWidth: 1.5,
    borderColor: Colors.bronze,
  },
  chestIconBody: {
    flex: 1,
    backgroundColor: Colors.gold,
  },
  // Tab 3: Trophy + Promotion Arrow
  trophyWrap: {
    width: 34,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyArrowBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.green,
    borderWidth: 1.5,
    borderColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tab 4: Purple Avatar Circle
  profileIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.purpleTab,
    borderBottomWidth: 3,
    borderBottomColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
