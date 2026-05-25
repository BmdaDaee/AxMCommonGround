import { useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen, ActionButton, GlassCard, sharedStyles } from '../src/ui/primitives';
import { getToken } from '../src/lib/auth';

const heroImage = 'https://images.unsplash.com/photo-1543829969-57899edf981b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwyfHxjb3VwbGUlMjBob2xkaW5nJTIwaGFuZHMlMjBzdW5zZXR8ZW58MHx8fHwxNzc5NjYxMzEwfDA&ixlib=rb-4.1.0&q=85';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) router.replace('/(app)/dashboard');
    })();
  }, [router]);

  return (
    <AppScreen
      hideNav
      eyebrow="Relationship operating system"
      title="Bring two people back to the middle."
      subtitle="The mobile experience now mirrors the editorial warmth of the new PWA — pairing, messages, Bently, vault memories, and live relational signals all in one place."
    >
      <ImageBackground source={{ uri: heroImage }} style={styles.heroImage} imageStyle={styles.heroImageInner}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroEyebrow}>Mobile-first CommonGround</Text>
          <Text style={styles.heroTitle}>A premium shared space that feels calm, soft, and intentional.</Text>
        </View>
      </ImageBackground>

      <GlassCard>
        <Text style={styles.cardTitle}>What’s inside</Text>
        <View style={styles.listWrap}>
          <Text style={sharedStyles.helper}>Invite your partner, read the relationship weather, talk directly, let Bently hold the middle, and keep important memories in the vault.</Text>
        </View>
      </GlassCard>

      <View style={styles.actions}>
        <ActionButton label="Create account" onPress={() => router.push('/(auth)/signup')} testID="mobile-start-signup-button" />
        <ActionButton label="I already have an account" variant="secondary" onPress={() => router.push('/(auth)/login')} testID="mobile-start-login-button" />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroImage: { minHeight: 320, borderRadius: 30, overflow: 'hidden', justifyContent: 'flex-end' },
  heroImageInner: { borderRadius: 30 },
  heroOverlay: { padding: 22, backgroundColor: 'rgba(23,33,23,0.28)' },
  heroEyebrow: { color: '#F8F4EC', fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 10 },
  heroTitle: { color: '#fff', fontSize: 34, lineHeight: 36, fontFamily: 'serif' },
  cardTitle: { color: '#172117', fontSize: 24, fontFamily: 'serif' },
  listWrap: { gap: 10 },
  actions: { gap: 12 },
});