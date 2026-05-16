// packages/mobile/app/(app)/bently.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';

const STATE_COLORS: Record<string, string> = {
  ALIGNED: '#10B981', DORMANT: '#6B7280', MISALIGNED: '#F59E0B',
  CAPACITY_BLOCKED: '#9D4EDD', TRUST_FRACTURED: '#E63946',
};
const STATE_LABELS: Record<string, string> = {
  ALIGNED: 'Aligned', DORMANT: 'Dormant', MISALIGNED: 'Misaligned',
  CAPACITY_BLOCKED: 'Capacity Blocked', TRUST_FRACTURED: 'Trust Fractured',
};

interface Entry {
  id: string; userMessage: string; response: string;
  state: string; xpEarned: number; timestamp: Date;
}

function ThinkingIndicator() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={bs.thinkingRow}>
      <Animated.Text style={[bs.thinkingDot, { opacity: anim }]}>█</Animated.Text>
      <Animated.Text style={[bs.thinkingDot, { opacity: anim }]}>█</Animated.Text>
      <Animated.Text style={[bs.thinkingDot, { opacity: anim }]}>█</Animated.Text>
    </View>
  );
}

export default function BentlyScreen() {
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const stateQuery = trpc.pairs.getRelationalState.useQuery(
    { pairId: pairId! }, { enabled: !!pairId }
  );

  const coachMutation = trpc.bently.coach.useMutation({
    onSuccess: (data, vars) => {
      setEntries(prev => [...prev, {
        id: Math.random().toString(), userMessage: vars.message,
        response: data.response, state: data.state,
        xpEarned: data.xpEarned, timestamp: new Date(),
      }]);
      setIsThinking(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => setIsThinking(false),
  });

  const soloMutation = trpc.bently.coachSolo.useMutation({
    onSuccess: (data, vars) => {
      setEntries(prev => [...prev, {
        id: Math.random().toString(), userMessage: vars.message,
        response: data.response, state: 'DORMANT',
        xpEarned: 0, timestamp: new Date(),
      }]);
      setIsThinking(false);
    },
    onError: () => setIsThinking(false),
  });

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [entries, isThinking]);

  const handleSubmit = () => {
    const message = input.trim();
    if (!message || isThinking) return;
    setInput('');
    setIsThinking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pairId) {
      coachMutation.mutate({ pairId, message, provider: 'claude' });
    } else {
      soloMutation.mutate({ message });
    }
  };

  const currentState = stateQuery.data?.state ?? 'DORMANT';

  return (
    <KeyboardAvoidingView
      style={bs.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={bs.header}>
        <View>
          <Text style={bs.label}>Bently</Text>
          <Text style={bs.heading}>What's happening?</Text>
        </View>
        {pairId && stateQuery.data && (
          <View style={bs.stateIndicator}>
            <Text style={bs.stateLabel}>Reading as</Text>
            <Text style={[bs.stateName, { color: STATE_COLORS[currentState] }]}>
              {STATE_LABELS[currentState]}
            </Text>
          </View>
        )}
      </View>

      {/* Conversation */}
      <ScrollView ref={scrollRef} style={bs.scroll} contentContainerStyle={bs.scrollContent}>
        {entries.length === 0 && !isThinking && (
          <View style={bs.empty}>
            <Text style={bs.emptyText}>Say what's actually happening.</Text>
          </View>
        )}
        {entries.map(entry => (
          <View key={entry.id} style={bs.entryGroup}>
            <View style={bs.userMsgRow}>
              <Text style={bs.userMsg}>{entry.userMessage}</Text>
            </View>
            <View style={bs.responseBlock}>
              <Text style={bs.responseText}>{entry.response}</Text>
              <View style={bs.responseMeta}>
                {entry.xpEarned > 0 && (
                  <Text style={bs.xp}>+{entry.xpEarned} xp</Text>
                )}
                <Text style={[bs.responseState, { color: STATE_COLORS[entry.state] }]}>
                  {STATE_LABELS[entry.state]}
                </Text>
              </View>
            </View>
          </View>
        ))}
        {isThinking && (
          <View style={bs.thinkingBlock}>
            <ThinkingIndicator />
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={bs.inputContainer}>
        <TextInput
          style={bs.input}
          value={input}
          onChangeText={setInput}
          placeholder="Say what's actually happening..."
          placeholderTextColor="#2A2A2A"
          multiline
          maxLength={2000}
          editable={!isThinking}
        />
        <TouchableOpacity
          style={[bs.sendBtn, (!input.trim() || isThinking) && bs.sendDisabled]}
          onPress={handleSubmit}
          disabled={!input.trim() || isThinking}
        >
          <Text style={bs.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const bs = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#080808' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  label:          { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
  heading:        { fontFamily: 'SpaceMono', fontSize: 22, color: '#F5F5F5', letterSpacing: -0.5, textTransform: 'uppercase' },
  stateIndicator: { alignItems: 'flex-end' },
  stateLabel:     { fontFamily: 'SpaceMono', fontSize: 9, color: '#808080', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  stateName:      { fontFamily: 'SpaceMono', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  scroll:         { flex: 1 },
  scrollContent:  { padding: 24, gap: 32 },
  empty:          { alignItems: 'center', paddingVertical: 48 },
  emptyText:      { fontFamily: 'SpaceMono', fontSize: 10, color: '#2A2A2A', textTransform: 'uppercase', letterSpacing: 2 },
  entryGroup:     { gap: 16 },
  userMsgRow:     { alignItems: 'flex-end' },
  userMsg:        { fontSize: 14, color: '#B0B0B0', textAlign: 'right', lineHeight: 22, maxWidth: '80%' },
  responseBlock:  { borderLeftWidth: 2, borderLeftColor: '#D4AF37', paddingLeft: 16, paddingVertical: 8 },
  responseText:   { fontSize: 14, color: '#F5F5F5', lineHeight: 24, marginBottom: 12 },
  responseMeta:   { flexDirection: 'row', gap: 16 },
  xp:             { fontFamily: 'SpaceMono', fontSize: 10, color: '#D4AF37', letterSpacing: 2, textTransform: 'uppercase' },
  responseState:  { fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  thinkingBlock:  { paddingLeft: 18, paddingVertical: 8 },
  thinkingRow:    { flexDirection: 'row', gap: 4 },
  thinkingDot:    { fontFamily: 'SpaceMono', fontSize: 14, color: '#D4AF37' },
  inputContainer: { borderTopWidth: 1, borderTopColor: '#1E1E1E', backgroundColor: '#0F0F0F', padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  input:          { flex: 1, fontSize: 14, color: '#F5F5F5', lineHeight: 22, maxHeight: 120, minHeight: 44 },
  sendBtn:        { backgroundColor: '#D4AF37', paddingHorizontal: 16, paddingVertical: 10 },
  sendText:       { fontFamily: 'SpaceMono', fontSize: 10, color: '#080808', letterSpacing: 2, textTransform: 'uppercase' },
  sendDisabled:   { opacity: 0.3 },
});
