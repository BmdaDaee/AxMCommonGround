import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppScreen, ActionButton, GlassCard, MiniStat, PresenceChip, StatePill, sharedStyles } from '../../src/ui/primitives';
import { trpc } from '../../src/lib/trpc';
import { clearAuth } from '../../src/lib/auth';

export default function DashboardScreen() {
  const router = useRouter();
  const dashboardQuery = trpc.dashboard.summary.useQuery();
  const meQuery = trpc.auth.me.useQuery();

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/');
  };

  const data = dashboardQuery.data;
  const notifications = data?.notifications;

  if (dashboardQuery.isLoading) {
    return <AppScreen title="Loading your space…" subtitle="Pulling in the current relational weather and recent signals." />;
  }

  return (
    <AppScreen
      eyebrow="Current relational weather"
      title={data?.pair ? `${data.partner?.name || 'Your partner'} and ${meQuery.data?.user?.name || 'you'}` : 'Bring the second person in with you.'}
      subtitle={data?.pair ? data.state.explanation : 'Everything is ready for the full experience, but the shared layer wakes up only after pairing.'}
      rightAction={<ActionButton label="Sign out" variant="secondary" onPress={handleLogout} />}
    >
      {!data?.pair ? (
        <GlassCard>
          <Text style={styles.sectionTitle}>The space is waiting.</Text>
          <Text style={sharedStyles.helper}>Invite your partner or join with a code to activate the dashboard, partner messaging, Bently, and shared rituals.</Text>
          <View style={styles.actionStack}>
            <ActionButton label="Create invite" onPress={() => router.push('/(onboarding)/invite')} />
            <ActionButton label="I have a code" variant="secondary" onPress={() => router.push('/(onboarding)/join')} />
          </View>
        </GlassCard>
      ) : (
        <>
          <GlassCard>
            <StatePill state={data.state.state} />
            <Text style={styles.sectionTitle}>The middle currently reads as {String(data.state.state).replaceAll('_', ' ').toLowerCase()}.</Text>
            <PresenceChip presence={notifications?.partnerPresence} />
            <View style={styles.statsRow}>
              <MiniStat label="Messages" value={data.stats.messages} />
              <MiniStat label="Journal" value={data.stats.journalEntries} />
              <MiniStat label="Missions" value={data.stats.completedMissions} />
            </View>
          </GlassCard>

          <GlassCard>
            <Text style={styles.cardEyebrow}>Live notifications</Text>
            <Text style={styles.sectionTitle}>{notifications?.unreadMessages ? `${notifications.unreadMessages} unread message${notifications.unreadMessages > 1 ? 's' : ''}` : 'All caught up right now.'}</Text>
            <Text style={sharedStyles.helper}>{notifications?.latestUnread?.content || 'Presence and unread signals now update directly inside mobile too.'}</Text>
          </GlassCard>

          <View style={styles.actionStack}>
            <ActionButton label="Open messages" onPress={() => { Haptics.selectionAsync(); router.push('/(app)/messages'); }} />
            <ActionButton label="Talk to Bently" variant="secondary" onPress={() => { Haptics.selectionAsync(); router.push('/(app)/bently'); }} />
            <ActionButton label="Open the vault" variant="ghost" onPress={() => router.push('/(app)/vault')} />
          </View>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: '#172117', fontSize: 28, lineHeight: 30, fontFamily: 'serif' },
  actionStack: { gap: 10 },
  statsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  cardEyebrow: { color: '#617160', fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase' },
});
