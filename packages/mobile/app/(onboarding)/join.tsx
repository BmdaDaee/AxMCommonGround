import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../src/lib/trpc';

export default function JoinScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const acceptInviteMutation = trpc.pairs.acceptInvite.useMutation();

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      await acceptInviteMutation.mutateAsync({ inviteCode: inviteCode.trim() });
      
      Alert.alert('Success', 'Connected with your partner!');
      
      // Navigate to dashboard
      router.replace('/(app)/dashboard');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Pair</Text>
      <Text style={styles.subtitle}>Enter the invite code your partner shared</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Invite Code"
        value={inviteCode}
        onChangeText={setInviteCode}
        editable={!loading}
        placeholderTextColor="#999"
        autoCapitalize="characters"
      />
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(onboarding)/invite')}>
        <Text style={styles.link}>Or create a new invite</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#080808',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
    color: '#fff',
    backgroundColor: '#111',
    fontSize: 18,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#080808',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#D4AF37',
    textAlign: 'center',
    marginTop: 20,
  },
});
