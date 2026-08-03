import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../../src/lib/trpc';

// Card background colors — Pastel Pulse palette
const CARD_COLORS = ['#B8C5B9', '#C5B8D4', '#D4B8B8', '#B8C5C5', '#D4C5B8', '#B8B8D4'];

function getCardColor(index: number) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

export default function SparksScreen() {
  const [answerText, setAnswerText] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Fetch current pair
  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  // Fetch sparks for the pair
  const sparksQuery = trpc.sparks.getDailySparks.useQuery(
    { pairId: pairId!, isDeeplyUs: false },
    { enabled: !!pairId }
  );

  // Submit answer mutation
  const submitMutation = trpc.sparks.submitAnswer.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAnswerText('');
      setSelectedOption(null);
      sparksQuery.refetch();
    },
  });

  // --- Loading State ---
  if (pairQuery.isLoading || (pairId && sparksQuery.isLoading)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Loading your sparks…</Text>
      </View>
    );
  }

  // --- No Pair State ---
  if (!pairId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No pair found</Text>
        <Text style={styles.emptyBody}>Link up with your partner first.</Text>
      </View>
    );
  }

  const sparks = sparksQuery.data ?? [];

  // --- Empty State ---
  if (sparks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>You're all caught up for today.</Text>
        <Text style={styles.emptyBody}>New sparks drop daily. Come back tomorrow.</Text>
      </View>
    );
  }

  // Find the first actionable spark (UNANSWERED first, then WAITING, then REVEALED)
  const sortedSparks = [...sparks].sort((a, b) => {
    const order = { UNANSWERED: 0, WAITING_ON_PARTNER: 1, REVEALED: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  const activeSpark = sortedSparks[0];
  const content = activeSpark.content as any;

  function handleSubmit() {
    const answer = activeSpark.type === 'WOULD_YOU_RATHER' ? selectedOption : answerText;
    if (!answer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitMutation.mutate({
      sparkId: activeSpark.id,
      pairId: pairId!,
      answer,
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={sparksQuery.isFetching}
          onRefresh={() => sparksQuery.refetch()}
          tintColor="#D4AF37"
        />
      }
    >
      {/* Black/Gold Shell */}
      <Text style={styles.header}>Daily Sparks</Text>

      {/* Active Spark Card */}
      <View style={[styles.card, { backgroundColor: getCardColor(sortedSparks.indexOf(activeSpark)) }]}>

        {/* --- UNANSWERED: Show prompt + input --- */}
        {activeSpark.status === 'UNANSWERED' && (
          <View style={styles.cardInner}>
            <Text style={styles.typeLabel}>{activeSpark.type.replace(/_/g, ' ')}</Text>

            {activeSpark.type === 'WOULD_YOU_RATHER' ? (
              <>
                <Text style={styles.promptText}>Would you rather…</Text>
                <TouchableOpacity
                  style={[styles.optionButton, selectedOption === content.optionA && styles.optionSelected]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedOption(content.optionA); }}
                >
                  <Text style={styles.optionText}>{content.optionA}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, selectedOption === content.optionB && styles.optionSelected]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedOption(content.optionB); }}
                >
                  <Text style={styles.optionText}>{content.optionB}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.promptText}>{content.prompt}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your answer…"
                  placeholderTextColor="#666"
                  value={answerText}
                  onChangeText={setAnswerText}
                  multiline
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, submitMutation.isPending && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
            >
              <Text style={styles.submitText}>
                {submitMutation.isPending ? 'Sending…' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- WAITING_ON_PARTNER: Frosted overlay --- */}
        {activeSpark.status === 'WAITING_ON_PARTNER' && (
          <View style={styles.cardInner}>
            <Text style={styles.typeLabel}>{activeSpark.type.replace(/_/g, ' ')}</Text>
            <Text style={styles.promptText}>
              {content.prompt || 'Would you rather…'}
            </Text>
            <Text style={styles.answeredNote}>Your answer is locked in ✓</Text>
            <View style={styles.frostedOverlay}>
              <Text style={styles.waitingText}>Waiting on partner…</Text>
            </View>
          </View>
        )}

        {/* --- REVEALED: Show both answers + Bently synthesis --- */}
        {activeSpark.status === 'REVEALED' && (
          <View style={styles.cardInner}>
            <Text style={styles.typeLabel}>{activeSpark.type.replace(/_/g, ' ')}</Text>
            <Text style={styles.promptText}>
              {content.prompt || 'Would you rather…'}
            </Text>

            <View style={styles.answersContainer}>
              <View style={styles.answerBubble}>
                <Text style={styles.answerLabel}>You</Text>
                <Text style={styles.answerText}>{activeSpark.user1Answer}</Text>
              </View>
              <View style={styles.answerBubble}>
                <Text style={styles.answerLabel}>Partner</Text>
                <Text style={styles.answerText}>{activeSpark.user2Answer}</Text>
              </View>
            </View>

            {activeSpark.bentlySynthesis && (
              <View style={styles.synthesisContainer}>
                <Text style={styles.synthesisText}>{activeSpark.bentlySynthesis}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Remaining sparks count */}
      {sortedSparks.length > 1 && (
        <Text style={styles.remainingText}>
          {sortedSparks.filter(s => s.status === 'UNANSWERED').length} more spark{sortedSparks.filter(s => s.status === 'UNANSWERED').length !== 1 ? 's' : ''} today
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centerContainer: { flex: 1, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  loadingText: { color: '#D4AF37', marginTop: 12, fontSize: 14 },
  emptyTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  emptyBody: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' },

  // Card
  card: { borderRadius: 24, padding: 24, minHeight: 300, overflow: 'hidden', position: 'relative' },
  cardInner: { flex: 1, zIndex: 1 },
  typeLabel: { fontSize: 11, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  promptText: { fontFamily: 'Fraunces', fontSize: 20, color: '#1A1A1A', marginBottom: 20 },

  // Would You Rather options
  optionButton: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.15)' },
  optionText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },

  // Text input
  textInput: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 16, fontSize: 16, color: '#1A1A1A', minHeight: 80, textAlignVertical: 'top' },

  // Submit
  submitButton: { backgroundColor: '#080808', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 16 },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },

  // Waiting state
  answeredNote: { color: '#333', fontSize: 13, marginBottom: 8 },
  frostedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
  waitingText: { color: '#080808', fontWeight: 'bold', fontSize: 16 },

  // Revealed state
  answersContainer: { marginTop: 8, gap: 12 },
  answerBubble: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: 12 },
  answerLabel: { fontSize: 11, fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: 4 },
  answerText: { fontSize: 15, color: '#1A1A1A' },
  synthesisContainer: { marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 16 },
  synthesisText: { fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 16, color: '#1A1A1A', lineHeight: 24 },

  // Footer
  remainingText: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 16 },
});
