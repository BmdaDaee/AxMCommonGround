import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../../src/lib/trpc';

// ─── Theme Definitions ───────────────────────────────────────────────────────

const THEME = {
  common: {
    bg: '#080808',
    accent: '#D4AF37',
    headerText: 'Daily Sparks',
    cardColors: ['#B8C5B9', '#C5B8D4', '#D4B8B8', '#B8C5C5', '#D4C5B8', '#B8B8D4'],
  },
  deeply: {
    bg: '#110505',
    accent: '#B76E79',
    headerText: 'DeeplyUs',
    cardColors: ['#2D1B1B', '#1B1B2D', '#2D1B2D', '#1B2D2D', '#2D2D1B', '#1B2D1B'],
  },
};

function getCardColor(index: number, isDeeply: boolean) {
  const colors = isDeeply ? THEME.deeply.cardColors : THEME.common.cardColors;
  return colors[index % colors.length];
}

// ─── Mode Toggle Component ───────────────────────────────────────────────────

function ModeToggle({ isDeeply, onToggle }: { isDeeply: boolean; onToggle: () => void }) {
  const slideAnim = useRef(new Animated.Value(isDeeply ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isDeeply ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [isDeeply]);

  const indicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  const commonOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  });

  const deeplyOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const indicatorColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#D4AF37', '#B76E79'],
  });

  return (
    <View style={toggleStyles.container}>
      <Animated.View
        style={[
          toggleStyles.indicator,
          { left: indicatorLeft, backgroundColor: indicatorColor },
        ]}
      />
      <TouchableOpacity
        style={toggleStyles.side}
        onPress={() => { if (isDeeply) onToggle(); }}
        activeOpacity={0.7}
      >
        <Animated.Text style={[toggleStyles.label, { opacity: commonOpacity }]}>
          CommonGround
        </Animated.Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={toggleStyles.side}
        onPress={() => { if (!isDeeply) onToggle(); }}
        activeOpacity={0.7}
      >
        <Animated.Text style={[toggleStyles.label, { opacity: deeplyOpacity }]}>
          DeeplyUs
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 28,
    height: 44,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '48%',
    borderRadius: 24,
    opacity: 0.2,
  },
  side: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SparksScreen() {
  const [isDeeplyMode, setIsDeeplyMode] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Background color animation
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isDeeplyMode ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [isDeeplyMode]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THEME.common.bg, THEME.deeply.bg],
  });

  const accentColor = isDeeplyMode ? THEME.deeply.accent : THEME.common.accent;
  const headerText = isDeeplyMode ? THEME.deeply.headerText : THEME.common.headerText;

  // Toggle handler
  function handleToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnswerText('');
    setSelectedOption(null);
    setIsDeeplyMode(prev => !prev);
  }

  // Fetch current pair
  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  // Fetch sparks — refetches when isDeeplyMode changes
  const sparksQuery = trpc.sparks.getDailySparks.useQuery(
    { pairId: pairId!, isDeeplyUs: isDeeplyMode },
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
      <Animated.View style={[styles.centerContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.loadingText, { color: accentColor }]}>Loading your sparks…</Text>
      </Animated.View>
    );
  }

  // --- No Pair State ---
  if (!pairId) {
    return (
      <Animated.View style={[styles.centerContainer, { backgroundColor }]}>
        <Text style={[styles.emptyTitle, { color: accentColor }]}>No pair found</Text>
        <Text style={styles.emptyBody}>Link up with your partner first.</Text>
      </Animated.View>
    );
  }

  const sparks = sparksQuery.data ?? [];

  // --- Empty State ---
  if (sparks.length === 0) {
    return (
      <Animated.View style={[styles.container, { backgroundColor }]}>
        <View style={styles.scrollContent}>
          <Text style={[styles.header, { color: accentColor }]}>{headerText}</Text>
          <ModeToggle isDeeply={isDeeplyMode} onToggle={handleToggle} />
          <View style={styles.emptyCenter}>
            <Text style={[styles.emptyTitle, { color: accentColor }]}>You're all caught up for today.</Text>
            <Text style={styles.emptyBody}>New sparks drop daily. Come back tomorrow.</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // Sort: UNANSWERED first, then WAITING, then REVEALED
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
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={sparksQuery.isFetching}
            onRefresh={() => sparksQuery.refetch()}
            tintColor={accentColor}
          />
        }
      >
        {/* Header */}
        <Text style={[styles.header, { color: accentColor }]}>{headerText}</Text>

        {/* Mode Toggle */}
        <ModeToggle isDeeply={isDeeplyMode} onToggle={handleToggle} />

        {/* Active Spark Card */}
        <View style={[
          styles.card,
          { backgroundColor: getCardColor(sortedSparks.indexOf(activeSpark), isDeeplyMode) },
          isDeeplyMode && styles.cardDeeply,
        ]}>

          {/* --- UNANSWERED --- */}
          {activeSpark.status === 'UNANSWERED' && (
            <View style={styles.cardInner}>
              <Text style={[styles.typeLabel, isDeeplyMode && styles.typeLabelDeeply]}>
                {activeSpark.type.replace(/_/g, ' ')}
              </Text>

              {activeSpark.type === 'WOULD_YOU_RATHER' ? (
                <>
                  <Text style={[styles.promptText, isDeeplyMode && styles.promptTextDeeply]}>
                    Would you rather…
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      isDeeplyMode && styles.optionButtonDeeply,
                      selectedOption === content.optionA && (isDeeplyMode ? styles.optionSelectedDeeply : styles.optionSelected),
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setSelectedOption(content.optionA); }}
                  >
                    <Text style={[styles.optionText, isDeeplyMode && styles.optionTextDeeply]}>
                      {content.optionA}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      isDeeplyMode && styles.optionButtonDeeply,
                      selectedOption === content.optionB && (isDeeplyMode ? styles.optionSelectedDeeply : styles.optionSelected),
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setSelectedOption(content.optionB); }}
                  >
                    <Text style={[styles.optionText, isDeeplyMode && styles.optionTextDeeply]}>
                      {content.optionB}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.promptText, isDeeplyMode && styles.promptTextDeeply]}>
                    {content.prompt}
                  </Text>
                  <TextInput
                    style={[styles.textInput, isDeeplyMode && styles.textInputDeeply]}
                    placeholder="Your answer…"
                    placeholderTextColor={isDeeplyMode ? '#8B6E6E' : '#666'}
                    value={answerText}
                    onChangeText={setAnswerText}
                    multiline
                  />
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isDeeplyMode && styles.submitButtonDeeply,
                  submitMutation.isPending && styles.submitDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitMutation.isPending}
              >
                <Text style={[styles.submitText, { color: accentColor }]}>
                  {submitMutation.isPending ? 'Sending…' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --- WAITING_ON_PARTNER --- */}
          {activeSpark.status === 'WAITING_ON_PARTNER' && (
            <View style={styles.cardInner}>
              <Text style={[styles.typeLabel, isDeeplyMode && styles.typeLabelDeeply]}>
                {activeSpark.type.replace(/_/g, ' ')}
              </Text>
              <Text style={[styles.promptText, isDeeplyMode && styles.promptTextDeeply]}>
                {content.prompt || 'Would you rather…'}
              </Text>
              <Text style={[styles.answeredNote, isDeeplyMode && { color: '#B76E79' }]}>
                Your answer is locked in ✓
              </Text>
              <View style={[styles.frostedOverlay, isDeeplyMode && styles.frostedOverlayDeeply]}>
                <Text style={[styles.waitingText, isDeeplyMode && { color: '#B76E79' }]}>
                  Waiting on partner…
                </Text>
              </View>
            </View>
          )}

          {/* --- REVEALED --- */}
          {activeSpark.status === 'REVEALED' && (
            <View style={styles.cardInner}>
              <Text style={[styles.typeLabel, isDeeplyMode && styles.typeLabelDeeply]}>
                {activeSpark.type.replace(/_/g, ' ')}
              </Text>
              <Text style={[styles.promptText, isDeeplyMode && styles.promptTextDeeply]}>
                {content.prompt || 'Would you rather…'}
              </Text>

              <View style={styles.answersContainer}>
                <View style={[styles.answerBubble, isDeeplyMode && styles.answerBubbleDeeply]}>
                  <Text style={[styles.answerLabel, isDeeplyMode && styles.answerLabelDeeply]}>You</Text>
                  <Text style={[styles.answerText, isDeeplyMode && styles.answerTextDeeply]}>
                    {activeSpark.user1Answer}
                  </Text>
                </View>
                <View style={[styles.answerBubble, isDeeplyMode && styles.answerBubbleDeeply]}>
                  <Text style={[styles.answerLabel, isDeeplyMode && styles.answerLabelDeeply]}>Partner</Text>
                  <Text style={[styles.answerText, isDeeplyMode && styles.answerTextDeeply]}>
                    {activeSpark.user2Answer}
                  </Text>
                </View>
              </View>

              {activeSpark.bentlySynthesis && (
                <View style={[styles.synthesisContainer, isDeeplyMode && styles.synthesisContainerDeeply]}>
                  <Text style={[styles.synthesisText, isDeeplyMode && styles.synthesisTextDeeply]}>
                    {activeSpark.bentlySynthesis}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Remaining sparks count */}
        {sortedSparks.length > 1 && (
          <Text style={[styles.remainingText, isDeeplyMode && { color: '#8B6E6E' }]}>
            {sortedSparks.filter(s => s.status === 'UNANSWERED').length} more spark
            {sortedSparks.filter(s => s.status === 'UNANSWERED').length !== 1 ? 's' : ''} today
          </Text>
        )}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Layout
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },

  // Header
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  emptyBody: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' },

  // Card — Standard
  card: { borderRadius: 24, padding: 24, minHeight: 300, overflow: 'hidden', position: 'relative' },
  cardDeeply: { borderWidth: 1, borderColor: 'rgba(183,110,121,0.3)' },
  cardInner: { flex: 1, zIndex: 1 },
  typeLabel: { fontSize: 11, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  typeLabelDeeply: { color: '#B76E79' },
  promptText: { fontFamily: 'Fraunces', fontSize: 20, color: '#1A1A1A', marginBottom: 20 },
  promptTextDeeply: { color: '#F0E0E0' },

  // Options — Standard
  optionButton: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  optionButtonDeeply: { backgroundColor: 'rgba(183,110,121,0.15)', borderColor: 'rgba(183,110,121,0.2)' },
  optionSelected: { borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.15)' },
  optionSelectedDeeply: { borderColor: '#B76E79', backgroundColor: 'rgba(183,110,121,0.3)' },
  optionText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  optionTextDeeply: { color: '#F0E0E0' },

  // Text input
  textInput: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 16, fontSize: 16, color: '#1A1A1A', minHeight: 80, textAlignVertical: 'top' },
  textInputDeeply: { backgroundColor: 'rgba(183,110,121,0.1)', color: '#F0E0E0', borderWidth: 1, borderColor: 'rgba(183,110,121,0.3)' },

  // Submit
  submitButton: { backgroundColor: '#080808', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 16 },
  submitButtonDeeply: { backgroundColor: '#1A0A0A', borderWidth: 1, borderColor: 'rgba(183,110,121,0.4)' },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 16, fontWeight: 'bold' },

  // Waiting state
  answeredNote: { color: '#333', fontSize: 13, marginBottom: 8 },
  frostedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
  frostedOverlayDeeply: { backgroundColor: 'rgba(17,5,5,0.7)' },
  waitingText: { color: '#080808', fontWeight: 'bold', fontSize: 16 },

  // Revealed state
  answersContainer: { marginTop: 8, gap: 12 },
  answerBubble: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: 12 },
  answerBubbleDeeply: { backgroundColor: 'rgba(183,110,121,0.15)', borderWidth: 1, borderColor: 'rgba(183,110,121,0.2)' },
  answerLabel: { fontSize: 11, fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: 4 },
  answerLabelDeeply: { color: '#B76E79' },
  answerText: { fontSize: 15, color: '#1A1A1A' },
  answerTextDeeply: { color: '#F0E0E0' },
  synthesisContainer: { marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 16 },
  synthesisContainerDeeply: { borderTopColor: 'rgba(183,110,121,0.3)' },
  synthesisText: { fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 16, color: '#1A1A1A', lineHeight: 24 },
  synthesisTextDeeply: { color: '#F0E0E0' },

  // Footer
  remainingText: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 16 },
});
