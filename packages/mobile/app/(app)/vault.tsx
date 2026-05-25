import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AppScreen, ActionButton, GlassCard, sharedStyles } from '../../src/ui/primitives';
import { trpc } from '../../src/lib/trpc';

export default function VaultScreen() {
  const queryClient = useQueryClient();
  const vaultQuery = trpc.vault.list.useQuery();
  const createMutation = trpc.vault.create.useMutation();
  const [form, setForm] = useState({ title: '', description: '', kind: 'MOMENT' });

  const handleSave = async () => {
    await createMutation.mutateAsync(form);
    setForm({ title: '', description: '', kind: 'MOMENT' });
    queryClient.invalidateQueries({ queryKey: ['mobile-vault'] });
  };

  return (
    <AppScreen eyebrow="DeeplyUs vault" title="Keep the parts worth revisiting." subtitle="Photo and audio memories uploaded from the web app appear here too, alongside note-based memories you can add on mobile.">
      <GlassCard>
        <TextInput style={sharedStyles.field} placeholder="Memory title" placeholderTextColor="#7D867B" value={form.title} onChangeText={(title) => setForm((current) => ({ ...current, title }))} />
        <TextInput style={[sharedStyles.field, sharedStyles.textarea]} placeholder="Add the story behind this memory" placeholderTextColor="#7D867B" value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} multiline />
        <View style={styles.kindRow}>
          {['MOMENT', 'LETTER', 'MILESTONE'].map((kind) => (
            <ActionButton key={kind} label={kind} variant={form.kind === kind ? 'primary' : 'secondary'} onPress={() => setForm((current) => ({ ...current, kind }))} />
          ))}
        </View>
        <ActionButton label={createMutation.isPending ? 'Saving…' : 'Save note memory'} onPress={handleSave} disabled={!form.title.trim() || !form.description.trim() || createMutation.isPending} />
      </GlassCard>

      {(vaultQuery.data?.items || []).map((item: any) => (
        <GlassCard key={item.id}>
          <Text style={styles.kind}>{item.kind}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={sharedStyles.helper}>{item.description}</Text>
          {item.media?.map((media: any) => (
            media.contentType?.startsWith('image/') ? (
              <Image key={media.id} source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${media.url}` }} style={styles.image} resizeMode="cover" />
            ) : (
              <View key={media.id} style={styles.audioChip}><Text style={sharedStyles.helper}>{media.name}</Text></View>
            )
          ))}
        </GlassCard>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  kindRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  kind: { color: '#617160', fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase' },
  title: { color: '#172117', fontSize: 26, fontFamily: 'serif' },
  image: { width: '100%', height: 220, borderRadius: 24 },
  audioChip: { borderRadius: 18, padding: 14, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: '#E4DDD2' },
});