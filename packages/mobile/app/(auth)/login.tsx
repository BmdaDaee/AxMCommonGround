import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppScreen, ActionButton, GlassCard, sharedStyles } from '../../src/ui/primitives';
import { trpc } from '../../src/lib/trpc';
import { setToken, setUser } from '../../src/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const loginMutation = trpc.auth.login.useMutation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError('Email and password are both needed.');
      return;
    }
    try {
      const result = await loginMutation.mutateAsync(form);
      await setToken(result.token);
      await setUser(result.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something held this up.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <AppScreen hideNav eyebrow="Sign in" title="Come back to the middle with clarity." subtitle="The same warm visual language from the web app now carries through mobile too.">
      <GlassCard>
        <TextInput testID="mobile-login-email-input" style={sharedStyles.field} placeholder="Email" placeholderTextColor="#7D867B" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(email) => { setForm((current) => ({ ...current, email })); setError(''); }} />
        <TextInput testID="mobile-login-password-input" style={sharedStyles.field} placeholder="Password" placeholderTextColor="#7D867B" secureTextEntry value={form.password} onChangeText={(password) => { setForm((current) => ({ ...current, password })); setError(''); }} />
        {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
        <ActionButton label={loginMutation.isPending ? 'Opening…' : 'Sign in'} onPress={handleSubmit} disabled={loginMutation.isPending} testID="mobile-login-submit-button" />
        <ActionButton label="Create account instead" variant="secondary" onPress={() => router.push('/(auth)/signup')} />
      </GlassCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  errorText: { color: '#9C4A37', fontSize: 13, lineHeight: 20 },
});