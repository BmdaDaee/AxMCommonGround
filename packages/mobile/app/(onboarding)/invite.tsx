import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { trpc } from '../../src/lib/trpc';

export default function InviteScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const createInviteMutation = trpc.pairs.createInvite.useMutation();

  const handleCreateInvite = async () => {
    setLoading(true);
    try {
      const result = await createInviteMutation.mutateAsync();
      
      // Copy invite code to clipboard
      await Clipboard.setStringAsync(result.inviteCode);
      
      Alert.alert('Success', 'Invite code copied to clipboard!', [
        {
          text: 'Share',
          onPress: () => {
            // In a real app, use Share API
            Alert.alert('Share this code with your partner', result.inviteCode);
          },
        },
      ]);
      
      // Navigate to dashboard
      router.replace('/(app)/dashboard');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invite Your Partner</Text>
      <Text style={styles.subtitle}>Create an invitation code to send to your partner</Text>
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreateInvite}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Invite Code'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(onboarding)/join')}>
        <Text style={styles.link}>Or join an existing pair</Text>
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
    alignItems: 'center',
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
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 20,
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
  },
});
