import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../src/lib/trpc';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const signupMutation = trpc.auth.signup.useMutation();

  const handleSignup = async () => {
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('All fields needed.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (password.length < 8) {
      setError('Password needs at least 8 characters.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    try {
      const result = await signupMutation.mutateAsync({ email, password });
      await SecureStore.setItemAsync('authToken', result.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something held this up.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brandSmall}>AxM</Text>
          <Text style={styles.brand}>CommonGround</Text>
        </View>

        <Text style={styles.eyebrow}>CREATE ACCOUNT</Text>
        <Text style={styles.title}>Start here.</Text>
        <View style={styles.divider} />

        <Text style={styles.body}>
          This account is yours. After signing in, you'll invite your partner —
          the space stays quiet until both of you are here.
        </Text>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Email"
          placeholderTextColor="#555"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Password (8+ characters)"
          placeholderTextColor="#555"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(null);
          }}
          secureTextEntry
          editable={!loading}
        />

        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Confirm password"
          placeholderTextColor="#555"
          value={confirmPassword}
          onChangeText={(t) => {
            setConfirmPassword(t);
            setError(null);
          }}
          secureTextEntry
          editable={!loading}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Creating…' : 'Create account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={styles.linkTextGold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
  },
  brandSmall: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 4,
  },
  brand: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: -0.3,
  },
  eyebrow: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#D4AF37',
    marginBottom: 20,
  },
  body: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '300',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 4,
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
    fontWeight: '300',
  },
  inputError: {
    borderColor: '#5a1f1f',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '300',
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#080808',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#888',
    fontSize: 14,
  },
  linkTextGold: {
    color: '#D4AF37',
    fontWeight: '500',
  },
});
