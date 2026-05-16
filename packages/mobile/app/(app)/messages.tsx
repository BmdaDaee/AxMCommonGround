// packages/mobile/app/(app)/messages.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';

interface Message {
  id: string; userId: string; content: string; createdAt: string | Date;
}

export default function MessagesScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const listRef = useRef<FlatList>(null);

  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;
  const currentUserId = pairQuery.data?.user1Id;

  const messagesQuery = trpc.messages.getMessages.useQuery(
    { pairId: pairId!, limit: 50 },
    { enabled: !!pairId }
  );

  const loadOlderQuery = trpc.messages.getMessages.useQuery(
    { pairId: pairId!, limit: 50, cursor },
    { enabled: false }
  );

  const sendMessage = trpc.messages.sendMessage.useMutation({
    onSuccess: (msg) => {
      setMessages(prev => [...prev, msg as Message]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data.items as Message[]);
      setCursor(messagesQuery.data.nextCursor);
      setHasMore(!!messagesQuery.data.nextCursor);
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, []);

  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOlder || !cursor) return;
    setLoadingOlder(true);
    const result = await loadOlderQuery.refetch();
    if (result.data) {
      setMessages(prev => [...(result.data!.items as Message[]), ...prev]);
      setCursor(result.data.nextCursor);
      setHasMore(!!result.data.nextCursor);
    }
    setLoadingOlder(false);
  }, [hasMore, loadingOlder, cursor]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || !pairId) return;
    setInput('');
    sendMessage.mutate({ pairId, content, type: 'TEXT' });
  };

  const formatTime = (date: string | Date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!pairId && !pairQuery.isLoading) {
    return (
      <View style={[ms.container, ms.center]}>
        <Text style={ms.emptyText}>No active pair</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={ms.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={ms.header}>
        <Text style={ms.label}>Messages</Text>
        <Text style={ms.heading}>Thread</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={ms.listContent}
        onScrollBeginDrag={({ nativeEvent }) => {
          if (nativeEvent.contentOffset.y < 80) loadOlder();
        }}
        ListHeaderComponent={
          loadingOlder ? (
            <Text style={ms.loadingOlder}>Loading older...</Text>
          ) : hasMore ? (
            <TouchableOpacity onPress={loadOlder}>
              <Text style={ms.loadMore}>Pull or tap for older</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          messagesQuery.isLoading ? (
            <Text style={ms.emptyText}>Loading thread...</Text>
          ) : (
            <Text style={ms.emptyText}>No messages yet</Text>
          )
        }
        renderItem={({ item }) => {
          const isSelf = item.userId === currentUserId;
          return (
            <View style={[ms.msgRow, isSelf ? ms.msgRowSelf : ms.msgRowPartner]}>
              <View style={[ms.bubble, isSelf ? ms.bubbleSelf : ms.bubblePartner]}>
                <Text style={[ms.msgText, isSelf ? ms.msgTextSelf : ms.msgTextPartner]}>
                  {item.content}
                </Text>
              </View>
              <Text style={[ms.time, isSelf ? ms.timeRight : ms.timeLeft]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
          );
        }}
      />

      <View style={ms.inputRow}>
        <TextInput
          style={ms.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#2A2A2A"
          multiline
          maxLength={5000}
        />
        <TouchableOpacity
          style={[ms.sendBtn, !input.trim() && ms.sendDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
        >
          <Text style={ms.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const ms = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#080808' },
  center:         { alignItems: 'center', justifyContent: 'center' },
  header:         { padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  label:          { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
  heading:        { fontFamily: 'SpaceMono', fontSize: 28, color: '#F5F5F5', letterSpacing: -0.5, textTransform: 'uppercase' },
  listContent:    { padding: 16, gap: 12, flexGrow: 1 },
  loadingOlder:   { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', paddingVertical: 12 },
  loadMore:       { fontFamily: 'SpaceMono', fontSize: 10, color: '#2A2A2A', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', paddingVertical: 12 },
  emptyText:      { fontFamily: 'SpaceMono', fontSize: 10, color: '#2A2A2A', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', paddingVertical: 48 },
  msgRow:         { gap: 4 },
  msgRowSelf:     { alignItems: 'flex-end' },
  msgRowPartner:  { alignItems: 'flex-start' },
  bubble:         { maxWidth: '75%', padding: 12 },
  bubbleSelf:     { backgroundColor: '#D4AF37' },
  bubblePartner:  { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1E1E1E' },
  msgText:        { fontSize: 14, lineHeight: 22 },
  msgTextSelf:    { color: '#080808' },
  msgTextPartner: { color: '#F5F5F5' },
  time:           { fontFamily: 'SpaceMono', fontSize: 9, color: '#808080' },
  timeRight:      { textAlign: 'right' },
  timeLeft:       { textAlign: 'left' },
  inputRow:       { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#1E1E1E', backgroundColor: '#0F0F0F', alignItems: 'flex-end' },
  input:          { flex: 1, fontSize: 14, color: '#F5F5F5', minHeight: 44, maxHeight: 120, lineHeight: 22, paddingTop: 12, paddingBottom: 12 },
  sendBtn:        { width: 44, height: 44, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  sendText:       { fontSize: 18, color: '#080808', fontWeight: '700' },
  sendDisabled:   { opacity: 0.3 },
});
