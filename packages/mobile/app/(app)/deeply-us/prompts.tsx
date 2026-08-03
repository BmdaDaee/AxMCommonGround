import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../../src/lib/trpc';
import { getTheme } from '../../../src/lib/theme';

const theme = getTheme(true);

export default function DeeplyUsPromptsScreen() {
  const [answer, setAnswer] = useState('');

  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const sparksQuery = trpc.sparks.getDailySparks.useQuery(
    { pairId: pairId!, isDeeplyUs: true },
    { enabled: !!pairId },
  );

  const submitMutation = trpc.sparks.submitAnswer.useMutation({
    onSuccess: () => {
      setAnswer('');
      sparksQuery.refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  if (pairQuery.isLoading || sparksQuery.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  const sparks = sparksQuery.data || [];
  const currentSpark = sparks[0];

  const handleSubmit = () => {
    if (!answer.trim() || !currentSpark) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    submitMutation.mutate({
      sparkId: currentSpark.id,
      answer: answer.trim(),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={sparksQuery.isRefetching}
          onRefresh={() => sparksQuery.refetch()}
          tintColor={theme.colors.primary.DEFAULT}
        />
      }
    >
      <Text style={styles.title}>Intimate Prompts</Text>
      <Text style={styles.subtitle}>Same blind-reveal. Deeper territory.</Text>

      {!currentSpark && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyText}>
            You're all caught up. New intimate prompts drop daily.
          </Text>
        </View>
      )}

      {currentSpark && (
        <View style={styles.sparkCard}>
          <Text style={styles.categoryBadge}>{currentSpark.content?.category || 'INTIMATE'}</Text>

          {/* UNANSWERED — show prompt + input */}
          {currentSpark.status === 'UNANSWERED' && (
            <>
              <Text style={styles.promptText}>
                {typeof currentSpark.content === 'object'
                  ? currentSpark.content.prompt
                  : currentSpark.content}
              </Text>
              {currentSpark.content?.followUp && (
                <Text style={styles.followUpText}>{currentSpark.content.followUp}</Text>
              )}
              <TextInput
                style={styles.answerInput}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Your answer..."
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.submitButton, !answer.trim() && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!answer.trim() || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator color={theme.colors.text.inverse} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* WAITING_ON_PARTNER — frosted overlay */}
          {currentSpark.status === 'WAITING_ON_PARTNER' && (
            <>
              <Text style={styles.promptText}>
                {typeof currentSpark.content === 'object'
                  ? currentSpark.content.prompt
                  : currentSpark.content}
              </Text>
              <View style={styles.frostedOverlay}>
                <Text style={styles.frostedText}>Waiting on partner...</Text>
                <Text style={styles.frostedSubtext}>
                  Their answer is hidden until they respond.
                </Text>
              </View>
            </>
          )}

          {/* REVEALED — show both answers + synthesis */}
          {currentSpark.status === 'REVEALED' && (
            <>
              <Text style={styles.promptText}>
                {typeof currentSpark.content === 'object'
                  ? currentSpark.content.prompt
                  : currentSpark.content}
              </Text>
              <View style={styles.answerBubble}>
                <Text style={styles.answerLabel}>You</Text>
                <Text style={styles.answerText}>{currentSpark.user1Answer}</Text>
              </View>
              <View style={styles.answerBubble}>
                <Text style={styles.answerLabel}>Partner</Text>
                <Text style={styles.answerText}>{currentSpark.user2Answer}</Text>
              </View>
              {currentSpark.bentlySynthesis && (
                <View style={styles.synthesisContainer}>
                  <Text style={styles.synthesisLabel}>BENTLY</Text>
                  <Text style={styles.synthesisText}>{currentSpark.bentlySynthesis}</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Show remaining sparks as preview cards */}
      {sparks.slice(1).map((spark) => (
        <View key={spark.id} style={styles.previewCard}>
          <Text style={styles.previewCategory}>{spark.content?.category || 'INTIMATE'}</Text>
          <Text style={styles.previewStatus}>
            {spark.status === 'UNANSWERED' ? 'Tap to answer' :
             spark.status === 'WAITING_ON_PARTNER' ? 'Waiting...' : 'Revealed'}
          </Text>
        </View>
      ))}
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
    fontSize: theme.typography.size['2xl'],
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
  emptyCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
  },
  emptyIcon: {
    fontSize: 36,
    color: theme.colors.primary.DEFAULT,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  sparkCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary.DEFAULT}30`,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary.DEFAULT,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.md,
  },
  promptText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
    lineHeight: 26,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  followUpText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  answerInput: {
    backgroundColor: theme.colors.background.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.size.base,
    color: theme.colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
    marginBottom: theme.spacing.md,
  },
  submitButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.inverse,
  },
  frostedOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  frostedText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.primary.DEFAULT,
  },
  frostedSubtext: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  answerBubble: {
    backgroundColor: theme.colors.background.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  answerText: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  synthesisContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.DEFAULT,
  },
  synthesisLabel: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary.DEFAULT,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  synthesisText: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  previewCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
  },
  previewCategory: {
    fontSize: 11,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary.DEFAULT,
    letterSpacing: 1,
  },
  previewStatus: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
  },
});
