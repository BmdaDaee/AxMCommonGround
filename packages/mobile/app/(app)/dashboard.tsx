import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';

// ─── Vibe State Definitions (Muted Palette) ─────────────────────────────────

const VIBE_STATES: Record<string, {
  label: string;
  line: string;
  color: string;
  bentlyNote: string;
}> = {
  ALIGNED: {
    label: 'Aligned',
    line: 'You and your partner are in step right now.',
    color: '#A3B18A', // Muted Sage
    bentlyNote: 'The rhythm is good. Protect it by staying present, not coasting.',
  },
  DORMANT: {
    label: 'Dormant',
    line: 'The space is quiet. Nothing wrong — just quiet.',
    color: '#B8C0EC', // Muted Lavender
    bentlyNote: 'Silence isn\'t distance unless you let it become that. Reach in.',
  },
  MISALIGNED: {
    label: 'Misaligned',
    line: "You're reading from different pages. Not broken — just out of step.",
    color: '#DDB8A6', // Muted Clay/Terracotta
    bentlyNote: 'You\'re both trying. The gap is in translation, not intention.',
  },
  CAPACITY_BLOCKED: {
    label: 'Capacity Blocked',
    line: 'One of you is running low. The space respects that.',
    color: '#C2C5BB', // Muted Warm Gray
    bentlyNote: 'Low battery doesn\'t mean low love. Give the space room to breathe.',
  },
  TRUST_FRACTURED: {
    label: 'Trust Fractured',
    line: "Something needs care. Bently is here when you're ready.",
    color: '#E07A5F', // Muted Rose/Crimson
    bentlyNote: 'This is the hard part. But showing up here means you haven\'t quit.',
  },
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const pairQuery = trpc.pairs.getMyPair.useQuery();

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await SecureStore.deleteItemAsync('authToken');
    router.replace('/');
  };

  const navigateWithHaptic = (path: string) => {
    Haptics.selectionAsync();
    router.push(path as any);
  };

  // Loading
  if (pairQuery.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Finding your space…</Text>
      </View>
    );
  }

  // Error
  if (pairQuery.isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>We lost the connection.</Text>
        <Text style={styles.errorBody}>
          Check your network and we'll try again.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => pairQuery.refetch()}
        >
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pair = pairQuery.data;
  const hasPair = !!pair;
  const isPaired = hasPair && pair.status === 'ACTIVE';
  const isPending = hasPair && pair.status === 'PENDING';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={pairQuery.isFetching}
          onRefresh={() => pairQuery.refetch()}
          tintColor="#D4AF37"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandSmall}>AxM</Text>
          <Text style={styles.brand}>CommonGround</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.logoutLink}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* CASE 1: No pair yet */}
      {!hasPair && (
        <>
          <View style={styles.eyebrowSection}>
            <Text style={styles.eyebrow}>NOT YET ACTIVE</Text>
          </View>
          <Text style={styles.headline}>The space is waiting.</Text>
          <View style={styles.divider} />
          <Text style={styles.bodyText}>
            CommonGround doesn't start until two people are here. Until then,
            Bently won't speak and the relational engine stays dormant.
            {'\n\n'}
            That's by design.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigateWithHaptic('/(onboarding)/invite')}
          >
            <Text style={styles.primaryButtonText}>Invite your partner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigateWithHaptic('/(onboarding)/join')}
          >
            <Text style={styles.secondaryButtonText}>I have an invite code</Text>
          </TouchableOpacity>
        </>
      )}

      {/* CASE 2: Pair pending */}
      {isPending && (
        <>
          <View style={styles.eyebrowSection}>
            <Text style={styles.eyebrow}>WAITING</Text>
          </View>
          <Text style={styles.headline}>Holding the door.</Text>
          <View style={styles.divider} />
          <Text style={styles.bodyText}>
            Your invite is out there. The moment your partner joins,
            this space comes alive — Bently steps in, the engine starts reading,
            and you can begin.
            {'\n\n'}
            No pressure on them. No countdown.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigateWithHaptic('/(onboarding)/invite')}
          >
            <Text style={styles.primaryButtonText}>View invite code</Text>
          </TouchableOpacity>
        </>
      )}

      {/* CASE 3: Active pair — Vibe Dashboard */}
      {isPaired && (
        <>
          {/* ─── Vibe Gauge Hero Card ─── */}
          <View style={[
            styles.vibeCard,
            { borderLeftColor: VIBE_STATES[pair.relationalState]?.color ?? '#D4AF37' },
          ]}>
            <Text style={styles.vibeEyebrow}>RELATIONAL VIBE</Text>

            <View style={styles.vibeHeaderRow}>
              <View style={[
                styles.vibeDot,
                { backgroundColor: VIBE_STATES[pair.relationalState]?.color ?? '#D4AF37' },
              ]} />
              <Text style={[
                styles.vibeTitle,
                { color: VIBE_STATES[pair.relationalState]?.color ?? '#D4AF37' },
              ]}>
                {VIBE_STATES[pair.relationalState]?.label ?? 'Reading…'}
              </Text>
            </View>

            <Text style={styles.vibeLine}>
              {VIBE_STATES[pair.relationalState]?.line ?? 'Bently is reading the space.'}
            </Text>

            {/* Bently's italicized commentary */}
            <View style={styles.bentlyCommentary}>
              <Text style={styles.bentlyNote}>
                {VIBE_STATES[pair.relationalState]?.bentlyNote ?? 'Observing…'}
              </Text>
            </View>
          </View>

          {/* ─── Quick Actions Row ─── */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigateWithHaptic('/(app)/sparks')}
            >
              <Text style={styles.quickActionIcon}>✦</Text>
              <Text style={styles.quickActionTitle}>Daily Sparks</Text>
              <Text style={styles.quickActionHint}>Answer together →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigateWithHaptic('/(app)/messages')}
            >
              <Text style={styles.quickActionIcon}>◈</Text>
              <Text style={styles.quickActionTitle}>Chat</Text>
              <Text style={styles.quickActionHint}>Open thread →</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Bently Deep Dive ─── */}
          <TouchableOpacity
            style={styles.bentlyCard}
            onPress={() => navigateWithHaptic('/(app)/bently')}
          >
            <Text style={styles.bentlyCardLabel}>BENTLY</Text>
            <Text style={styles.bentlyCardTitle}>Sit with the third presence</Text>
            <Text style={styles.bentlyCardHint}>Talk one-to-one →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  scrollContent: { paddingHorizontal: 32, paddingTop: 64, paddingBottom: 48 },
  centerContainer: {
    flex: 1, backgroundColor: '#080808',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  loadingText: { color: '#888', fontSize: 14, fontStyle: 'italic', fontWeight: '300' },
  errorTitle: { color: '#fff', fontSize: 20, fontWeight: '300', textAlign: 'center' },
  errorBody: { color: '#888', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 16, fontWeight: '300' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 48,
  },
  brandSmall: { color: '#666', fontSize: 10, letterSpacing: 3, fontWeight: '600', marginBottom: 4 },
  brand: { color: '#D4AF37', fontSize: 22, fontWeight: '300', letterSpacing: -0.3 },
  logoutLink: { color: '#666', fontSize: 13, letterSpacing: 0.5 },

  // Shared
  eyebrowSection: { marginBottom: 12 },
  eyebrow: { color: '#666', fontSize: 11, letterSpacing: 3, fontWeight: '600' },
  headline: { color: '#fff', fontSize: 28, fontWeight: '300', letterSpacing: -0.5, marginBottom: 16 },
  divider: { width: 40, height: 1, backgroundColor: '#D4AF37', marginBottom: 20 },
  bodyText: { color: '#aaa', fontSize: 15, lineHeight: 24, fontWeight: '300', marginBottom: 32 },
  primaryButton: {
    backgroundColor: '#D4AF37', paddingVertical: 16,
    borderRadius: 4, alignItems: 'center', marginBottom: 12,
  },
  primaryButtonText: { color: '#080808', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  secondaryButton: { paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#888', fontSize: 14, letterSpacing: 0.3 },

  // ─── Vibe Gauge Hero Card ───
  vibeCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    borderLeftWidth: 4,
    padding: 28,
    marginBottom: 24,
  },
  vibeEyebrow: {
    color: '#555',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 16,
  },
  vibeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vibeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  vibeTitle: {
    fontFamily: 'Fraunces',
    fontSize: 26,
    fontWeight: '400',
  },
  vibeLine: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '300',
    marginBottom: 20,
  },
  bentlyCommentary: {
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 16,
  },
  bentlyNote: {
    fontFamily: 'Fraunces',
    fontStyle: 'italic',
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
  },

  // ─── Quick Actions Row ───
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  quickActionIcon: {
    color: '#D4AF37',
    fontSize: 24,
    marginBottom: 10,
  },
  quickActionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  quickActionHint: {
    color: '#D4AF37',
    fontSize: 12,
    letterSpacing: 0.3,
  },

  // ─── Bently Deep Dive Card ───
  bentlyCard: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
  },
  bentlyCardLabel: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 8,
  },
  bentlyCardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '400',
    marginBottom: 12,
  },
  bentlyCardHint: {
    color: '#D4AF37',
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
