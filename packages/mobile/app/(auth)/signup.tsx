// packages/mobile/app/(auth)/signup.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';
import { setToken, setUser } from '../../src/lib/auth';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: async (data) => {
      await setToken(data.token);
      await setUser(data.user);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // New users go to onboarding to pair up
      router.replace('/(onboarding)/invite');
    },
    onError: (err) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message ?? 'Signup failed. Try again.');
    },
  });

  const handleSignup = () => {
    setError('');
    if (!name.trim() || name.trim().length < 2) { setError('Name must be at least 2 characters.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    signupMutation.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
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
          <Text style={s.heading}>Create your{'\n'}account.</Text>
          <Text style={s.sub}>One account per person. You'll pair with your partner after.</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.fieldLabel}>Your Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={(v) => { setName(v); setError(''); }}
              placeholder="First name is fine"
              placeholderTextColor="#2A2A2A"
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="given-name"
            />
          </View>

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
              placeholder="Min. 8 characters"
              placeholderTextColor="#2A2A2A"
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>Confirm Password</Text>
            <TextInput
              style={s.input}
              value={confirm}
              onChangeText={(v) => { setConfirm(v); setError(''); }}
              placeholder="Same password again"
              placeholderTextColor="#2A2A2A"
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btnPrimary, signupMutation.isPending && s.disabled]}
            onPress={handleSignup}
            disabled={signupMutation.isPending}
          >
            <Text style={s.btnPrimaryText}>
              {signupMutation.isPending ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={s.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#080808' },
  content:        { flexGrow: 1, padding: 32, justifyContent: 'center' },
  header:         { marginBottom: 40 },
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
