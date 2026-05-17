import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { trpc } from '../../src/lib/trpc';

export default function MessagesScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string; sender?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const sendMessageMutation = trpc.messages.sendMessage.useMutation();
  const getMessagesQuery = trpc.messages.getMessages.useQuery({ pairId: 'current' });

  useEffect(() => {
    if (getMessagesQuery.data) {
      setMessages(getMessagesQuery.data.map(msg => ({
        role: msg.senderId === 'currentUser' ? 'user' : 'partner',
        content: msg.content,
        sender: msg.senderName,
      })));
    }
  }, [getMessagesQuery.data]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      await sendMessageMutation.mutateAsync({
        pairId: 'current',
        content: userMessage,
      });

      // Refetch messages
      getMessagesQuery.refetch();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <ScrollView ref={scrollRef} style={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userMessage : styles.partnerMessage,
            ]}
          >
            {msg.role === 'partner' && msg.sender && (
              <Text style={styles.senderName}>{msg.sender}</Text>
            )}
            <Text style={styles.messageText}>{msg.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={message}
          onChangeText={setMessage}
          editable={!loading}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={loading}
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
    borderRadius: 8,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#D4AF37',
  },
  partnerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#222',
  },
  senderName: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
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
