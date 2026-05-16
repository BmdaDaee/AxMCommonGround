// packages/mobile/app/(auth)/login.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';
import { setToken, setUser } from '../../src/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await setToken(data.token);
      await setUser(data.user);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/dashboard');
    },
    onError: (err) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message ?? 'Login failed. Check your credentials.');
    },
  });

  const handleLogin = () => {
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }
    loginMutation.mutate({ email: email.trim().toLowerCase(), password });
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.header}>
          <Text style={s.wordmark}>CommonGround</Text>
          <Text style={s.heading}>Welcome back.</Text>
          <Text style={s.sub}>Sign in to continue.</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.fieldLabel}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              placeholder="you@example.com"
              placeholderTextColor="#2A2A2A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              placeholder="••••••••"
              placeholderTextColor="#2A2A2A"
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btnPrimary, loginMutation.isPending && s.disabled]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            <Text style={s.btnPrimaryText}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>No account yet?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={s.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#080808' },
  content:        { flexGrow: 1, padding: 32, justifyContent: 'center' },
  header:         { marginBottom: 48 },
  wordmark:       { fontFamily: 'SpaceMono', fontSize: 10, color: '#D4AF37', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24 },
  heading:        { fontFamily: 'SpaceMono', fontSize: 36, color: '#F5F5F5', letterSpacing: -1, textTransform: 'uppercase', marginBottom: 8 },
  sub:            { fontSize: 14, color: '#808080', lineHeight: 22 },
  form:           { gap: 20, marginBottom: 40 },
  field:          { gap: 8 },
  fieldLabel:     { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 3, textTransform: 'uppercase' },
  input:          { backgroundColor: '#0F0F0F', borderWidth: 1, borderColor: '#1E1E1E', color: '#F5F5F5', fontSize: 15, padding: 16, fontFamily: 'SpaceMono' },
  error:          { fontFamily: 'SpaceMono', fontSize: 10, color: '#E63946', letterSpacing: 2, textTransform: 'uppercase' },
  btnPrimary:     { backgroundColor: '#D4AF37', padding: 18, alignItems: 'center' },
  btnPrimaryText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#080808', letterSpacing: 3, textTransform: 'uppercase' },
  disabled:       { opacity: 0.4 },
  footer:         { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  footerText:     { fontFamily: 'SpaceMono', fontSize: 10, color: '#808080', letterSpacing: 1 },
  footerLink:     { fontFamily: 'SpaceMono', fontSize: 10, color: '#D4AF37', letterSpacing: 1, textDecorationLine: 'underline' },
});
