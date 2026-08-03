import React, { useState, useEffect } from 'react';
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

// Default desire map items — users can add custom ones later
const DEFAULT_ITEMS = [
  'Blindfolds',
  'Roleplay (with each other)',
  'Light restraints',
  'Massage / body worship',
  'Dirty talk',
  'Watching each other',
  'Toys together',
  'Shower / bath together',
  'Extended foreplay',
  'Morning intimacy',
  'Spontaneous / unplanned',
  'Slow and intentional',
  'Dominant / submissive dynamic',
  'Lingerie / dressing up',
  'Sexting / photos',
  'New locations',
  'Oral focus',
  'Eye contact during',
  'Verbal affirmation during',
  'Aftercare / holding after',
];

type Response = 'YES' | 'NO' | 'MAYBE';

interface DesireItem {
  item: string;
  response: Response;
}

const RESPONSE_COLORS: Record<Response, string> = {
  YES: '#7BA37E',
  NO: '#E07A5F',
  MAYBE: '#D4AF37',
};

export default function DeeplyUsDesireMapScreen() {
  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const desireMapQuery = trpc.deeplyUs.desireMap.get.useQuery(
    { pairId: pairId! },
    { enabled: !!pairId },
  );

  const updateMutation = trpc.deeplyUs.desireMap.update.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      desireMapQuery.refetch();
    },
  });

  const [desires, setDesires] = useState<DesireItem[]>([]);
  const [showPartner, setShowPartner] = useState(false);

  // Initialize from server data or defaults
  useEffect(() => {
    if (desireMapQuery.data?.mine?.desires && Array.isArray(desireMapQuery.data.mine.desires) && desireMapQuery.data.mine.desires.length > 0) {
      setDesires(desireMapQuery.data.mine.desires as DesireItem[]);
    } else {
      setDesires(DEFAULT_ITEMS.map((item) => ({ item, response: 'MAYBE' as Response })));
    }
  }, [desireMapQuery.data]);

  const toggleResponse = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDesires((prev) => {
      const updated = [...prev];
      const current = updated[index].response;
      // Cycle: MAYBE → YES → NO → MAYBE
      const next: Response = current === 'MAYBE' ? 'YES' : current === 'YES' ? 'NO' : 'MAYBE';
      updated[index] = { ...updated[index], response: next };
      return updated;
    });
  };

  const handleSave = () => {
    if (!pairId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    updateMutation.mutate({
      pairId,
      desires,
      boundaries: desires.filter((d) => d.response === 'NO'),
    });
  };

  if (pairQuery.isLoading || desireMapQuery.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  const partnerDesires = (desireMapQuery.data?.partner?.desires || []) as DesireItem[];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Yes / No / Maybe</Text>
      <Text style={styles.subtitle}>Tap each item to cycle through responses</Text>

      {/* Toggle between My Map and Partner's Map */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, !showPartner && styles.toggleButtonActive]}
          onPress={() => setShowPartner(false)}
        >
          <Text style={[styles.toggleText, !showPartner && styles.toggleTextActive]}>Mine</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, showPartner && styles.toggleButtonActive]}
          onPress={() => {
            setShowPartner(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={[styles.toggleText, showPartner && styles.toggleTextActive]}>Partner</Text>
        </TouchableOpacity>
      </View>

      {!showPartner ? (
        <>
          {/* My desire map */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: RESPONSE_COLORS.YES }]} />
              <Text style={styles.legendText}>Yes</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: RESPONSE_COLORS.MAYBE }]} />
              <Text style={styles.legendText}>Maybe</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: RESPONSE_COLORS.NO }]} />
              <Text style={styles.legendText}>No</Text>
            </View>
          </View>

          {desires.map((desire, index) => (
            <TouchableOpacity
              key={desire.item}
              style={[
                styles.desireRow,
                { borderLeftColor: RESPONSE_COLORS[desire.response] },
              ]}
              onPress={() => toggleResponse(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.desireText}>{desire.item}</Text>
              <View style={[styles.responseBadge, { backgroundColor: `${RESPONSE_COLORS[desire.response]}20` }]}>
                <Text style={[styles.responseText, { color: RESPONSE_COLORS[desire.response] }]}>
                  {desire.response}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.saveButtonText}>Save My Map</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Partner's desire map */}
          {partnerDesires.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Your partner hasn't filled out their map yet.
              </Text>
            </View>
          ) : (
            partnerDesires.map((desire) => (
              <View
                key={desire.item}
                style={[
                  styles.desireRow,
                  { borderLeftColor: RESPONSE_COLORS[desire.response] },
                ]}
              >
                <Text style={styles.desireText}>{desire.item}</Text>
                <View style={[styles.responseBadge, { backgroundColor: `${RESPONSE_COLORS[desire.response]}20` }]}>
                  <Text style={[styles.responseText, { color: RESPONSE_COLORS[desire.response] }]}>
                    {desire.response}
                  </Text>
                </View>
              </View>
            ))
          )}
        </>
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
    marginBottom: theme.spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  toggleText: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
  },
  toggleTextActive: {
    color: theme.colors.text.inverse,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
  },
  desireRow: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  desireText: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  responseBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    minWidth: 55,
    alignItems: 'center',
  },
  responseText: {
    fontSize: 12,
    fontWeight: theme.typography.weight.bold,
    letterSpacing: 0.5,
  },
  saveButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  saveButtonText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.inverse,
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
    textAlign: 'center',
  },
});
