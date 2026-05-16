// packages/mobile/app/(onboarding)/join.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';

export default function JoinScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const acceptInvite = trpc.pairs.acceptInvite.useMutation({
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/dashboard');
    },
    onError: (err) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message ?? 'Invalid or expired code.');
    },
  });

  const handleChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(clean);
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (code.length !== 8) { setError('Code must be 8 characters.'); return; }
    setError('');
    acceptInvite.mutate({ code });
  };

  return (
    <View style={s.container}>
      <Text style={s.label}>CommonGround</Text>
      <Text style={s.heading}>Enter Code</Text>
      <Text style={s.sub}>
        Your partner generated a code. Enter it here to connect.
      </Text>

      <TextInput
        style={s.input}
        value={code}
        onChangeText={handleChange}
        placeholder="A1B2C3D4"
        placeholderTextColor="#2A2A2A"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={8}
        autoFocus
      />

      {error ? <Text style={s.error}>{error}</Text> : null}

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.btnPrimary, (code.length !== 8 || acceptInvite.isPending) && s.disabled]}
          onPress={handleSubmit}
          disabled={code.length !== 8 || acceptInvite.isPending}
        >
          <Text style={s.btnPrimaryText}>
            {acceptInvite.isPending ? 'Connecting...' : 'Connect'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => router.push('/(onboarding)/invite')}
        >
          <Text style={s.btnSecondaryText}>Generate Code Instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808', padding: 32, justifyContent: 'center' },
  label: { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 },
  heading: { fontFamily: 'SpaceMono', fontSize: 36, color: '#F5F5F5', letterSpacing: -1, textTransform: 'uppercase', marginBottom: 12 },
  sub: { fontSize: 14, color: '#808080', lineHeight: 22, marginBottom: 48 },
  input: { fontFamily: 'SpaceMono', fontSize: 32, color: '#D4AF37', letterSpacing: 10, textAlign: 'center', backgroundColor: '#0F0F0F', borderWidth: 1, borderColor: '#1E1E1E', padding: 24, marginBottom: 8 },
  error: { fontFamily: 'SpaceMono', fontSize: 10, color: '#E63946', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 },
  actions: { gap: 12, marginTop: 24 },
  btnPrimary: { backgroundColor: '#D4AF37', padding: 16, alignItems: 'center' },
  btnPrimaryText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#080808', letterSpacing: 3, textTransform: 'uppercase' },
  btnSecondary: { borderWidth: 1, borderColor: '#1E1E1E', padding: 16, alignItems: 'center' },
  btnSecondaryText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#B0B0B0', letterSpacing: 3, textTransform: 'uppercase' },
  disabled: { opacity: 0.3 },
});
