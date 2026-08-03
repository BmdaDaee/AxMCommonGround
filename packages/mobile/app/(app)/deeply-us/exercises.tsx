import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../../src/lib/trpc';
import { getTheme } from '../../../src/lib/theme';

const theme = getTheme(true);

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#7BA37E',
  MEDIUM: '#D4AF37',
  HARD: '#B76E79',
};

export default function DeeplyUsExercisesScreen() {
  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const exercisesQuery = trpc.deeplyUs.exercises.list.useQuery(
    { pairId: pairId! },
    { enabled: !!pairId },
  );

  const completeMutation = trpc.deeplyUs.exercises.complete.useMutation({
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      exercisesQuery.refetch();
    },
  });

  if (pairQuery.isLoading || exercisesQuery.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  const exercises = exercisesQuery.data || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Guided Exercises</Text>
      <Text style={styles.subtitle}>Structured experiences for deeper connection</Text>

      {exercises.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No exercises available yet.</Text>
        </View>
      )}

      {exercises.map((exercise) => {
        const isCompleted = exercise.userProgress?.completed;
        const difficultyColor = DIFFICULTY_COLORS[exercise.difficulty] || theme.colors.text.tertiary;

        return (
          <View key={exercise.id} style={[styles.exerciseCard, isCompleted && styles.exerciseCardCompleted]}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseTitle}>{exercise.title}</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20` }]}>
                <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                  {exercise.difficulty}
                </Text>
              </View>
            </View>

            <Text style={styles.exerciseDescription}>{exercise.description}</Text>

            <View style={styles.exerciseMeta}>
              <Text style={styles.metaText}>⏱ {exercise.duration} min</Text>
              <Text style={styles.metaText}>✦ {exercise.xpReward} XP</Text>
              <Text style={[styles.metaText, { color: difficultyColor }]}>
                {exercise.category}
              </Text>
            </View>

            {isCompleted ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓ Completed</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  completeMutation.mutate({ pairId: pairId!, exerciseId: exercise.id });
                }}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <ActivityIndicator color={theme.colors.text.inverse} size="small" />
                ) : (
                  <Text style={styles.completeButtonText}>Mark Complete</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        );
      })}
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
  emptyText: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.secondary,
  },
  exerciseCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
  },
  exerciseCardCompleted: {
    opacity: 0.7,
    borderColor: '#7BA37E40',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  exerciseTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: theme.typography.weight.bold,
    letterSpacing: 0.5,
  },
  exerciseDescription: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metaText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
  },
  completeButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.inverse,
  },
  completedBadge: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  completedText: {
    fontSize: theme.typography.size.base,
    color: '#7BA37E',
    fontWeight: theme.typography.weight.semibold,
  },
});
