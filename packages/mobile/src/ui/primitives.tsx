import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';

export const palette = {
  bg: '#F7F3EC',
  surface: 'rgba(255,255,255,0.74)',
  surfaceStrong: '#FFFDFC',
  line: '#E4DDD2',
  text: '#172117',
  muted: '#617160',
  forest: '#2C3B2E',
  terracotta: '#C25934',
  sage: '#90A58D',
  sand: '#E6D5B8',
  success: '#3B8E53',
};

const navItems = [
  { label: 'Home', path: '/(app)/dashboard' },
  { label: 'Messages', path: '/(app)/messages' },
  { label: 'Bently', path: '/(app)/bently' },
  { label: 'Vault', path: '/(app)/vault' },
  { label: 'Settings', path: '/(app)/settings' },
];

export function AppScreen({ eyebrow, title, subtitle, children, rightAction, hideNav = false, scroll = true }: any) {
  const Content = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.background}>
        <View style={styles.ambientOne} />
        <View style={styles.ambientTwo} />
        <Content contentContainerStyle={[styles.content, hideNav ? styles.contentWithoutNav : null]} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>CG</Text></View>
              <View>
                <Text style={styles.eyebrow}>CommonGround</Text>
                <Text style={styles.brandTitle}>A third presence.</Text>
              </View>
            </View>
            {rightAction}
          </View>

          {(eyebrow || title || subtitle) && (
            <View style={styles.heroBlock}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
              {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
            </View>
          )}

          {children}
        </Content>
        {!hideNav && <BottomNav />}
      </View>
    </SafeAreaView>
  );
}

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.navWrap}>
      {navItems.map((item) => {
        const active = pathname === item.path;
        return (
          <Pressable key={item.path} onPress={() => router.push(item.path as any)} style={[styles.navItem, active ? styles.navItemActive : null]}>
            <Text style={[styles.navLabel, active ? styles.navLabelActive : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function GlassCard({ children, style }: any) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ActionButton({ label, onPress, variant = 'primary', disabled = false, testID }: any) {
  return (
    <Pressable testID={testID} onPress={onPress} disabled={disabled} style={[styles.button, variant === 'primary' ? styles.buttonPrimary : variant === 'secondary' ? styles.buttonSecondary : styles.buttonGhost, disabled ? styles.buttonDisabled : null]}>
      <Text style={[styles.buttonText, variant === 'primary' ? styles.buttonPrimaryText : styles.buttonSecondaryText]}>{label}</Text>
    </Pressable>
  );
}

export function MiniStat({ label, value }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StatePill({ state }: { state?: string }) {
  const tone = state === 'ALIGNED' ? styles.stateAligned : state === 'MISALIGNED' ? styles.stateMisaligned : state === 'CAPACITY_BLOCKED' ? styles.stateBlocked : state === 'TRUST_FRACTURED' ? styles.stateFractured : styles.stateDormant;
  return <Text style={[styles.statePill, tone]}>{String(state || 'DORMANT').replaceAll('_', ' ')}</Text>;
}

export function PresenceChip({ presence }: any) {
  if (!presence) return null;
  return (
    <View style={styles.presenceChip}>
      <View style={[styles.presenceDot, presence.isOnline ? styles.presenceOnline : styles.presenceOffline]} />
      <Text style={styles.presenceText}>{presence.name} · {presence.label}</Text>
    </View>
  );
}

export const sharedStyles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.76)',
    color: palette.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    fontSize: 15,
  },
  textarea: {
    minHeight: 130,
    textAlignVertical: 'top',
  },
  helper: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  sectionGap: {
    gap: 16,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  background: { flex: 1, backgroundColor: palette.bg },
  ambientOne: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(194,89,52,0.13)', top: -50, left: -80 },
  ambientTwo: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(144,165,141,0.18)', bottom: -60, right: -100 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 128, gap: 18 },
  contentWithoutNav: { paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 44, height: 44, borderRadius: 16, backgroundColor: palette.terracotta, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontWeight: '700', letterSpacing: 1.2 },
  brandTitle: { color: palette.text, fontSize: 28, lineHeight: 30, fontFamily: 'serif' },
  eyebrow: { color: palette.muted, fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase' },
  heroBlock: { gap: 10, marginTop: 10 },
  pageTitle: { color: palette.text, fontSize: 42, lineHeight: 42, fontFamily: 'serif' },
  pageSubtitle: { color: palette.muted, fontSize: 15, lineHeight: 24 },
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 28, padding: 18, gap: 12 },
  button: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: palette.forest },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(44,59,46,0.18)' },
  buttonGhost: { backgroundColor: 'rgba(255,255,255,0.52)' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  buttonPrimaryText: { color: '#fff' },
  buttonSecondaryText: { color: palette.forest },
  statCard: { flex: 1, minWidth: 100, backgroundColor: palette.surfaceStrong, borderWidth: 1, borderColor: palette.line, borderRadius: 24, padding: 16, gap: 6 },
  statValue: { color: palette.forest, fontSize: 28, fontFamily: 'serif' },
  statLabel: { color: palette.muted, fontSize: 13 },
  statePill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  stateAligned: { backgroundColor: 'rgba(59,142,83,0.12)', color: palette.success },
  stateDormant: { backgroundColor: 'rgba(144,165,141,0.18)', color: palette.forest },
  stateMisaligned: { backgroundColor: 'rgba(194,89,52,0.12)', color: palette.terracotta },
  stateBlocked: { backgroundColor: 'rgba(194,89,52,0.16)', color: '#9A462C' },
  stateFractured: { backgroundColor: 'rgba(132,72,66,0.16)', color: '#7A3E38' },
  presenceChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: palette.line },
  presenceDot: { width: 9, height: 9, borderRadius: 5 },
  presenceOnline: { backgroundColor: palette.success },
  presenceOffline: { backgroundColor: '#B1A28E' },
  presenceText: { color: palette.muted, fontSize: 13 },
  navWrap: { position: 'absolute', left: 14, right: 14, bottom: 14, flexDirection: 'row', gap: 8, padding: 10, borderRadius: 28, backgroundColor: 'rgba(255,253,252,0.92)', borderWidth: 1, borderColor: palette.line },
  navItem: { flex: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  navItemActive: { backgroundColor: 'rgba(44,59,46,0.1)' },
  navLabel: { color: palette.muted, fontSize: 12 },
  navLabelActive: { color: palette.forest, fontWeight: '700' },
});