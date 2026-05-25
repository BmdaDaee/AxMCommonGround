import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '../../src/lib/trpc';
import { AppScreen, ActionButton, GlassCard, PresenceChip, sharedStyles } from '../../src/ui/primitives';

export default function MessagesScreen() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const sendMessageMutation = trpc.messages.sendMessage.useMutation();
  const messagesQuery = trpc.messages.getMessages.useQuery();
  const meQuery = trpc.auth.me.useQuery();
  const items = useMemo(() => messagesQuery.data?.items || [], [messagesQuery.data?.items]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({ content: message.trim() });
      setMessage('');
      messagesQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!messagesQuery.data?.pair) {
    return <AppScreen eyebrow="Direct thread" title="Messages unlock after pairing." subtitle="Invite your partner first, then your shared conversation thread becomes active." />;
  }

  return (
    <AppScreen eyebrow="Direct thread" title="Speak without leaving the room." subtitle="Unread and presence now sync directly into mobile as well.">
      <GlassCard>
        <PresenceChip presence={messagesQuery.data?.partnerPresence} />
        <View style={styles.threadWrap}>
          {items.map((msg: any) => {
            const self = msg.senderId === meQuery.data?.user?.id;
            return (
              <View key={msg.id} style={[styles.messageWrap, self ? styles.selfWrap : styles.partnerWrap]}>
                {!self && <Text style={styles.senderName}>{msg.senderName}</Text>}
                <View style={[styles.messageBubble, self ? styles.selfBubble : styles.partnerBubble]}>
                  <Text style={[styles.messageText, self ? styles.selfText : null]}>{msg.content}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard>
        <TextInput style={[sharedStyles.field, sharedStyles.textarea]} placeholder="Say what is true, not what only sounds safe." placeholderTextColor="#7D867B" value={message} onChangeText={setMessage} multiline />
        <ActionButton label={sendMessageMutation.isPending ? 'Sending…' : 'Send message'} onPress={handleSendMessage} disabled={!message.trim() || sendMessageMutation.isPending} />
      </GlassCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  threadWrap: { gap: 14 },
  messageWrap: { gap: 6 },
  selfWrap: { alignItems: 'flex-end' },
  partnerWrap: { alignItems: 'flex-start' },
  senderName: { color: '#617160', fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase' },
  messageBubble: { maxWidth: '86%', borderRadius: 24, paddingHorizontal: 15, paddingVertical: 13 },
  selfBubble: { backgroundColor: '#2C3B2E' },
  partnerBubble: { backgroundColor: 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: '#E4DDD2' },
  messageText: { color: '#172117', fontSize: 15, lineHeight: 22 },
  selfText: { color: '#fff' },
});
