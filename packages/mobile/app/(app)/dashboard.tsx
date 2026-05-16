// packages/mobile/app/(app)/dashboard.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../src/lib/trpc';
import type { RelationalState } from '../../../../shared/enums';

const STATE_CONFIG: Record<string, { color: string; label: string; description: string }> = {
  ALIGNED:           { color: '#10B981', label: 'Aligned',          description: 'Both of you are showing up. The channel is open.' },
  DORMANT:           { color: '#6B7280', label: 'Dormant',          description: 'Stable but low-energy. The comfort is real — so is the drift.' },
  MISALIGNED:        { color: '#F59E0B', label: 'Misaligned',       description: 'You have capacity. Your meanings are diverging. Not a crisis — a gap.' },
  CAPACITY_BLOCKED:  { color: '#9D4EDD', label: 'Capacity Blocked', description: 'One or both of you is near limit. Deeper work is not available right now.' },
  TRUST_FRACTURED:   { color: '#E63946', label: 'Trust Fractured',  description: 'Something broke. Repair requires action, not reassurance.' },
};

function metricBand(value: number): { label: string; color: string } {
  if (value >= 70) return { label: 'HIGH', color: '#10B981' };
  if (value >= 40) return { label: 'MED',  color: '#F59E0B' };
  return              { label: 'LOW',  color: '#E63946' };
}

export default function DashboardScreen() {
  const router = useRouter();

  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const stateQuery = trpc.pairs.getRelationalState.useQuery(
    { pairId: pairId! },
    { enabled: !!pairId, refetchInterval: 60000 }
  );

  const isLoading = pairQuery.isLoading || stateQuery.isLoading;
  const isRefreshing = pairQuery.isFetching || stateQuery.isFetching;

  const onRefresh = () => {
    pairQuery.refetch();
    stateQuery.refetch();
  };

  if (!pairQuery.isLoading && !pairQuery.data) {
    return (
      <View style={[s.container, s.center]}>
        <Text style={s.label}>No Active Pair</Text>
        <TouchableOpacity style={s.btnPrimary} onPress={() => router.push('/(onboarding)/invite')}>
          <Text style={s.btnPrimaryText}>Invite Partner</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const state = (stateQuery.data?.state ?? 'DORMANT') as string;
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.DORMANT;
  const metrics = (stateQuery.data?.metrics ?? {}) as Record<string, number>;
  const explanation = (stateQuery.data as any)?.explanation ?? config.description;

  const dimensions = [
    { key: 'availability', label: 'Availability' },
    { key: 'alignment',    label: 'Alignment'    },
    { key: 'activation',   label: 'Activation'   },
    { key: 'trust',        label: 'Trust'         },
  ];

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#D4AF37"
        />
      }
    >
      {/* State hero */}
      <View style={[s.hero, { borderLeftColor: config.color }]}>
        <Text style={s.label}>Relational State</Text>
        <Text style={[s.stateName, { color: config.color }]}>
          {config.label}
        </Text>
        <Text style={s.explanation}>{explanation}</Text>
      </View>

      {/* Dimensions */}
      <View style={s.card}>
        <Text style={[s.label, { marginBottom: 16 }]}>Signal Dimensions</Text>
        <View style={s.grid}>
          {dimensions.map(({ key, label }) => {
            const value = metrics[key] ?? 50;
            const band = metricBand(value);
            return (
              <View key={key} style={s.dimension}>
                <Text style={s.dimLabel}>{label}</Text>
                <Text style={[s.dimValue, { color: band.color }]}>{band.label}</Text>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${value}%` as any, backgroundColor: band.color }]} />
                </View>
                <Text style={s.dimScore}>{value}/100</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* CTAs */}
      <TouchableOpacity style={s.btnPrimary} onPress={() => router.push('/(app)/bently')}>
        <Text style={s.btnPrimaryText}>Talk to Bently</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecondary} onPress={() => router.push('/(app)/messages')}>
        <Text style={s.btnSecondaryText}>Messages</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#080808' },
  content:       { padding: 24, paddingTop: 60, gap: 24 },
  center:        { alignItems: 'center', justifyContent: 'center', padding: 32 },
  hero:          { borderLeftWidth: 3, paddingLeft: 20, paddingVertical: 16 },
  label:         { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  stateName:     { fontFamily: 'SpaceMono', fontSize: 42, letterSpacing: -1, textTransform: 'uppercase', marginBottom: 12 },
  explanation:   { fontSize: 14, color: '#B0B0B0', lineHeight: 22 },
  card:          { backgroundColor: '#0F0F0F', borderWidth: 1, borderColor: '#1E1E1E', padding: 20 },
  grid:          { gap: 20 },
  dimension:     { gap: 4 },
  dimLabel:      { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 2, textTransform: 'uppercase' },
  dimValue:      { fontFamily: 'SpaceMono', fontSize: 22, letterSpacing: 1, textTransform: 'uppercase' },
  barBg:         { height: 2, backgroundColor: '#1E1E1E', marginTop: 4 },
  barFill:       { height: 2 },
  dimScore:      { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', marginTop: 2 },
  btnPrimary:    { backgroundColor: '#D4AF37', padding: 18, alignItems: 'center' },
  btnPrimaryText:{ fontFamily: 'SpaceMono', fontSize: 11, color: '#080808', letterSpacing: 3, textTransform: 'uppercase' },
  btnSecondary:  { borderWidth: 1, borderColor: '#1E1E1E', padding: 18, alignItems: 'center' },
  btnSecondaryText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#B0B0B0', letterSpacing: 3, textTransform: 'uppercase' },
});
