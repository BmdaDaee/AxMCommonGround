import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';

export default function InviteScreen() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createInviteMutation = trpc.pairs.createInvite.useMutation();

  useEffect(() => {
    handleCreateInvite();
  }, []);

  const handleCreateInvite = async () => {
    try {
      const result = await createInviteMutation.mutateAsync();
      setInviteCode(result.inviteCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to create invite:', error);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message:
          `I want us to try CommonGround together.\n\n` +
          `It's a space for the two of us — Bently sits in the middle, doesn't take sides, ` +
          `helps when we need a third presence.\n\n` +
          `Use this code to join me: ${inviteCode}\n\n` +
          `Download the app first, then enter the code.`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (createInviteMutation.isPending && !inviteCode) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Preparing your space…</Text>
      </View>
    );
  }

  if (createInviteMutation.isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Something held this up.</Text>
        <Text style={styles.errorBody}>
          We couldn't create your invite code right now.{'\n'}
          Worth trying again in a moment.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateInvite}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>STEP 1 OF 2</Text>
      <Text style={styles.title}>Invite your partner</Text>

      <View style={styles.divider} />

      <Text style={styles.body}>
        This is your code. Share it with the person you want to share this space with.
        {'\n\n'}
        Until both of you are here, CommonGround stays quiet. Bently won't speak.
        The relational engine won't activate. That's intentional.
      </Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>YOUR INVITE CODE</Text>
        <Text style={styles.code}>{inviteCode}</Text>
        <TouchableOpacity onPress={handleCopy}>
          <Text style={styles.copyHint}>
            {copied ? '✓ Copied' : 'Tap to copy'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
        <Text style={styles.primaryButtonText}>Share with partner</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.replace('/(app)/dashboard')}
      >
        <Text style={styles.secondaryButtonText}>I'll share later</Text>
      </TouchableOpacity>

      <View style={styles.footnote}>
        <Text style={styles.footnoteText}>
          Codes expire after 7 days. You can generate a new one anytime.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#080808',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '300',
  },
  eyebrow: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#D4AF37',
    marginBottom: 24,
  },
  body: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '300',
    marginBottom: 32,
  },
  codeCard: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 8,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 12,
  },
  code: {
    color: '#D4AF37',
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 4,
    fontFamily: 'SpaceMono',
    marginBottom: 16,
  },
  copyHint: {
    color: '#888',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#080808',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#888',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  footnote: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  footnoteText: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '300',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    color: '#888',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '300',
  },
});
