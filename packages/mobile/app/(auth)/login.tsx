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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async () => {
    setError(null);

    if (!email || !password) {
      setError('Both fields needed.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    try {
      const result = await loginMutation.mutateAsync({ email, password });
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

        <Text style={styles.eyebrow}>SIGN IN</Text>
        <Text style={styles.title}>Welcome back.</Text>
        <View style={styles.divider} />

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
          placeholder="Password"
          placeholderTextColor="#555"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(null);
          }}
          secureTextEntry
          editable={!loading}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Opening…' : 'Sign in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.linkText}>
            New here?{' '}
            <Text style={styles.linkTextGold}>Create an account</Text>
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
    paddingTop: 80,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
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
