import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { AppScreen, ActionButton, GlassCard, PresenceChip, sharedStyles } from '../../src/ui/primitives';
import { trpc } from '../../src/lib/trpc';
import { clearAuth } from '../../src/lib/auth';

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const settingsQuery = trpc.settings.get.useQuery();
  const notificationsQuery = trpc.notifications.summary.useQuery();
  const updateMutation = trpc.settings.update.useMutation();
  const [form, setForm] = useState({ notifications: true, weeklyDigest: true, language: 'English', theme: 'Editorial Earth' });

  useEffect(() => {
    if (settingsQuery.data?.settings) setForm(settingsQuery.data.settings);
  }, [settingsQuery.data?.settings]);

  const handleSave = async () => {
    await updateMutation.mutateAsync(form);
    queryClient.invalidateQueries({ queryKey: ['mobile-settings'] });
  };

  return (
    <AppScreen eyebrow="Preferences" title="Tune the room and your rhythm." subtitle="Unread counts, live presence, and settings all sit together here on mobile now.">
      <GlassCard>
        <PresenceChip presence={notificationsQuery.data?.partnerPresence} />
        <Pressable style={styles.toggleRow} onPress={() => setForm((current) => ({ ...current, notifications: !current.notifications }))}>
          <Text style={styles.toggleTitle}>In-app notifications</Text>
          <View style={[styles.toggle, form.notifications ? styles.toggleOn : styles.toggleOff]} />
        </Pressable>
        <Pressable style={styles.toggleRow} onPress={() => setForm((current) => ({ ...current, weeklyDigest: !current.weeklyDigest }))}>
          <Text style={styles.toggleTitle}>Weekly digest</Text>
          <View style={[styles.toggle, form.weeklyDigest ? styles.toggleOn : styles.toggleOff]} />
        </Pressable>
        <Text style={sharedStyles.helper}>Language: {form.language} · Theme: {form.theme}</Text>
        <ActionButton label={updateMutation.isPending ? 'Saving…' : 'Save settings'} onPress={handleSave} disabled={updateMutation.isPending} />
      </GlassCard>

      <GlassCard>
        <Text style={styles.toggleTitle}>Account</Text>
        <Text style={sharedStyles.helper}>Unread message badges and partner presence are now built into the mobile shell as part of the redesign.</Text>
        <ActionButton label="Sign out" variant="secondary" onPress={async () => { await clearAuth(); router.replace('/'); }} />
      </GlassCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  toggleTitle: { color: '#172117', fontSize: 22, fontFamily: 'serif' },
  toggle: { width: 44, height: 24, borderRadius: 999 },
  toggleOn: { backgroundColor: '#2C3B2E' },
  toggleOff: { backgroundColor: '#C9BDAA' },
});