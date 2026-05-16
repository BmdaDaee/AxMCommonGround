// packages/mobile/app/(onboarding)/invite.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Share, StyleSheet,
  ActivityIndicator, Clipboard
} from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { trpc } from '../../src/lib/trpc';
import * as Haptics from 'expo-haptics';

function formatCountdown(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m remaining`;
}

export default function InviteScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  const statusQuery = trpc.pairs.getInviteStatus.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const createInvite = trpc.pairs.createInvite.useMutation();

  useEffect(() => {
    if (!statusQuery.data?.pending && !statusQuery.isLoading) {
      createInvite.mutate();
    }
  }, [statusQuery.isLoading]);

  useEffect(() => {
    if (statusQuery.data?.pairId) {
      router.replace('/(app)/dashboard');
    }
  }, [statusQuery.data]);

  useEffect(() => {
    const expiresAt = statusQuery.data?.expiresAt ?? createInvite.data?.expiresAt;
    if (!expiresAt) return;
    const date = new Date(expiresAt);
    setCountdown(formatCountdown(date));
    const interval = setInterval(() => setCountdown(formatCountdown(date)), 60000);
    return () => clearInterval(interval);
  }, [statusQuery.data?.expiresAt, createInvite.data?.expiresAt]);

  const code = statusQuery.data?.code ?? createInvite.data?.code;

  const handleCopy = useCallback(async () => {
    if (!code) return;
    await ExpoClipboard.setStringAsync(code);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleShare = useCallback(async () => {
    if (!code) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Share.share({
      message: `Join me on CommonGround. Your code: ${code}`,
      title: 'CommonGround Invite',
    });
  }, [code]);

  const isLoading = statusQuery.isLoading || createInvite.isPending;

  return (
    <View style={s.container}>
      <Text style={s.label}>CommonGround</Text>
      <Text style={s.heading}>Invite Your{'\n'}Partner</Text>
      <Text style={s.sub}>
        Share this code. When they enter it, your shared space activates.
      </Text>

      {isLoading ? (
        <View style={s.codeBox}>
          <ActivityIndicator color="#D4AF37" />
        </View>
      ) : code ? (
        <>
          <TouchableOpacity style={s.codeBox} onPress={handleCopy} activeOpacity={0.7}>
            <Text style={s.code}>{code}</Text>
            <Text style={s.copyHint}>{copied ? '✓ Copied' : 'Tap to copy'}</Text>
          </TouchableOpacity>

          <View style={s.meta}>
            <Text style={s.metaText}>{countdown}</Text>
            <Text style={s.metaText}>48h window</Text>
          </View>

          <View style={s.actions}>
            <TouchableOpacity style={s.btnPrimary} onPress={handleShare}>
              <Text style={s.btnPrimaryText}>Share Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.btnSecondary}
              onPress={() => router.push('/(onboarding)/join')}
            >
              <Text style={s.btnSecondaryText}>I Have a Code</Text>
            </TouchableOpacity>
          </View>

          <View style={s.waiting}>
            <Text style={s.waitingText}>Waiting for partner to connect...</Text>
          </View>
        </>
      ) : (
        <Text style={s.error}>Failed to generate code. Pull down to retry.</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808', padding: 32, justifyContent: 'center' },
  label: { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 },
  heading: { fontFamily: 'SpaceMono', fontSize: 36, color: '#F5F5F5', letterSpacing: -1, textTransform: 'uppercase', marginBottom: 12 },
  sub: { fontSize: 14, color: '#808080', lineHeight: 22, marginBottom: 48 },
  codeBox: { backgroundColor: '#0F0F0F', borderWidth: 1, borderColor: '#2A2A2A', padding: 40, alignItems: 'center', marginBottom: 16 },
  code: { fontFamily: 'SpaceMono', fontSize: 40, color: '#D4AF37', letterSpacing: 12, marginBottom: 12 },
  copyHint: { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 3, textTransform: 'uppercase' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  metaText: { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 2, textTransform: 'uppercase' },
  actions: { gap: 12, marginBottom: 40 },
  btnPrimary: { backgroundColor: '#D4AF37', padding: 16, alignItems: 'center' },
  btnPrimaryText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#080808', letterSpacing: 3, textTransform: 'uppercase' },
  btnSecondary: { borderWidth: 1, borderColor: '#1E1E1E', padding: 16, alignItems: 'center' },
  btnSecondaryText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#B0B0B0', letterSpacing: 3, textTransform: 'uppercase' },
  waiting: { borderTopWidth: 1, borderTopColor: '#1E1E1E', paddingTop: 24, alignItems: 'center' },
  waitingText: { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 2, textTransform: 'uppercase' },
  error: { fontFamily: 'SpaceMono', fontSize: 10, color: '#E63946', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' },
});
