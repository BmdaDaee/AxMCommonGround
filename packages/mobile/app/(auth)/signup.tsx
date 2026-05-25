import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppScreen, ActionButton, GlassCard, sharedStyles } from '../../src/ui/primitives';
import { trpc } from '../../src/lib/trpc';
import { setToken, setUser } from '../../src/lib/auth';

export default function SignupScreen() {
  const router = useRouter();
  const signupMutation = trpc.auth.signup.useMutation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Every field matters here.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords need to match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    try {
      const result = await signupMutation.mutateAsync({ name: form.name, email: form.email, password: form.password });
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
    <AppScreen hideNav eyebrow="Create account" title="Build the shared space before the conversation starts." subtitle="Your account opens the room. Your partner can join as soon as you send the invite code.">
      <GlassCard>
        <TextInput style={sharedStyles.field} placeholder="Your name" placeholderTextColor="#7D867B" value={form.name} onChangeText={(name) => { setForm((current) => ({ ...current, name })); setError(''); }} testID="mobile-signup-name-input" />
        <TextInput style={sharedStyles.field} placeholder="Email" placeholderTextColor="#7D867B" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(email) => { setForm((current) => ({ ...current, email })); setError(''); }} testID="mobile-signup-email-input" />
        <TextInput style={sharedStyles.field} placeholder="Password" placeholderTextColor="#7D867B" secureTextEntry value={form.password} onChangeText={(password) => { setForm((current) => ({ ...current, password })); setError(''); }} testID="mobile-signup-password-input" />
        <TextInput style={sharedStyles.field} placeholder="Confirm password" placeholderTextColor="#7D867B" secureTextEntry value={form.confirmPassword} onChangeText={(confirmPassword) => { setForm((current) => ({ ...current, confirmPassword })); setError(''); }} testID="mobile-signup-confirm-password-input" />
        {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
        <ActionButton label={signupMutation.isPending ? 'Creating…' : 'Create account'} onPress={handleSubmit} disabled={signupMutation.isPending} testID="mobile-signup-submit-button" />
        <ActionButton label="Already have an account" variant="secondary" onPress={() => router.push('/(auth)/login')} />
      </GlassCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  errorText: { color: '#9C4A37', fontSize: 13, lineHeight: 20 },
});