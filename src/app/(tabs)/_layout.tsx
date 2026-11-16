import React from 'react';
import { NativeTabs } from 'expo-router/native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor="#7C5CFC"
      iconColor={{ default: '#8E92A4', selected: '#7C5CFC' }}
      labelStyle={{
        default: { color: '#8E92A4', fontSize: 10, fontWeight: '600' },
        selected: { color: '#FAFAFA', fontSize: 10, fontWeight: '600' },
      }}
      blurEffect="systemChromeMaterialDark"
      backgroundColor="rgba(18, 17, 26, 0.85)"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'terminal', selected: 'terminal.fill' }}
          md="terminal"
        />
        <NativeTabs.Trigger.Label>Learn</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="sandbox">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'chevron.left.forwardslash.chevron.right',
            selected: 'chevron.left.forwardslash.chevron.right',
          }}
          md="code"
        />
        <NativeTabs.Trigger.Label>Practice</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="leaderboard">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'trophy', selected: 'trophy.fill' }}
          md="emoji_events"
        />
        <NativeTabs.Trigger.Label>Leaderboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md="person"
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
