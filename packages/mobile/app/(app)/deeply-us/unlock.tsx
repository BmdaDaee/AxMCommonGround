import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../../src/lib/trpc';
import { getTheme } from '../../../src/lib/theme';

const theme = getTheme(true);

export default function DeeplyUsUnlockScreen() {
  const router = useRouter();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const unlockStatus = trpc.deeplyUs.getUnlockStatus.useQuery(
    { pairId: pairId! },
    { enabled: !!pairId },
  );

  const confirmMutation = trpc.deeplyUs.confirmUnlock.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      unlockStatus.refetch();
    },
  });

  if (pairQuery.isLoading || unlockStatus.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!pairId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          DeeplyUs requires an active pair. Link up with your partner first.
        </Text>
      </View>
    );
  }

  // Already fully unlocked — redirect
  if (unlockStatus.data?.unlocked) {
    router.replace('/deeply-us');
    return null;
  }

  const handleConfirm = () => {
    if (!ageConfirmed || !consentConfirmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    confirmMutation.mutate({
      pairId: pairId!,
      ageConfirmation: true,
      consentConfirmation: true,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>DeeplyUs</Text>
      <Text style={styles.subtitle}>Intimate Communication</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What is DeeplyUs?</Text>
        <Text style={styles.cardBody}>
          DeeplyUs is CommonGround's intimate-communication tier. Same Bently, same
          relationship — but unlocked into a space built for physical and sexual
          intimacy communication. Desires, boundaries, fantasies, insecurities —
          the things that are hardest to say out loud.
        </Text>
        <Text style={styles.cardBody}>
          This is not roleplay. This is not erotica. This is a communication tool
          for two real partners who want to connect more deeply.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mutual Consent Required</Text>
        <Text style={styles.cardBody}>
          Both partners must independently opt in. Neither can unlock this for the
          other. This is a consent requirement, not a formality.
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, unlockStatus.data?.myUnlock && styles.statusDotActive]} />
          <Text style={styles.statusText}>
            You: {unlockStatus.data?.myUnlock ? 'Confirmed' : 'Not yet confirmed'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, unlockStatus.data?.partnerUnlock && styles.statusDotActive]} />
          <Text style={styles.statusText}>
            Partner: {unlockStatus.data?.partnerUnlock ? 'Confirmed' : 'Waiting'}
          </Text>
        </View>
      </View>

      {!unlockStatus.data?.myUnlock && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Confirm Access</Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              setAgeConfirmed(!ageConfirmed);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
              {ageConfirmed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I confirm that I am 18 years of age or older.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              setConsentConfirmed(!consentConfirmed);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={[styles.checkbox, consentConfirmed && styles.checkboxChecked]}>
              {consentConfirmed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I consent to accessing intimate communication content and understand
              this feature facilitates real conversation between my partner and me.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!ageConfirmed || !consentConfirmed) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!ageConfirmed || !consentConfirmed || confirmMutation.isPending}
          >
            {confirmMutation.isPending ? (
              <ActivityIndicator color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm & Unlock</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {unlockStatus.data?.myUnlock && !unlockStatus.data?.partnerUnlock && (
        <View style={styles.card}>
          <Text style={styles.waitingText}>
            You've confirmed. Waiting for your partner to do the same.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.base,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  title: {
    fontSize: theme.typography.size['3xl'],
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary.DEFAULT,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
  },
  cardTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  cardBody: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.text.tertiary,
    marginRight: theme.spacing.sm,
  },
  statusDotActive: {
    backgroundColor: '#7BA37E',
  },
  statusText: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.secondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border.strong,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderColor: theme.colors.primary.DEFAULT,
  },
  checkmark: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: theme.typography.weight.bold,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.inverse,
  },
  waitingText: {
    fontSize: theme.typography.size.base,
    color: theme.colors.primary.DEFAULT,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
});
