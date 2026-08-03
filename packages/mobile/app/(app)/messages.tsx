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
import { trpc } from '../../src/lib/trpc';

const BENTLY_SYSTEM_ID = 'BENTLY_SYSTEM';

export default function MessagesScreen() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Fetch the authenticated user's pair
  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;
  const currentUserId = pairQuery.data?.user1Id; // Will compare against senderId

  // Fetch messages using the live pairId
  const getMessagesQuery = trpc.messages.getMessages.useQuery(
    { pairId: pairId! },
    { enabled: !!pairId, refetchInterval: 3000 }
  );

  const sendMessageMutation = trpc.messages.sendMessage.useMutation();

  const messages = getMessagesQuery.data ?? [];

  const handleSendMessage = async () => {
    if (!message.trim() || !pairId) return;

    const userMessage = message;
    setMessage('');
    setSending(true);

    try {
      await sendMessageMutation.mutateAsync({
        pairId,
        content: userMessage,
      });
      // Refetch to get new messages + potential Bently intervention
      getMessagesQuery.refetch();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  // --- Loading State ---
  if (pairQuery.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Connecting…</Text>
      </View>
    );
  }

  // --- No Pair State ---
  if (!pairId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No pair found</Text>
        <Text style={styles.emptyBody}>Link up with your partner to start messaging.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <ScrollView ref={scrollRef} style={styles.messagesContainer}>
        {messages.map((msg, idx) => {
          const isBently = msg.userId === BENTLY_SYSTEM_ID;
          const isCurrentUser = msg.userId === currentUserId;

          if (isBently) {
            return (
              <View key={msg.id ?? idx} style={styles.bentlyBubble}>
                <Text style={styles.bentlyLabel}>Bently</Text>
                <Text style={styles.bentlyText}>{msg.content}</Text>
              </View>
            );
          }

          return (
            <View
              key={msg.id ?? idx}
              style={[
                styles.messageBubble,
                isCurrentUser ? styles.userMessage : styles.partnerMessage,
              ]}
            >
              <Text style={styles.messageText}>{msg.content}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={message}
          onChangeText={setMessage}
          editable={!sending}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={sending}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#080808',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { color: '#D4AF37', marginTop: 12, fontSize: 14 },
  emptyTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  emptyBody: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageBubble: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#D4AF37',
    borderBottomRightRadius: 4,
  },
  partnerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#222',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  // Bently system message
  bentlyBubble: {
    alignSelf: 'center',
    backgroundColor: 'rgba(183,110,121,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(183,110,121,0.3)',
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
    maxWidth: '90%',
  },
  bentlyLabel: {
    color: '#B76E79',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bentlyText: {
    color: '#F0E0E0',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#080808',
    fontWeight: 'bold',
  },
});
