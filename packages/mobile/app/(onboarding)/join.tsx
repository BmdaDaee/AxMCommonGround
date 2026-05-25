import { useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppScreen, ActionButton, GlassCard, sharedStyles } from '../../src/ui/primitives';
import { trpc } from '../../src/lib/trpc';

export default function JoinScreen() {
  const router = useRouter();
  const acceptInviteMutation = trpc.pairs.acceptInvite.useMutation();
  const [inviteCode, setInviteCode] = useState('');

  const handleJoin = async () => {
    try {
      await acceptInviteMutation.mutateAsync({ inviteCode: inviteCode.trim().toUpperCase() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('You are connected.', 'Your shared dashboard is ready.');
      router.replace('/(app)/dashboard');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Couldn’t join yet', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <AppScreen hideNav eyebrow="Join with a code" title="Enter the code they shared with you." subtitle="As soon as it matches, the shared room becomes active and the relationship layer starts reading the middle.">
      <GlassCard>
        <TextInput style={sharedStyles.field} placeholder="A1B2C3D4" placeholderTextColor="#7D867B" autoCapitalize="characters" value={inviteCode} onChangeText={(value) => setInviteCode(value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase())} testID="mobile-join-code-input" />
        <ActionButton label={acceptInviteMutation.isPending ? 'Connecting…' : 'Connect our space'} onPress={handleJoin} disabled={inviteCode.length !== 8 || acceptInviteMutation.isPending} testID="mobile-join-submit-button" />
        <ActionButton label="Generate a new code" variant="secondary" onPress={() => router.push('/(onboarding)/invite')} />
      </GlassCard>
    </AppScreen>
  );
}