// Palette: Pastel Pulse (CommonGround) -- mirrors packages/mobile/src/lib/theme.ts.
// TODO(cleanup): import getTheme() directly instead of inlined hex values.
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';

type Msg = { role: 'user' | 'bently'; content: string; error?: boolean };

export default function BentlyScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // This screen is always SOLO mode — it's the private, one-to-one thread.
  // If the user is in an active pair, we persist through bently.coach so the
  // conversation survives across sessions, and it's read back through
  // bently.history, which enforces server-side that SOLO messages only ever
  // return to the user who wrote them. If there's no active pair yet, we fall
  // back to the unpersisted coachSolo endpoint (nothing to scope privacy on).
  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pair = pairQuery.data;
  const isPaired = !!pair && pair.status === 'ACTIVE';

  const historyQuery = trpc.bently.history.useQuery(
    { pairId: pair?.id ?? '' },
    { enabled: isPaired },
  );

  const coachMutation = trpc.bently.coach.useMutation();
  const coachSoloMutation = trpc.bently.coachSolo.useMutation();

  // Hydrate from persisted history once (paired users only)
  useEffect(() => {
    if (isPaired && historyQuery.data && messages.length === 0) {
      const hydrated: Msg[] = historyQuery.data.flatMap((row: any) => {
        // Each stored row is one Bently exchange: we only ever persisted the
        // Bently response, so we render it as a single bently-role bubble.
        // The user's own prompt text isn't stored server-side for SOLO rows
        // beyond what's needed to generate the response, so history replays
        // Bently's side; this session's live user turns render normally above.
        return [{ role: 'bently' as const, content: row.content }];
      });
      setMessages(hydrated);
    }
  }, [isPaired, historyQuery.data]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);

    try {
      let responseText: string;

      if (isPaired && pair) {
        const result = await coachMutation.mutateAsync({
          pairId: pair.id,
          message: text,
          mode: 'SOLO',
          provider: 'groq',
        });
        responseText = result.response;
      } else {
        const result = await coachSoloMutation.mutateAsync({
          message: text,
          provider: 'groq',
        });
        responseText = result.response;
      }

      setMessages((prev) => [
        ...prev,
        { role: 'bently', content: responseText },
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bently',
          content: "Something dropped between us. Try again when you're ready.",
          error: true,
        },
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, sending]);

  const loadingHistory = isPaired && historyQuery.isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>SOLO</Text>
          <Text style={styles.headerTitle}>Bently</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadingHistory && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color="#C97B5A" />
          </View>
        )}

        {!loadingHistory && messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEyebrow}>SOLO CONVERSATION</Text>
            <Text style={styles.emptyTitle}>One-to-one.</Text>
            <View style={styles.emptyDivider} />
            <Text style={styles.emptyBody}>
              This is yours alone. Your partner can't see this thread.
              {'\n\n'}
              Bently sits with you here — not as a coach, not as therapy.
              Just a presence that can hold what you bring without taking sides.
              {'\n\n'}
              Start anywhere.
            </Text>
          </View>
        )}

        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.messageRow,
              msg.role === 'user' ? styles.userRow : styles.bentlyRow,
            ]}
          >
            {msg.role === 'bently' && (
              <Text style={styles.senderLabel}>BENTLY</Text>
            )}
            <View
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.bentlyBubble,
                msg.error && styles.errorBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'user' && styles.userBubbleText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {sending && (
          <View style={[styles.messageRow, styles.bentlyRow]}>
            <Text style={styles.senderLabel}>BENTLY</Text>
            <View style={[styles.bubble, styles.bentlyBubble, styles.typingBubble]}>
              <View style={styles.typingDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Say what's on your mind…"
          placeholderTextColor="#9C9186"
          value={input}
          onChangeText={setInput}
          editable={!sending}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#F7F3EE" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
  },
  backLink: {
    color: '#6B6259',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerEyebrow: {
    color: '#9C9186',
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    color: '#C97B5A',
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyState: {
    paddingTop: 80,
    paddingHorizontal: 8,
  },
  emptyEyebrow: {
    color: '#9C9186',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#3A332C',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  emptyDivider: {
    width: 40,
    height: 1,
    backgroundColor: '#C97B5A',
    marginBottom: 20,
  },
  emptyBody: {
    color: '#6B6259',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '300',
  },
  messageRow: {
    marginBottom: 20,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  bentlyRow: {
    alignItems: 'flex-start',
  },
  senderLabel: {
    color: '#9C9186',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  bubble: {
    padding: 14,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#C97B5A',
    borderBottomRightRadius: 4,
  },
  bentlyBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    borderColor: '#C97C87',
    backgroundColor: '#FBEEEF',
  },
  bubbleText: {
    color: '#3A332C',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '300',
  },
  userBubbleText: {
    color: '#F7F3EE',
    fontWeight: '400',
  },
  typingBubble: {
    paddingVertical: 16,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C97B5A',
    opacity: 0.6,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D5',
    gap: 8,
    backgroundColor: '#F7F3EE',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    color: '#3A332C',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    fontSize: 15,
    maxHeight: 120,
    fontWeight: '300',
  },
  sendButton: {
    backgroundColor: '#C97B5A',
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#F7F3EE',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
