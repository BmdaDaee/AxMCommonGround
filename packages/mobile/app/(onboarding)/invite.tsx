import { useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { AppScreen, ActionButton, GlassCard, sharedStyles } from '../../src/ui/primitives';
import { trpc } from '../../src/lib/trpc';

export default function InviteScreen() {
  const router = useRouter();
  const requestedRef = useRef(false);
  const createInviteMutation = trpc.pairs.createInvite.useMutation();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    createInviteMutation.mutate(undefined, {
      onSuccess: (data) => setInviteCode(data.inviteCode),
    });
  }, []);

  const handleShare = async () => {
    if (!inviteCode) return;
    await Share.share({ message: `Join me on CommonGround with this code: ${inviteCode}` });
  };

  return (
    <AppScreen hideNav eyebrow="Partnership setup" title="Invite your partner into the space." subtitle="The room stays calm until both people are here. After that, messages, Bently, and the full dashboard wake up together.">
      <GlassCard>
        <Text style={styles.codeLabel}>Your invite code</Text>
        <Text style={styles.codeValue}>{inviteCode || 'Creating…'}</Text>
        <Text style={sharedStyles.helper}>{copied ? 'Copied to clipboard.' : 'Codes last for 7 days and can be regenerated anytime.'}</Text>
        <View style={styles.actionStack}>
          <ActionButton label="Share invite" onPress={handleShare} disabled={!inviteCode} testID="mobile-invite-share-button" />
          <ActionButton label="Copy code" variant="secondary" onPress={async () => {
            if (!inviteCode) return;
            await Clipboard.setStringAsync(inviteCode);
            setCopied(true);
            Haptics.selectionAsync();
          }} testID="mobile-invite-copy-button" />
          <ActionButton label="Back to dashboard" variant="ghost" onPress={() => router.replace('/(app)/dashboard')} />
        </View>
      </GlassCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  codeLabel: { color: '#617160', fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase' },
  codeValue: { color: '#172117', fontSize: 44, lineHeight: 46, fontFamily: 'serif', letterSpacing: 2 },
  actionStack: { gap: 10 },
});