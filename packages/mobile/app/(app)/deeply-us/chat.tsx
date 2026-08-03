import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../../src/lib/trpc';
import { getTheme } from '../../../src/lib/theme';

const theme = getTheme(true);

export default function DeeplyUsChatScreen() {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const historyQuery = trpc.deeplyUs.history.useQuery(
    { pairId: pairId! },
    { enabled: !!pairId, refetchInterval: 5000 },
  );

  const chatMutation = trpc.deeplyUs.chat.useMutation({
    onSuccess: () => {
      historyQuery.refetch();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  useEffect(() => {
    if (historyQuery.data) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [historyQuery.data]);

  const handleSend = () => {
    if (!message.trim() || !pairId || chatMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    chatMutation.mutate({ pairId, message: message.trim() });
    setMessage('');
  };

  if (pairQuery.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  const messages = historyQuery.data || [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bently</Text>
        <Text style={styles.headerSubtitle}>DeeplyUs Mode</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◈</Text>
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyBody}>
              This is your intimate space. Talk to Bently about desires,
              boundaries, insecurities — the things that are hardest to say.
              She's here to help you say them.
            </Text>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {msg.role === 'assistant' && (
              <Text style={styles.bentlyLabel}>BENTLY</Text>
            )}
            <Text
              style={[
                styles.messageText,
                msg.role === 'user' ? styles.userText : styles.assistantText,
              ]}
            >
              {msg.content}
            </Text>
            {msg.xpEarned > 0 && (
              <Text style={styles.xpBadge}>+{msg.xpEarned} XP</Text>
            )}
          </View>
        ))}

        {chatMutation.isPending && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Talk to Bently..."
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || chatMutation.isPending}
        >
          <Text style={styles.sendButtonText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.base,
  },
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.DEFAULT,
  },
  headerTitle: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary.DEFAULT,
  },
  headerSubtitle: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    color: theme.colors.primary.DEFAULT,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyBody: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: `${theme.colors.primary.DEFAULT}40`,
  },
  bentlyLabel: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary.DEFAULT,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  messageText: {
    fontSize: theme.typography.size.base,
    lineHeight: 22,
  },
  userText: {
    color: theme.colors.text.inverse,
  },
  assistantText: {
    color: theme.colors.text.primary,
  },
  xpBadge: {
    fontSize: 11,
    color: theme.colors.primary.DEFAULT,
    marginTop: 4,
    fontWeight: theme.typography.weight.semibold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.DEFAULT,
    backgroundColor: theme.colors.background.base,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.size.base,
    color: theme.colors.text.primary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.inverse,
  },
});
