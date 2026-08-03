import React from 'react';
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

export default function DeeplyUsHomeScreen() {
  const router = useRouter();
  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const unlockStatus = trpc.deeplyUs.getUnlockStatus.useQuery(
    { pairId: pairId! },
    { enabled: !!pairId },
  );

  if (pairQuery.isLoading || unlockStatus.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  // Redirect to unlock if not unlocked
  if (!unlockStatus.data?.unlocked) {
    router.replace('/deeply-us/unlock');
    return null;
  }

  const navigateTo = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>DeeplyUs</Text>
      <Text style={styles.subtitle}>Your intimate space</Text>

      {/* Chat Card */}
      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => navigateTo('/deeply-us/chat')}
        activeOpacity={0.8}
      >
        <Text style={styles.featureIcon}>◈</Text>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Talk to Bently</Text>
          <Text style={styles.featureDescription}>
            Intimate communication facilitation — desires, boundaries, the things
            that are hardest to say.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Prompts Card */}
      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => navigateTo('/deeply-us/prompts')}
        activeOpacity={0.8}
      >
        <Text style={styles.featureIcon}>✦</Text>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Intimate Prompts</Text>
          <Text style={styles.featureDescription}>
            12 prompts across fantasy, desire, insecurity, exploration, connection,
            and aftercare. Same blind-reveal as Sparks.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Exercises Card */}
      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => navigateTo('/deeply-us/exercises')}
        activeOpacity={0.8}
      >
        <Text style={styles.featureIcon}>◉</Text>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Guided Exercises</Text>
          <Text style={styles.featureDescription}>
            Sensate Focus, Fantasy Share, Body Insecurity Share — structured
            experiences to deepen your connection.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Desire Map Card */}
      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => navigateTo('/deeply-us/desire-map')}
        activeOpacity={0.8}
      >
        <Text style={styles.featureIcon}>♡</Text>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Yes / No / Maybe</Text>
          <Text style={styles.featureDescription}>
            Map your desires and boundaries together. See where you overlap,
            where you differ, and where curiosity lives.
          </Text>
        </View>
      </TouchableOpacity>
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
  featureCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    color: theme.colors.primary.DEFAULT,
    marginRight: theme.spacing.md,
    width: 40,
    textAlign: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});
