import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';
import { AppScreen, ActionButton, GlassCard, StatePill, sharedStyles } from '../../src/ui/primitives';

export default function BentlyScreen() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const historyQuery = trpc.bently.history.useQuery();
  const coachSoloMutation = trpc.bently.coachSolo.useMutation();
  const entries = useMemo(() => (historyQuery.data?.items || []).map((entry: any) => ({ ...entry, role: entry.author === 'bently' ? 'bently' : 'user' })), [historyQuery.data?.items]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || coachSoloMutation.isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await coachSoloMutation.mutateAsync({ message: text });
      setInput('');
      historyQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <AppScreen eyebrow="AI mediator" title="Let Bently read the middle, not just the message." subtitle="This thread stays with you. Bently answers as a relational mediator: warm, direct, and state-aware.">
      <GlassCard>
        <StatePill state={coachSoloMutation.data?.state || 'DORMANT'} />
        <Text style={styles.helperTitle}>Solo conversation</Text>
        <Text style={sharedStyles.helper}>When you bring a question here, Bently speaks to the pattern and the pressure instead of picking a side.</Text>
      </GlassCard>

      <GlassCard>
        <View style={styles.threadWrap}>
          {entries.length === 0 && <Text style={sharedStyles.helper}>Start anywhere: “We keep missing each other when stress is high.”</Text>}
          {entries.map((entry: any, idx: number) => (
            <View key={`${entry.createdAt}-${idx}`} style={[styles.messageRow, entry.role === 'user' ? styles.userRow : styles.bentlyRow]}>
              {entry.role === 'bently' && <Text style={styles.senderLabel}>BENTLY</Text>}
              <View style={[styles.bubble, entry.role === 'user' ? styles.userBubble : styles.bentlyBubble]}>
                <Text style={[styles.bubbleText, entry.role === 'user' ? styles.userText : null]}>{entry.content}</Text>
              </View>
            </View>
          ))}
          {coachSoloMutation.isPending && <ActivityIndicator size="small" color="#2C3B2E" />}
        </View>
      </GlassCard>

      <GlassCard>
        <TextInput style={[sharedStyles.field, sharedStyles.textarea]} placeholder="Describe what feels true between you two right now." placeholderTextColor="#7D867B" value={input} onChangeText={setInput} multiline maxLength={2000} />
        <ActionButton label={coachSoloMutation.isPending ? 'Bently is thinking…' : 'Ask Bently'} onPress={handleSend} disabled={!input.trim() || coachSoloMutation.isPending} />
      </GlassCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  helperTitle: { color: '#172117', fontSize: 26, fontFamily: 'serif' },
  threadWrap: { gap: 14 },
  messageRow: { gap: 6 },
  userRow: { alignItems: 'flex-end' },
  bentlyRow: { alignItems: 'flex-start' },
  senderLabel: { color: '#617160', fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase' },
  bubble: { borderRadius: 24, paddingHorizontal: 15, paddingVertical: 13, maxWidth: '86%' },
  userBubble: { backgroundColor: '#2C3B2E' },
  bentlyBubble: { backgroundColor: 'rgba(255,255,255,0.82)', borderWidth: 1, borderColor: '#E4DDD2' },
  bubbleText: { color: '#172117', fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
});
